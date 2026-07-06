# VisioID / CniScan

CniScan est une application d'extraction et de gestion de documents d'identité burkinabè (CNI et passeport). Le backend FastAPI traite l'OCR, la transcription audio et l'authentification, tandis que le frontend Next.js offre l'interface d'upload, de consultation et de statistiques.

---

## Aperçu des fonctionnalités

- Upload d'images JPEG/PNG
- Extraction de texte via Tesseract
- Classification CNI / Passeport
- Transcription audio via Groq
- Authentification et gestion des utilisateurs
- Sauvegarde des documents dans PostgreSQL
- Liste des documents, historique, expiration et statistiques

---

## Prérequis

### 1. Python 3.12+
https://www.python.org/downloads/

Vérifier l'installation :
```bash
python --version
```

### 2. Node.js 20+
https://nodejs.org/

Vérifier l'installation :
```bash
node --version
npm --version
```

### 3. PostgreSQL
Le backend se connecte à PostgreSQL via `DATABASE_URL`.

### 4. Tesseract OCR
Tesseract est utilisé dans le backend pour l'OCR.

**Windows :**
- Installer depuis https://github.com/UB-Mannheim/tesseract/wiki
- Copier `fra.traineddata` dans `C:\Program Files\Tesseract-OCR\tessdata\`

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

### Backend
```bash
cd BACKEND
python -m venv venv
# Windows :
.\venv\Scripts\activate
# Mac/Linux :
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend/cartscan
npm install
```

---

## Configuration

### Backend
Créer `BACKEND/.env` avec :
```env
DATABASE_URL=postgresql://user:password@localhost:5432/visioid
SECRET_KEY=change_me
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend
Créer `frontend/cartscan/.env.local` avec :
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Lancement local

### Backend
```bash
cd BACKEND
.\venv\Scripts\activate  # Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend/cartscan
npm run dev
```

- Frontend : http://localhost:3000
- Backend : http://localhost:8000
- API docs : http://localhost:8000/docs

---

## Lancement avec Docker

```bash
docker compose up --build
```

- Backend : http://localhost:8000
- Frontend : http://localhost:3000

---

## API Principales

### Auth
- `POST /auth/login` : authentification
- `GET /auth/me` : informations du token
- `GET /auth/users` : liste des utilisateurs (admin)
- `POST /auth/users` : création d'utilisateur (admin)
- `DELETE /auth/users/{user_id}` : suppression d'utilisateur (admin)
- `PUT /auth/users/{user_id}/password` : mise à jour du mot de passe (admin)

### Extraction
- `POST /extract/scan` : upload d'image et extraction des données
- `POST /extract/transcribe` : upload audio et transcription

### Documents
- `GET /documents/` : liste des documents
- `POST /documents/` : sauvegarde d'un document
- `GET /documents/{id}` : détail d'un document
- `PUT /documents/{id}` : mise à jour d'un document
- `DELETE /documents/{id}` : suppression d'un document
- `PUT /documents/{id}/sortie` : marquer la sortie
- `GET /documents/expires` : documents expirés
- `GET /documents/historique/{numero_doc}` : historique d'un document
- `GET /documents/stats` : statistiques globales
- `GET /documents/stats/evolution` : évolution des enregistrements

---

## Structure du projet

```
VisioID/
├── BACKEND/
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── documents.py
│   │   │   └── extraction.py
│   │   ├── services/
│   │   │   └── ocr_service.py
│   │   └── models/
│   │       └── database.py
│   └── .env (local)
└── frontend/cartscan/
    ├── Dockerfile
    ├── package.json
    ├── app/
    │   ├── page.js
    │   ├── login/page.js
    │   ├── form/page.js
    │   ├── list/page.js
    │   └── dashboard/page.js
    ├── components/
    │   ├── CapturePage.js
    │   ├── FormPage.js
    │   ├── ListPage.js
    │   └── DashboardPage.js
    └── .env.local (local)
```

---

## Base de données

Le backend utilise PostgreSQL.

### Tables principales

- `extractions` : documents extraits, type de pièce, dates, photo de profil, historique de sortie
- `users` : comptes utilisateurs et rôles

Un compte admin est créé automatiquement si aucun utilisateur n'existe :

- login : `admin`
- mot de passe : `admin123`

---

## Notes

- Le backend se connecte à PostgreSQL via `DATABASE_URL`.
- Le frontend utilise `NEXT_PUBLIC_API_URL` pour appeler l'API.
- Le Docker Compose expose le backend sur le port `8000` et le frontend sur `3000`.
- Si vous êtes sous Windows, installez Tesseract et configurez le chemin vers `tesseract.exe`.

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