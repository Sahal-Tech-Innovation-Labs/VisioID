import sqlite3
import os

DB_PATH = "cartscan.db"

def get_connection():
    """Retourne une connexion à la base SQLite"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Crée la table extractions si elle n'existe pas"""
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
            date_enreg TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)

    conn.commit()
    conn.close()