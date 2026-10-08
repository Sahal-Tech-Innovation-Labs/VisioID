from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Literal
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from app.models.database import get_connection, get_cursor
import os
import time
import threading

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or len(SECRET_KEY) < 16:
    raise RuntimeError(
        "SECRET_KEY manquante ou trop courte (16 caractères minimum) dans le fichier .env"
    )

ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

_DUMMY_HASH = pwd_context.hash("mot-de-passe-factice-non-utilise")

MAX_ATTEMPTS = 5
LOCK_SECONDS = 15 * 60
_attempts = {}
_attempts_lock = threading.Lock()


def _attempt_key(request: Request, login: str) -> str:
    ip = request.client.host if request.client else "unknown"
    return f"{ip}|{login.lower()}"


def _check_locked(key: str):
    with _attempts_lock:
        rec = _attempts.get(key)
        if rec and rec["locked_until"] > time.time():
            raise HTTPException(
                status_code=429,
                detail="Trop de tentatives. Réessayez dans quelques minutes.",
            )


def _register_failure(key: str):
    with _attempts_lock:
        rec = _attempts.setdefault(key, {"count": 0, "locked_until": 0})
        if rec["locked_until"] and rec["locked_until"] <= time.time():
            rec["count"] = 0
            rec["locked_until"] = 0
        rec["count"] += 1
        if rec["count"] >= MAX_ATTEMPTS:
            rec["locked_until"] = time.time() + LOCK_SECONDS


def _reset_attempts(key: str):
    with _attempts_lock:
        _attempts.pop(key, None)


class LoginSchema(BaseModel):
    login: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=72)


class UserCreateSchema(BaseModel):
    nom: str = Field(min_length=1, max_length=100)
    prenom: str = Field(min_length=1, max_length=100)
    login: str = Field(pattern=r"^[a-zA-Z0-9_.-]{3,50}$")
    password: str = Field(min_length=8, max_length=72)
    role: Literal["admin", "vigile", "receptionniste"] = "vigile"


class PasswordSchema(BaseModel):
    password: str = Field(min_length=8, max_length=72)


def create_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.")
    if "user_id" not in payload or "login" not in payload or "entreprise_id" not in payload:
        raise HTTPException(status_code=401, detail="Token invalide.")
    return payload


def require_admin(payload: dict = Depends(verify_token)):
    if payload.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return payload


def require_super_admin(payload: dict = Depends(verify_token)):
    if payload.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Accès réservé à la plateforme.")
    return payload


def get_entreprise_id(payload: dict = Depends(verify_token)) -> int:
    return payload["entreprise_id"]


@router.post("/login")
def login(data: LoginSchema, request: Request):
    key = _attempt_key(request, data.login)
    _check_locked(key)

    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("""
        SELECT u.*, e.statut as entreprise_statut
        FROM users u
        JOIN entreprises e ON e.id = u.entreprise_id
        WHERE u.login = %s
    """, (data.login,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    hash_to_check = user["password_hash"] if user else _DUMMY_HASH
    password_ok = pwd_context.verify(data.password, hash_to_check)

    if not user or not password_ok:
        _register_failure(key)
        raise HTTPException(status_code=401, detail="Login ou mot de passe incorrect.")

    _reset_attempts(key)

    if not user["email_verifie"]:
        raise HTTPException(
            status_code=403,
            detail="Compte non vérifié. Consultez votre email pour activer votre compte."
        )

    if user["entreprise_statut"] == "suspendu":
        raise HTTPException(status_code=403, detail="Ce compte entreprise est suspendu.")

    token = create_token({
        "user_id":       user["id"],
        "login":         user["login"],
        "nom":           user["nom"],
        "prenom":        user["prenom"],
        "role":          user["role"],
        "entreprise_id": user["entreprise_id"],
    })

    return {
        "success": True,
        "token": token,
        "user": {
            "id":            user["id"],
            "nom":           user["nom"],
            "prenom":        user["prenom"],
            "login":         user["login"],
            "role":          user["role"],
            "entreprise_id": user["entreprise_id"],
        }
    }


@router.get("/me")
def get_me(payload: dict = Depends(verify_token)):
    return {"success": True, "user": payload}


@router.get("/users")
def list_users(payload: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = get_cursor(conn)

    if payload["role"] == "super_admin":
        cursor.execute(
            "SELECT id, nom, prenom, login, role, entreprise_id, created_at FROM users ORDER BY created_at DESC"
        )
    else:
        cursor.execute(
            "SELECT id, nom, prenom, login, role, entreprise_id, created_at FROM users WHERE entreprise_id = %s ORDER BY created_at DESC",
            (payload["entreprise_id"],)
        )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"success": True, "data": [dict(r) for r in rows]}


@router.post("/users")
def create_user(data: UserCreateSchema, payload: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT id FROM users WHERE login = %s", (data.login,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=409, detail="Ce login existe déjà.")

    cursor.execute("""
        INSERT INTO users (entreprise_id, nom, prenom, login, password_hash, role, email_verifie)
        VALUES (%s, %s, %s, %s, %s, %s, TRUE) RETURNING id
    """, (
        payload["entreprise_id"], data.nom, data.prenom, data.login,
        pwd_context.hash(data.password), data.role
    ))

    new_id = cursor.fetchone()["id"]
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Compte créé avec succès.", "id": new_id}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, payload: dict = Depends(require_admin)):
    if payload.get("user_id") == user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte.")

    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT id, entreprise_id FROM users WHERE id = %s", (user_id,))
    target = cursor.fetchone()
    if not target:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")

    if payload["role"] != "super_admin" and target["entreprise_id"] != payload["entreprise_id"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=403, detail="Accès refusé.")

    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Compte supprimé."}


@router.put("/users/{user_id}/password")
def change_password(user_id: int, data: PasswordSchema, payload: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT id, entreprise_id FROM users WHERE id = %s", (user_id,))
    target = cursor.fetchone()
    if not target:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")

    if payload["role"] != "super_admin" and target["entreprise_id"] != payload["entreprise_id"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=403, detail="Accès refusé.")

    cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s",
                   (pwd_context.hash(data.password), user_id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Mot de passe mis à jour."}