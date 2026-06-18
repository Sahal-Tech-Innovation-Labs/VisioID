import sqlite3
import os

DB_PATH = "cartscan.db"

def get_connection():
    """Retourne une connexion à la base SQLite"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Crée la table extractions si elle n'existe pas, et migre les BDD existantes"""
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
            date_enreg TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)

    # Migration : si la table existait déjà avant l'ajout de photo_profil / heure_sortie
    cursor.execute("PRAGMA table_info(extractions)")
    colonnes = [col[1] for col in cursor.fetchall()]
    if "photo_profil" not in colonnes:
        cursor.execute("ALTER TABLE extractions ADD COLUMN photo_profil TEXT")
    if "heure_sortie" not in colonnes:
        cursor.execute("ALTER TABLE extractions ADD COLUMN heure_sortie TEXT")

    conn.commit()
    conn.close()