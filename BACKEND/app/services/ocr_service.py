import os
import re
import json
import platform
import shutil
import base64
import cv2
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
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

_FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def detecter_type_doc(texte):
    texte_upper = texte.upper()
    if "PASSEPORT" in texte_upper or "PASSPORT" in texte_upper:
        return "PASSEPORT"
    elif "IDENTIT" in texte_upper or "IDENTITY" in texte_upper:
        return "CNI"
    return "INCONNU"


def extraire_photo_profil(image_path, type_doc="INCONNU", max_dim=300):
    """
    CNI      → rognage sur zone fixe (coin supérieur gauche, où est toujours la photo sur CNI burkinabè)
    Passeport → détection de visage Haar Cascade (marche bien sur passeport)
    """
    image = cv2.imread(image_path)
    if image is None:
        return None

    img_h, img_w = image.shape[:2]

    if type_doc == "CNI":
        x1 = 0
        x2 = int(img_w * 0.20)
        y1 = int(img_h * 0.10)
        y2 = int(img_h * 0.90)
        portrait = image[y1:y2, x1:x2]

    else:
        # Passeport : détection Haar Cascade
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        max_face_dim = int(min(img_w, img_h) * 0.7)

        visages = _FACE_CASCADE.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=6,
            minSize=(60, 60), maxSize=(max_face_dim, max_face_dim)
        )

        if len(visages) == 0:
            return None

        x, y, w, h = max(visages, key=lambda v: v[2] * v[3])

        if (w * h) > 0.5 * img_w * img_h:
            return None

        marge_x = int(w * 0.25)
        marge_haut = int(h * 0.25)
        marge_bas = int(h * 0.5)

        x1 = max(0, x - marge_x)
        y1 = max(0, y - marge_haut)
        x2 = min(img_w, x + w + marge_x)
        y2 = min(img_h, y + h + marge_bas)
        portrait = image[y1:y2, x1:x2]

    # Redimensionnement
    h_crop, w_crop = portrait.shape[:2]
    if h_crop == 0 or w_crop == 0:
        return None
    if max(h_crop, w_crop) > max_dim:
        scale = max_dim / max(h_crop, w_crop)
        portrait = cv2.resize(
            portrait,
            (int(w_crop * scale), int(h_crop * scale)),
            interpolation=cv2.INTER_AREA,
        )

    ok, buffer = cv2.imencode(".jpg", portrait, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not ok:
        return None

    base64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{base64_str}"


def extraire_cni_regex(texte):
    """
    Extraction pour CNI burkinabè.
    Gère deux générations :
    - Ancienne : "CARTE NATIONALE D'IDENTITE BURKINABE", numéro B+chiffres après "Expire le"
    - Nouvelle  : "CARTE D'IDENTITE / IDENTITY CARD", numéro 17 chiffres en haut
    """
    is_nouvelle = "IDENTITY CARD" in texte.upper()

    def extraire_champ(cles):
        for cle in cles:
            pattern = rf"{cle}\s*[:\-]?\s*([A-Za-zÀ-ÿ]+)"
            match = re.search(pattern, texte, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def extraire_sexe():
        match = re.search(r"Sexe\s*[:\-]?\s*([MF])", texte, re.IGNORECASE)
        return match.group(1).strip() if match else None

    def extraire_prenom():
        match = re.search(r"Pr[ée]noms?\s*[:\-]?\s*([A-Za-zÀ-ÿ\s\-]+)", texte, re.IGNORECASE)
        return match.group(1).strip().split('\n')[0].strip() if match else None

    def extraire_date_naissance():
        if is_nouvelle:
            match = re.search(r"N[ée].{0,4}le\s*[:\-]?\s*([\d/\s]+)", texte, re.IGNORECASE)
        else:
            match = re.search(r"N[ée]\(e\)\s*le\s*[:\-]?\s*([\d/\s]+)", texte, re.IGNORECASE)
        if match:
            date = match.group(1).strip()
            date = re.split(r'[AÀ]', date)[0].strip()
            return date.replace(" ", "")
        return None

    def extraire_lieu_naissance():
        if is_nouvelle:
            match = re.search(
                r"N[ée].{0,4}le\s*[:\-]?\s*[\d/\s]+[AÀ]\s*[:\-]?\s*([A-Za-zÀ-ÿ\s\'\-]+)",
                texte, re.IGNORECASE
            )
        else:
            match = re.search(
                r"N[ée]\(e\)\s*le\s*[:\-]?\s*[\d/\s]+[AÀ]\s+([A-Za-zÀ-ÿ\s\'\-]+)",
                texte, re.IGNORECASE
            )
        return match.group(1).strip().split('\n')[0].strip() if match else None

    def extraire_numero_piece():
        # Priorité 1 : B+chiffres après "Expire le" (ancienne CNI)
        match = re.search(r"Expire\s*le\s*[:\-]?\s*[\d/]+\s+(B\d+)", texte, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        # Priorité 2 : B+chiffres n'importe où
        match = re.search(r"\b(B\d+)\b", texte, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        # Priorité 3 : 17 chiffres (nouvelle CNI)
        match = re.search(r"(?<!\d)(\d{17})(?!\d)", texte)
        if match:
            return match.group(1).strip()
        return None

    def extraire_date_expiration():
        match = re.search(r"Expire\s*le\s*[:\-]?\s*([\d/]+)", texte, re.IGNORECASE)
        return match.group(1).strip() if match else None

    def extraire_date_delivrance():
        match = re.search(r"D[ée]livr[ée]+e?\s*le\s*[:\-]?\s*[\-\s]*([\d/]+)", texte, re.IGNORECASE)
        return match.group(1).strip() if match else None

    def extraire_nationalite():
        return "BURKINABE"

    return {
        "type_doc":        "CNI",
        "nom":             extraire_champ(["Nom", "NOM"]),
        "prenom":          extraire_prenom(),
        "numero_doc":      extraire_numero_piece(),
        "nationalite":     extraire_nationalite(),
        "date_naissance":  extraire_date_naissance(),
        "lieu_naissance":  extraire_lieu_naissance(),
        "sexe":            extraire_sexe(),
        "profession":      extraire_champ(["Profession", "PROFESSION"]),
        "date_delivrance": extraire_date_delivrance(),
        "date_expiration": extraire_date_expiration(),
    }


def extraire_avec_ia(texte_brut):
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": f"""Tu es un expert en extraction de données de pièces d'identité burkinabè.
Voici le texte brut extrait par OCR d'un passeport burkinabè :

{texte_brut}

Extrais les informations et retourne UNIQUEMENT un JSON valide :
{{
  "type_doc": "PASSEPORT",
  "nom": "nom de famille uniquement",
  "prenom": "prénom(s) uniquement",
  "numero_doc": "IMPORTANT: numéro passeport = lettre A suivie de 7 chiffres ex: A5064595. Ne pas confondre avec le code pays BFA",
  "nationalite": "BURKINABE",
  "date_naissance": "format JJ/MM/AAAA",
  "lieu_naissance": "ville de naissance seulement sans BFA",
  "sexe": "M ou F",
  "profession": null,
  "date_delivrance": "Date of issue au format JJ/MM/AAAA",
  "date_expiration": "Date of expiry au format JJ/MM/AAAA"
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


def extraire_hybride(texte_brut, image_path=None):
    type_doc = detecter_type_doc(texte_brut)

    if type_doc == "CNI":
        resultat = extraire_cni_regex(texte_brut)
    else:
        resultat = extraire_avec_ia(texte_brut)

    if image_path:
        resultat["photo_profil"] = extraire_photo_profil(image_path, type_doc=type_doc)

    return resultat