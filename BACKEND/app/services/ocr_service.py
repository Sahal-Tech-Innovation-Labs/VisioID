import shutil
import os
import re
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
os.environ["TESSDATA_PREFIX"] = r"C:\Program Files\Tesseract-OCR\tessdata"

TEMP_FOLDER = "temp_images"
os.makedirs(TEMP_FOLDER, exist_ok=True)

def extraire_champ(texte, cles):
    for cle in cles:
        pattern = rf"{cle}\s*[:\-]?\s*([A-Za-zÀ-ÿ]+)"
        match = re.search(pattern, texte, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None

def detecter_type_doc(texte):
    texte_upper = texte.upper()
    if "PASSEPORT" in texte_upper:
        return "PASSEPORT"
    elif "IDENTITE" in texte_upper:  
        return "CNI"
    return "INCONNU"


def extraire_nationalite(texte):
    
    pattern = r"IDENTITE\s+(\w+)"
    match = re.search(pattern, texte, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


def extraire_prenom(texte):
    
    pattern = r"Pr[ée]noms?\s*[:\-]?\s*([A-Za-zÀ-ÿ\s\-]+)"
    match = re.search(pattern, texte, re.IGNORECASE)
    if match:
        return match.group(1).strip().split('\n')[0].strip()
    return None

def extraire_sexe(texte):
   
    pattern = r"Sexe\s*[:\-]?\s*([MF])"
    match = re.search(pattern, texte, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


def extraire_date_naissance(texte):
   
    pattern = r"N[ée]\(e\)\s*le\s*[:\-]?\s*([\d/\s]+)"
    match = re.search(pattern, texte, re.IGNORECASE)
    if match:
        
        date = match.group(1).strip().split('A')[0].strip()
        date = date.replace(" ", "")
        return date
    return None


def extraire_lieu_naissance(texte):
   
    pattern = r"N[ée]\(e\)\s*le\s*[:\-]?\s*[\d/\s]+A\s+([A-Za-zÀ-ÿ\s\'\-]+)"
    match = re.search(pattern, texte, re.IGNORECASE)
    if match:

        lieu = match.group(1).strip().split('\n')[0].strip()
        return lieu
    return None




def extraire_numero_piece(texte):
    
    pattern = r"Expire\s*le\s*[:\-]?\s*[\d/]+\s+([A-Z]\d{7,9})"
    match = re.search(pattern, texte, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


def extraire_date_expiration(texte):
   
    pattern = r"Expire\s*le\s*[:\-]?\s*([\d/]+)"
    match = re.search(pattern, texte, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


def extraire_date_delivrance(texte):
   
    pattern = r"D[ée]livr[ée]+e?\s*le\s*[:\-]?\s*[\-\s]*([\d/]+)"
    match = re.search(pattern, texte, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None