from app.models.database import get_connection, get_cursor, set_tenant_context
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from app.services.email_service import envoyer_email_verification
from app.routers.auth import require_super_admin
import logging
import secrets

logger = logging.getLogger("entreprises")
router = APIRouter(prefix="/entreprises", tags=["Entreprises"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TOKEN_VALIDITY_HOURS = 24
RESEND_COOLDOWN_SECONDS = 60


class InscriptionSchema(BaseModel):
    nom_entreprise: str = Field(min_length=1, max_length=150)
    secteur: str = Field(default="general", max_length=50)
    nom: str = Field(min_length=1, max_length=100)
    prenom: str = Field(min_length=1, max_length=100)
    email: EmailStr
    login: str = Field(pattern=r"^[a-zA-Z0-9_.-]{3,50}$")
    password: str = Field(min_length=8, max_length=72)


class RenvoiSchema(BaseModel):
    email: EmailStr


def _envoyer_email_sans_erreur(destinataire: str, prenom: str, token: str):
    """
    Envoi exécuté en tâche de fond : une panne d'email ne fait jamais échouer
    la requête, et le temps de réponse ne révèle rien (voir resend-verification).
    """
    try:
        envoyer_email_verification(destinataire, prenom, token)
    except Exception:
        logger.exception("Échec d'envoi de l'email de vérification")


@router.post("/register")
def register(data: InscriptionSchema, background_tasks: BackgroundTasks):
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

    background_tasks.add_task(_envoyer_email_sans_erreur, data.email, data.prenom, token)

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
        raise HTTPException(
            status_code=400,
            detail="Lien expiré. Demandez un nouvel email de vérification."
        )

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


@router.post("/resend-verification")
def resend_verification(data: RenvoiSchema, background_tasks: BackgroundTasks):
    """
    Renvoie un lien de vérification. La réponse est TOUJOURS la même, que
    l'adresse existe ou non, pour ne pas révéler quels emails sont inscrits.
    Un nouveau lien annule le précédent. Un délai de 60 s évite le spam.
    """
    reponse = {
        "success": True,
        "message": "Si un compte non vérifié existe pour cette adresse, un nouvel email vient d'être envoyé."
    }

    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute(
        "SELECT id, prenom, email_verifie, token_expiration FROM users WHERE email = %s",
        (data.email,)
    )
    user = cursor.fetchone()

    if not user or user["email_verifie"]:
        cursor.close()
        conn.close()
        return reponse

    now = datetime.now(timezone.utc)

    # Date du dernier envoi = expiration du lien actuel moins sa durée de validité
    if user["token_expiration"]:
        dernier_envoi = user["token_expiration"] - timedelta(hours=TOKEN_VALIDITY_HOURS)
        if (now - dernier_envoi).total_seconds() < RESEND_COOLDOWN_SECONDS:
            cursor.close()
            conn.close()
            return reponse

    token = secrets.token_urlsafe(32)
    expiration = now + timedelta(hours=TOKEN_VALIDITY_HOURS)
    cursor.execute(
        "UPDATE users SET token_verification = %s, token_expiration = %s WHERE id = %s",
        (token, expiration, user["id"])
    )
    conn.commit()
    cursor.close()
    conn.close()

    background_tasks.add_task(_envoyer_email_sans_erreur, data.email, user["prenom"], token)
    return reponse


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

    # Garde-fou : la plateforme ne peut pas suspendre sa propre entreprise
    if entreprise_id == payload["entreprise_id"] and statut != "actif":
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas suspendre votre propre entreprise.")

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

@router.delete("/{entreprise_id}")
def supprimer_entreprise(entreprise_id: int, payload: dict = Depends(require_super_admin)):
    """Supprime uniquement une entreprise jamais activée (email non vérifié, aucun document)."""
    if entreprise_id == payload["entreprise_id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre entreprise.")

    conn = get_connection()
    try:
        # Contexte RLS nécessaire pour compter correctement les documents
        set_tenant_context(conn, payload["entreprise_id"], payload["role"])
        cursor = get_cursor(conn)

        cursor.execute("SELECT id, statut FROM entreprises WHERE id = %s", (entreprise_id,))
        entreprise = cursor.fetchone()
        if not entreprise:
            raise HTTPException(status_code=404, detail="Entreprise non trouvée.")

        if entreprise["statut"] != "en_attente":
            raise HTTPException(
                status_code=400,
                detail="Seule une entreprise en attente de vérification peut être supprimée."
            )

        cursor.execute("SELECT COUNT(*) AS total FROM extractions WHERE entreprise_id = %s", (entreprise_id,))
        if cursor.fetchone()["total"] > 0:
            raise HTTPException(status_code=400, detail="Cette entreprise contient des documents.")

        cursor.execute("DELETE FROM users WHERE entreprise_id = %s", (entreprise_id,))
        cursor.execute("DELETE FROM entreprises WHERE id = %s", (entreprise_id,))
        conn.commit()
    finally:
        conn.close()

    return {"success": True, "message": "Entreprise supprimée."}