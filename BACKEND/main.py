from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.extraction import router as extraction_router
from app.routers.auth import router as auth_router
from app.models.database import init_db
from app.routers.documents import router as documents_router

app = FastAPI(
    title="CniScan API",
    description="Service d'extraction et d'analyse de pièces d'identité",
    version="1.0.0"
)
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
        "https://visio-id.vercel.app",
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extraction_router)
app.include_router(documents_router)
app.include_router(auth_router) 


@app.get("/")
def root():
    return {"message": "VisioID API is running ✅"}

@app.get("/health")
def health():
    return {"status": "healthy", "version": "1.0.0"}

