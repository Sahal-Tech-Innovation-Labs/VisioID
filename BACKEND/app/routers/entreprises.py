from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from app.models.database import get_connection, get_cursor
from app.services.email_service import envoyer_email_verification
from app.routers.auth import require_super_admin
import secrets

router = APIRouter(prefix="/entreprises", tags=["Entreprises"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TOKEN_VALIDITY_HOURS = 24


class InscriptionSchema(BaseModel):
    nom_entreprise: str = Field(min_length=1, max_length=150)
    secteur: str = Field(default="general", max_length=50)
    nom: str = Field(min_length=1, max_length=100)
    prenom: str = Field(min_length=1, max_length=100)
    email: EmailStr
    login: str = Field(pattern=r"^[a-zA-Z0-9_.-]{3,50}$")
    password: str = Field(min_length=8, max_length=72)


@router.post("/register")
def register(data: InscriptionSchema):
    conn = get_connection()
    cursor = get_cursor(conn)

    # Unicité du login ET de l'email
    cursor.execute("SELECT id FROM users WHERE login = %s OR email = %s", (data.login, data.email))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=409, detail="Ce login ou cet email est déjà utilisé.")

    # Entreprise en attente de vérification
    cursor.execute("""
        INSERT INTO entreprises (nom, secteur, statut, email_contact)
        VALUES (%s, %s, 'en_attente', %s) RETURNING id
    """, (data.nom_entreprise, data.secteur, data.email))
    entreprise_id = cursor.fetchone()["id"]

    token = secrets.token_urlsafe(32)
    expiration = datetime.now(timezone.utc) + timedelta(hours=TOKEN_VALIDITY_HOURS)

    cursor.execute("""
        INSERT INTO users (
            entreprise_id, nom, prenom, login, email, password_hash, role,
            email_verifie, token_verification, token_expiration
        ) VALUES (%s, %s, %s, %s, %s, %s, 'admin', FALSE, %s, %s)
    """, (
        entreprise_id, data.nom, data.prenom, data.login, data.email,
        pwd_context.hash(data.password), token, expiration
    ))

    conn.commit()
    cursor.close()
    conn.close()

    envoyer_email_verification(data.email, data.prenom, token)

    return {
        "success": True,
        "message": "Inscription reçue. Vérifiez votre email pour activer votre compte."
    }


@router.get("/verify-email")
def verify_email(token: str):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute(
        "SELECT id, entreprise_id, token_expiration, email_verifie FROM users WHERE token_verification = %s",
        (token,)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Lien de vérification invalide.")

    if user["email_verifie"]:
        cursor.close()
        conn.close()
        return {"success": True, "message": "Compte déjà vérifié."}

    expiration = user["token_expiration"]
    if expiration and expiration < datetime.now(timezone.utc):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Lien de vérification expiré. Contactez le support.")

    cursor.execute("""
        UPDATE users
        SET email_verifie = TRUE, token_verification = NULL, token_expiration = NULL
        WHERE id = %s
    """, (user["id"],))

    cursor.execute(
        "UPDATE entreprises SET statut = 'actif' WHERE id = %s",
        (user["entreprise_id"],)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Compte vérifié avec succès. Vous pouvez vous connecter."}


# --- Gestion plateforme (super_admin uniquement) ---

@router.get("/")
def list_entreprises(payload: dict = Depends(require_super_admin)):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("""
        SELECT e.id, e.nom, e.secteur, e.statut, e.email_contact, e.created_at,
               COUNT(DISTINCT u.id) as nombre_users
        FROM entreprises e
        LEFT JOIN users u ON u.entreprise_id = e.id
        GROUP BY e.id
        ORDER BY e.created_at DESC
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"success": True, "data": [dict(r) for r in rows]}


@router.put("/{entreprise_id}/statut")
def changer_statut(entreprise_id: int, data: dict, payload: dict = Depends(require_super_admin)):
    statut = data.get("statut")
    if statut not in ("actif", "suspendu", "en_attente"):
        raise HTTPException(status_code=400, detail="Statut invalide.")

    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT id FROM entreprises WHERE id = %s", (entreprise_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Entreprise non trouvée.")

    cursor.execute("UPDATE entreprises SET statut = %s WHERE id = %s", (statut, entreprise_id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": f"Statut mis à jour : {statut}"}