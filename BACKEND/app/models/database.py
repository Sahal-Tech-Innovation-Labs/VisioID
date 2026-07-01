import sqlite3
import os
from passlib.context import CryptContext

DB_PATH = "cartscan.db"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS extractions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT,
            prenom TEXT,
            numero_doc TEXT,
            nationalite TEXT,
            date_naissance TEXT,
            lieu_naissance TEXT,
            sexe TEXT,
            profession TEXT,
            date_delivrance TEXT,
            date_expiration TEXT,
            motif_visite TEXT,
            type_doc TEXT,
            photo_profil TEXT,
            heure_sortie TEXT,
            agent_login TEXT,
            date_enreg TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            login TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'vigile',
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)

    # Migration extractions
    cursor.execute("PRAGMA table_info(extractions)")
    colonnes = [col[1] for col in cursor.fetchall()]
    if "photo_profil" not in colonnes:
        cursor.execute("ALTER TABLE extractions ADD COLUMN photo_profil TEXT")
    if "heure_sortie" not in colonnes:
        cursor.execute("ALTER TABLE extractions ADD COLUMN heure_sortie TEXT")
    if "agent_login" not in colonnes:
        cursor.execute("ALTER TABLE extractions ADD COLUMN agent_login TEXT")

    # Créer un compte admin par défaut si aucun utilisateur n'existe
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.execute("""
            INSERT INTO users (nom, prenom, login, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "Admin",
            "Sahal",
            "admin",
            pwd_context.hash("admin123"),
            "admin"
        ))

    conn.commit()
    conn.close()