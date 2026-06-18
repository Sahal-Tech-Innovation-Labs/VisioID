from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil
from PIL import Image
import os
import pytesseract
from groq import Groq
from dotenv import load_dotenv

from app.services.ocr_service import (
    TEMP_FOLDER,
    extraire_hybride,
)

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

router = APIRouter(
    prefix="/extract",
    tags=["Extraction"]
)

@router.post("/scan")
async def extract_document(file: UploadFile = File(...)):

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Format non supporté. Envoie un JPEG ou PNG."
        )

    temp_path = f"{TEMP_FOLDER}/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        image = Image.open(temp_path)
        texte_brut = pytesseract.image_to_string(image, lang="fra")

        if not texte_brut.strip():
            raise HTTPException(
                status_code=422,
                detail="Aucun texte trouvé sur ce document."
            )

        # On garde l'image sur disque jusqu'ici pour pouvoir en extraire
        # la photo de profil (détection de visage)
        data = extraire_hybride(texte_brut, temp_path)
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
    """
    Transcrit un fichier audio (motif de visite dicté) en texte
    via le modèle Whisper hébergé par Groq.
    """
    formats_acceptes = [
        "audio/webm", "audio/wav", "audio/mp3", "audio/mpeg",
        "audio/m4a", "audio/ogg", "audio/x-m4a",
    ]
    # Le navigateur ajoute parfois les codecs au content_type
    # (ex: "audio/webm;codecs=opus") : on compare juste le type de base.
    content_type_base = (file.content_type or "").split(";")[0].strip()
    if content_type_base not in formats_acceptes:
        raise HTTPException(
            status_code=400,
            detail=f"Format audio non supporté : {file.content_type}"
        )

    extension = file.filename.split(".")[-1] if "." in file.filename else "webm"
    temp_path = f"{TEMP_FOLDER}/audio_{file.filename or f'enregistrement.{extension}'}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        with open(temp_path, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3-turbo",
                language="fr",
                response_format="text",
            )

        texte = transcription if isinstance(transcription, str) else transcription.text

        return {
            "success": True,
            "texte": texte.strip()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la transcription : {str(e)}"
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)