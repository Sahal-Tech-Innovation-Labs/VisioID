import os
import re
import json
import platform
import shutil
import pytesseract
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    os.environ["TESSDATA_PREFIX"] = r"C:\Program Files\Tesseract-OCR\tessdata"
else:
    pytesseract.pytesseract.tesseract_cmd = shutil.which("tesseract") or "/usr/bin/tesseract"
    os.environ.setdefault("TESSDATA_PREFIX", "/usr/share/tesseract-ocr/4.00/tessdata")

TEMP_FOLDER = "temp_images"
os.makedirs(TEMP_FOLDER, exist_ok=True)


client = Groq(api_key=os.getenv("GROQ_API_KEY"))  

def extraire_avec_ia(texte_brut):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": f"""Tu es un expert en extraction de données de pièces d'identité burkinabè.
Voici le texte brut extrait par OCR :

{texte_brut}

Extrais les informations et retourne UNIQUEMENT un JSON valide sans texte avant ou après :
{{
  "type_doc": "CNI ou PASSEPORT",
  "nom": "",
  "prenom": "",
  "numero_doc": "",
  "nationalite": "",
  "date_naissance": "",
  "lieu_naissance": "",
  "sexe": "",
  "profession": "",
  "date_delivrance": "",
  "date_expiration": ""
}}

Si un champ est introuvable mets null. UNIQUEMENT le JSON brut, rien d'autre."""
                }
            ],
            temperature=0
        )

        texte = response.choices[0].message.content.strip()
        
        if texte.startswith("```"):
            texte = texte.split("```")[1]
            if texte.startswith("json"):
                texte = texte[4:]
            texte = texte.strip()

        return json.loads(texte)

    except json.JSONDecodeError as e:
        raise Exception(f"Erreur parsing réponse IA : {str(e)}")
    except Exception as e:
        raise Exception(f"Erreur Groq : {str(e)}")



# MÉTHODE REGEX 

# def detecter_type_doc(texte):
#     texte_upper = texte.upper()
#     if "PASSEPORT" in texte_upper:
#         return "PASSEPORT"
#     elif "IDENTITE" in texte_upper:
#         return "CNI"
#     return "INCONNU"

# def extraire_nationalite(texte):
#     pattern = r"IDENTITE\s+(\w+)"
#     match = re.search(pattern, texte, re.IGNORECASE)
#     if match:
#         return match.group(1).strip()
#     return None

# def extraire_champ(texte, cles):
#     for cle in cles:
#         pattern = rf"{cle}\s*[:\-]?\s*([A-Za-zÀ-ÿ]+)"
#         match = re.search(pattern, texte, re.IGNORECASE)
#         if match:
#             return match.group(1).strip()
#     return None

# def extraire_sexe(texte):
#     pattern = r"Sexe\s*[:\-]?\s*([MF])"
#     match = re.search(pattern, texte, re.IGNORECASE)
#     if match:
#         return match.group(1).strip()
#     return None

# def extraire_prenom(texte):
#     pattern = r"Pr[ée]noms?\s*[:\-]?\s*([A-Za-zÀ-ÿ\s\-]+)"
#     match = re.search(pattern, texte, re.IGNORECASE)
#     if match:
#         return match.group(1).strip().split('\n')[0].strip()
#     return None

# def extraire_date_naissance(texte):
#     pattern = r"N[ée]\(e\)\s*le\s*[:\-]?\s*([\d/\s]+)"
#     match = re.search(pattern, texte, re.IGNORECASE)
#     if match:
#         date = match.group(1).strip().split('A')[0].strip()
#         return date.replace(" ", "")
#     return None

# def extraire_lieu_naissance(texte):
#     pattern = r"N[ée]\(e\)\s*le\s*[:\-]?\s*[\d/\s]+A\s+([A-Za-zÀ-ÿ\s\'\-]+)"
#     match = re.search(pattern, texte, re.IGNORECASE)
#     if match:
#         return match.group(1).strip().split('\n')[0].strip()
#     return None

# def extraire_numero_piece(texte):
#     pattern = r"Expire\s*le\s*[:\-]?\s*[\d/]+\s+([A-Z]\d{7,9})"
#     match = re.search(pattern, texte, re.IGNORECASE)
#     if match:
#         return match.group(1).strip()
#     return None

# def extraire_date_expiration(texte):
#     pattern = r"Expire\s*le\s*[:\-]?\s*([\d/]+)"
#     match = re.search(pattern, texte, re.IGNORECASE)
#     if match:
#         return match.group(1).strip()
#     return None

# def extraire_date_delivrance(texte):
#     pattern = r"D[ée]livr[ée]+e?\s*le\s*[:\-]?\s*[\-\s]*([\d/]+)"
#     match = re.search(pattern, texte, re.IGNORECASE)
#     if match:
#         return match.group(1).strip()
#     return None