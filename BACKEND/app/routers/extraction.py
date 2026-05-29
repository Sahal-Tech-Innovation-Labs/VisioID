from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil
from PIL import Image
import os
import pytesseract

from app.services.ocr_service import (
    TEMP_FOLDER,
    extraire_avec_ia,
    # detecter_type_doc,
    # extraire_nationalite,
    # extraire_champ,
    # extraire_numero_piece,
    # extraire_date_expiration,
    # extraire_date_naissance,
    # extraire_lieu_naissance,
    # extraire_date_delivrance,
    # extraire_sexe,
    # extraire_prenom,
)

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

    image = Image.open(temp_path)
    texte_brut = pytesseract.image_to_string(image, lang="fra")
    os.remove(temp_path)

    if not texte_brut.strip():
        raise HTTPException(
            status_code=422,
            detail="Aucun texte trouvé sur ce document."
        )

    data = extraire_avec_ia(texte_brut)

    return {
        "success": True,
        "data": data
    }

    # return {
    #     "success": True,
    #     "texte_brut": texte_brut,
    #     "data": {
    #         "type_doc":        detecter_type_doc(texte_brut),
    #         "numero_doc":      extraire_numero_piece(texte_brut),
    #         "nom":             extraire_champ(texte_brut, ["Nom", "NOM"]),
    #         "prenom":          extraire_prenom(texte_brut),
    #         "nationalite":     extraire_nationalite(texte_brut),
    #         "sexe":            extraire_sexe(texte_brut),
    #         "profession":      extraire_champ(texte_brut, ["Profession", "PROFESSION"]),
    #         "date_naissance":  extraire_date_naissance(texte_brut),
    #         "lieu_naissance":  extraire_lieu_naissance(texte_brut),
    #         "date_delivrance": extraire_date_delivrance(texte_brut),
    #         "date_expiration": extraire_date_expiration(texte_brut),
    #     }
    # }