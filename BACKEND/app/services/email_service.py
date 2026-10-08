import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "no-reply@cniscan.local")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def envoyer_email_verification(destinataire: str, prenom: str, token: str):
    lien = f"{FRONTEND_URL}/verify-email?token={token}"

    # Mode secours : si aucun SMTP n'est configuré, on affiche le lien
    # dans le terminal au lieu d'envoyer un vrai email. Pratique pour
    # tester sans avoir encore configuré Brevo/Gmail.
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        print("=" * 60)
        print(f"[EMAIL - mode secours, SMTP non configuré]")
        print(f"Destinataire : {destinataire}")
        print(f"Lien de vérification : {lien}")
        print("=" * 60)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Vérifiez votre compte CNIScan"
    msg["From"] = SMTP_FROM
    msg["To"] = destinataire

    texte = f"""Bonjour {prenom},

Merci de vous être inscrit sur CNIScan.

Cliquez sur ce lien pour vérifier votre compte (valable 24h) :
{lien}

Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
"""
    html = f"""
    <p>Bonjour {prenom},</p>
    <p>Merci de vous être inscrit sur CNIScan.</p>
    <p><a href="{lien}">Cliquez ici pour vérifier votre compte</a> (valable 24h).</p>
    <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
    """

    msg.attach(MIMEText(texte, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, destinataire, msg.as_string())