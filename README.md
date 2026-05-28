# CniScan — Système d'extraction de pièces d'identité/Passeport

Application mobile permettant d'extraire automatiquement les informations d'une CNI ou d'un passeport burkinabè via OCR, de les afficher dans un formulaire, et de les sauvegarder en base de données.

---

## Aperçu des fonctionnalités

-  Upload d'image par drag & drop ou sélection
-  Extraction automatique des données (nom, prénom, date de naissance, profession...)
-  Formulaire pré-rempli avec les données extraites
-  Sauvegarde en base de données SQLite
-  Liste des documents enregistrés avec recherche
-  Modification et suppression des enregistrements
-  Dashboard de statistiques

---

## Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :

### 1. Python 3.9+
```
https://www.python.org/downloads/
```
Vérifie l'installation :
```bash
python --version
```

### 2. Node.js 18+
```
https://nodejs.org/
```
Vérifie l'installation :
```bash
node --version
npm --version
```

### 3. Tesseract OCR
Tesseract est le moteur OCR utilisé pour lire le texte sur les images.

**Windows :**
Télécharge et installe depuis :
```
https://github.com/UB-Mannheim/tesseract/wiki
```

Après installation, télécharge le fichier de langue française `fra.traineddata` :
```
https://github.com/tesseract-ocr/tessdata/raw/main/fra.traineddata
```
Et copie-le dans :
```
C:\Program Files\Tesseract-OCR\tessdata\
```

Vérifie l'installation :
```bash
tesseract --list-langs
# Doit afficher : eng, fra, osd
```

**Ubuntu/Debian :**
```bash
sudo apt install tesseract-ocr tesseract-ocr-fra
```

**Mac :**
```bash
brew install tesseract
brew install tesseract-lang
```

---

## Installation

### Cloner le projet
```bash
git clone https://github.com/Sahal-Tech-Innovation-Labs/VisioID.git
cd VisioID
```

---

### Backend (FastAPI)

```bash
# 1. Aller dans le dossier backend
cd BACKEND

# 2. Créer l'environnement virtuel
python -m venv venv

# 3. Activer le venv
# Windows :
.\venv\Scripts\activate
# Mac/Linux :
source venv/bin/activate

# 4. Installer les dépendances
pip install -r requirements.txt
```

---

### Frontend (Next.js)

```bash
# Aller dans le dossier frontend
cd frontend/cartscan

# Installer les dépendances
npm install
```

---

## Lancement

### Terminal 1 — Backend
```bash
cd BACKEND
.\venv\Scripts\activate      # Windows
uvicorn main:app --reload
```
Le backend démarre sur **http://localhost:8000**

Documentation API interactive : **http://localhost:8000/docs**

### Terminal 2 — Frontend
```bash
cd frontend/cartscan
npm run dev
```
L'application démarre sur **http://localhost:3000**

---

## Routes API

### OCR — Extraction
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/extract/scan` | Reçoit une image et retourne les données extraites |

**Exemple de réponse :**
```json
{
  "success": true,
  "data": {
    "type_doc": "CNI",
    "nom": "SAWADOGO",
    "prenom": "ROMAIN",
    "numero_doc": "B11944893",
    "nationalite": "BURKINABE",
    "date_naissance": "07/07/2000",
    "lieu_naissance": "TENKODOGO",
    "sexe": "M",
    "profession": "ELEVE",
    "date_delivrance": "16/10/2019",
    "date_expiration": "15/10/2029"
  }
}
```

### Documents — CRUD
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/documents/` | Sauvegarde un document en BDD |
| GET | `/documents/` | Retourne la liste de tous les documents |
| GET | `/documents/{id}` | Retourne le détail d'un document |
| PUT | `/documents/{id}` | Met à jour un document existant |
| DELETE | `/documents/{id}` | Supprime un document |

---

## Structure du projet

```
VisioID/
├── BACKEND/                        ← API FastAPI
│   ├── main.py                     ← Point d'entrée
│   ├── requirements.txt            ← Dépendances Python
│   └── app/
│       ├── routers/
│       │   ├── extraction.py       ← Route OCR /extract/scan
│       │   └── documents.py        ← Routes CRUD /documents
│       ├── services/
│       │   └── ocr_service.py      ← Logique extraction Tesseract
│       ├── models/
│       └── database.py         ← Connexion SQLite
│       
│
└── frontend/cartscan/              ← Application Next.js
    ├── app/
    │   ├── page.js                 ← Page accueil (upload)
    │   ├── form/page.js            ← Formulaire données
    │   ├── list/page.js            ← Liste documents
    │   └── dashboard/page.js       ← Statistiques
    └── components/
        ├── CapturePage.js          ← Upload drag & drop
        ├── FormPage.js             ← Formulaire pré-rempli
        ├── ListPage.js             ← Tableau des documents
        └── DashboardPage.js        ← Graphiques
```

---

## Base de données

La base SQLite `cartscan.db` est créée automatiquement au premier lancement du backend.

**Table `extractions` :**
| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | Identifiant unique auto-incrémenté |
| nom | TEXT | Nom de famille |
| prenom | TEXT | Prénom(s) |
| numero_doc | TEXT | Numéro de la pièce (ex: B11944893) |
| nationalite | TEXT | Nationalité |
| date_naissance | TEXT | Date de naissance |
| lieu_naissance | TEXT | Lieu de naissance |
| sexe | TEXT | M ou F |
| profession | TEXT | Profession |
| date_delivrance | TEXT | Date de délivrance |
| date_expiration | TEXT | Date d'expiration |
| motif_visite | TEXT | Motif de la visite |
| date_enreg | TEXT | Date d'enregistrement (auto) |

> **Note :** Un même document ne peut pas être enregistré deux fois le même jour (anti-doublon).

---

## Formats d'image acceptés

- JPEG / JPG
- PNG
- Taille maximale recommandée : 5 MB
- Pour de meilleurs résultats : image nette, bien éclairée, document centré

---

## Dépendances principales

### Backend
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
pytesseract==0.3.13
Pillow==10.4.0
opencv-python==4.10.0.84
python-multipart==0.0.9
pydantic==2.8.2
```

### Frontend
```
next.js 16+
react 18+
tailwindcss 4+
lucide-react
recharts
```

---

## Avancement du projet

| Livrable | Description | Statut |
|----------|-------------|--------|
| D1 | Extraction OCR depuis image | ✅ Terminé |
| D2 | Affichage données dans formulaire | ✅ Terminé |
| D3 | Sauvegarde et modification en BDD | ✅ Terminé |
| D4 | Liste et historique des documents | 🔄 En cours |
| D5 | Dashboard statistiques | 🔄 En cours |

---

## Problèmes connus

- La qualité de l'extraction dépend de la qualité de l'image
- Certains champs peuvent être vides si le texte est illisible sur la pièce
- detection de type de piéce CNI OU Passeport mais n'extrait que les données de la piéce
- Le dashboard affiche actuellement des données statiques (connexion BDD en cours)