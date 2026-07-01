from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from app.models.database import get_connection

router = APIRouter(prefix="/auth", tags=["Auth"])

# Configuration JWT
SECRET_KEY = "visioid_sahal_tech_secret_2024"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# --- Schemas ---
class LoginSchema(BaseModel):
    login: str
    password: str

class UserCreateSchema(BaseModel):
    nom: str
    prenom: str
    login: str
    password: str
    role: Optional[str] = "vigile"


# --- Helpers ---
def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.")


def require_admin(payload: dict = Depends(verify_token)):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return payload


# --- Routes ---
@router.post("/login")
def login(data: LoginSchema):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE login = ?", (data.login,))
    user = cursor.fetchone()
    conn.close()

    if not user or not pwd_context.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Login ou mot de passe incorrect.")

    token = create_token({
        "user_id": user["id"],
        "login":   user["login"],
        "nom":     user["nom"],
        "prenom":  user["prenom"],
        "role":    user["role"],
    })

    return {
        "success": True,
        "token": token,
        "user": {
            "id":     user["id"],
            "nom":    user["nom"],
            "prenom": user["prenom"],
            "login":  user["login"],
            "role":   user["role"],
        }
    }


@router.get("/me")
def get_me(payload: dict = Depends(verify_token)):
    return {"success": True, "user": payload}


@router.get("/users")
def list_users(payload: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nom, prenom, login, role, created_at FROM users ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return {"success": True, "data": [dict(r) for r in rows]}


@router.post("/users")
def create_user(data: UserCreateSchema, payload: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE login = ?", (data.login,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Ce login existe déjà.")

    cursor.execute("""
        INSERT INTO users (nom, prenom, login, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data.nom,
        data.prenom,
        data.login,
        pwd_context.hash(data.password),
        data.role,
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {"success": True, "message": "Compte créé avec succès.", "id": new_id}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, payload: dict = Depends(require_admin)):
    if payload.get("user_id") == user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")

    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Compte supprimé."}


@router.put("/users/{user_id}/password")
def change_password(user_id: int, data: dict, payload: dict = Depends(require_admin)):
    new_password = data.get("password")
    if not new_password or len(new_password) < 4:
        raise HTTPException(status_code=400, detail="Mot de passe trop court (minimum 4 caractères).")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                   (pwd_context.hash(new_password), user_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Mot de passe mis à jour."}