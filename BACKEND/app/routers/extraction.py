from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from PIL import Image
from dotenv import load_dotenv
from groq import Groq
import pytesseract
import logging
import os
import uuid

from app.routers.auth import verify_token
from app.services.ocr_service import (
    TEMP_FOLDER,
    extraire_hybride,
)

load_dotenv()
logger = logging.getLogger("extraction")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MAX_IMAGE_BYTES = 8 * 1024 * 1024    # 8 Mo
MAX_AUDIO_BYTES = 25 * 1024 * 1024   # 25 Mo

IMAGE_EXT = {"image/jpeg": "jpg", "image/png": "png"}
AUDIO_EXT = {
    "audio/webm": "webm", "audio/wav": "wav", "audio/mp3": "mp3",
    "audio/mpeg": "mp3", "audio/m4a": "m4a", "audio/x-m4a": "m4a", "audio/ogg": "ogg",
}

# Toutes les routes exigent un token valide
router = APIRouter(
    prefix="/extract",
    tags=["Extraction"],
    dependencies=[Depends(verify_token)],
)


async def _save_upload(file: UploadFile, dest: str, max_bytes: int):
    """Écrit le fichier par morceaux et refuse s'il dépasse la taille max."""
    size = 0
    too_big = False
    with open(dest, "wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                too_big = True
                break
            out.write(chunk)
    if too_big:
        os.remove(dest)
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux (max {max_bytes // (1024 * 1024)} Mo)."
        )


@router.post("/scan")
async def extract_document(file: UploadFile = File(...)):
    ext = IMAGE_EXT.get(file.content_type)
    if not ext:
        raise HTTPException(
            status_code=400,
            detail="Format non supporté. Envoie un JPEG ou PNG."
        )

    # Nom généré côté serveur : jamais le nom envoyé par l'utilisateur
    temp_path = os.path.join(TEMP_FOLDER, f"{uuid.uuid4().hex}.{ext}")
    await _save_upload(file, temp_path, MAX_IMAGE_BYTES)

    try:
        # Vérifie que c'est réellement une image valide
        try:
            with Image.open(temp_path) as img:
                img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Le fichier n'est pas une image valide.")

        image = Image.open(temp_path)
        texte_brut = pytesseract.image_to_string(image, lang="fra")

        if not texte_brut.strip():
            raise HTTPException(
                status_code=422,
                detail="Aucun texte trouvé sur ce document."
            )

        try:
            data = extraire_hybride(texte_brut, temp_path)
        except Exception:
            logger.exception("Erreur pendant l'extraction")
            raise HTTPException(
                status_code=502,
                detail="Erreur pendant l'analyse du document. Réessayez."
            )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "texte_brut": texte_brut,
        "success": True,
        "data": data
    }


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcrit un fichier audio (motif de visite dicté) via Whisper (Groq)."""
    content_type_base = (file.content_type or "").split(";")[0].strip()
    ext = AUDIO_EXT.get(content_type_base)
    if not ext:
        raise HTTPException(status_code=400, detail="Format audio non supporté.")

    temp_path = os.path.join(TEMP_FOLDER, f"audio_{uuid.uuid4().hex}.{ext}")
    await _save_upload(file, temp_path, MAX_AUDIO_BYTES)

    try:
        with open(temp_path, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3-turbo",
                language="fr",
                response_format="text",
            )

        texte = transcription if isinstance(transcription, str) else transcription.text
        return {"success": True, "texte": texte.strip()}

    except Exception:
        logger.exception("Erreur de transcription")
        raise HTTPException(status_code=502, detail="Erreur lors de la transcription.")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)