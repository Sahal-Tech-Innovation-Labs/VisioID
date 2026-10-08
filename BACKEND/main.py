import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.extraction import router as extraction_router
from app.routers.auth import router as auth_router
from app.models.database import init_db
from app.routers.documents import router as documents_router
from app.routers.entreprises import router as entreprises_router

load_dotenv()

IS_PROD = os.getenv("ENVIRONMENT", "development").lower() == "production"

# En production, la documentation interactive est désactivée
app = FastAPI(
    title="CniScan API",
    description="Service d'extraction et d'analyse de pièces d'identité",
    version="1.0.0",
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
)
init_db()

# Origines autorisées : liste séparée par des virgules dans le .env
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


app.include_router(extraction_router)
app.include_router(documents_router)
app.include_router(auth_router)
app.include_router(entreprises_router)

@app.get("/")
def root():
    return {"message": "VisioID API is running ✅"}


@app.get("/health")
def health():
    return {"status": "healthy", "version": "1.0.0"}