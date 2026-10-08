import psycopg2
import psycopg2.extras
import os
import secrets
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_connection():
    if "localhost" in (DATABASE_URL or "") or "127.0.0.1" in (DATABASE_URL or ""):
        conn = psycopg2.connect(DATABASE_URL)
    else:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require', connect_timeout=10)
    return conn

def get_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


def init_db():
    """
    Crée les tables si elles n'existent pas encore (première installation).
    Si tu passes d'une base existante (mono-tenant) à celle-ci,
    utilise plutôt migration_multitenant.sql, ne relance pas init_db()
    à l'aveugle sur des données déjà en place.
    """
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entreprises (
            id SERIAL PRIMARY KEY,
            nom TEXT NOT NULL,
            secteur TEXT NOT NULL DEFAULT 'general',
            statut TEXT NOT NULL DEFAULT 'actif',
            email_contact TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fonctionnalites_entreprise (
            id SERIAL PRIMARY KEY,
            entreprise_id INTEGER NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
            cle TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            UNIQUE (entreprise_id, cle)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            login TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'vigile',
            created_at TEXT DEFAULT TO_CHAR(NOW() AT TIME ZONE 'Africa/Abidjan', 'YYYY-MM-DD HH24:MI:SS')
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS extractions (
            id SERIAL PRIMARY KEY,
            entreprise_id INTEGER NOT NULL REFERENCES entreprises(id),
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

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_entreprise ON users(entreprise_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_extractions_entreprise ON extractions(entreprise_id)")

    # Entreprise plateforme + premier super_admin : uniquement si aucune entreprise n'existe encore
    cursor.execute("SELECT COUNT(*) as total FROM entreprises")
    if cursor.fetchone()["total"] == 0:
        cursor.execute("""
            INSERT INTO entreprises (nom, secteur, statut)
            VALUES (%s, 'plateforme', 'actif') RETURNING id
        """, (os.getenv("PLATEFORME_NOM", "Sahal Tech"),))
        entreprise_id = cursor.fetchone()["id"]

        admin_login = os.getenv("ADMIN_LOGIN", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD")
        generated = False
        if not admin_password:
            admin_password = secrets.token_urlsafe(12)
            generated = True

        cursor.execute("""
            INSERT INTO users (entreprise_id, nom, prenom, login, password_hash, role)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            entreprise_id, "Admin", "Sahal", admin_login,
            pwd_context.hash(admin_password), "super_admin"
        ))

        if generated:
            print("=" * 60)
            print(f"[INIT] Compte super_admin créé : login={admin_login}")
            print(f"[INIT] Mot de passe (affiché une seule fois) : {admin_password}")
            print("=" * 60)

    conn.commit()
    cursor.close()
    conn.close()
def set_tenant_context(conn, entreprise_id, role):
    """
    Indique à PostgreSQL (via RLS) quelle entreprise et quel rôle
    sont à l'origine de cette connexion, pour cette requête précise.
    """
    cursor = conn.cursor()
    cursor.execute(
        "SELECT set_config('app.entreprise_id', %s, false), set_config('app.role', %s, false)",
        (str(entreprise_id), role)
    )
    cursor.close()