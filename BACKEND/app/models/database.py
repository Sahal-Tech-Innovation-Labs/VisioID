import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_connection():
    conn = psycopg2.connect(DATABASE_URL, sslmode='require', connect_timeout=10)
    return conn


def get_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


def init_db():
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS extractions (
            id SERIAL PRIMARY KEY,
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
            date_enreg TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'Africa/Abidjan', 'YYYY-MM-DD HH24:MI:SS')
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            login TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'vigile',
            created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'Africa/Abidjan', 'YYYY-MM-DD HH24:MI:SS')
        )
    """)

    cursor.execute("SELECT COUNT(*) as total FROM users")
    row = cursor.fetchone()
    if row["total"] == 0:
        cursor.execute("""
            INSERT INTO users (nom, prenom, login, password_hash, role)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            "Admin", "Sahal", "admin",
            pwd_context.hash("admin123"),
            "admin"
        ))

    conn.commit()
    cursor.close()
    conn.close()