from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.models.database import get_connection
from typing import Optional
import re
from datetime import datetime

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


class DocumentSchema(BaseModel):
    nom: str
    prenom: str
    numero_doc: str
    nationalite: str
    date_naissance: str
    lieu_naissance: str
    sexe: str
    profession: str
    date_delivrance: Optional[str] = None
    date_expiration: str
    motif_visite: Optional[str] = None
    type_doc: Optional[str] = None
    photo_profil: Optional[str] = None
    date_enreg: str

    @field_validator("numero_doc")
    @classmethod
    def valider_numero_doc(cls, v):
        return v


@router.post("/")
def save_document(doc: DocumentSchema):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO extractions (
            nom, prenom, numero_doc, nationalite,
            date_naissance, lieu_naissance, sexe,
            profession, date_delivrance, date_expiration,
            motif_visite, type_doc, photo_profil, date_enreg
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc.nom, doc.prenom, doc.numero_doc, doc.nationalite,
        doc.date_naissance, doc.lieu_naissance, doc.sexe,
        doc.profession, doc.date_delivrance, doc.date_expiration,
        doc.motif_visite, doc.type_doc, doc.photo_profil, doc.date_enreg
    ))

    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {
        "success": True,
        "message": "Document sauvegardé avec succès",
        "id": new_id
    }


@router.get("/stats")
def get_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM extractions")
    rows = cursor.fetchall()
    conn.close()

    today = datetime.now().date()
    total = len(rows)
    expires = 0
    cni = 0
    passeports = 0

    for row in rows:
        doc = dict(row)
        try:
            date_exp = datetime.strptime(doc["date_expiration"], "%d/%m/%Y").date()
            if date_exp < today:
                expires += 1
        except:
            pass
        if doc.get("type_doc") == "CNI":
            cni += 1
        elif doc.get("type_doc") == "PASSEPORT":
            passeports += 1

    return {
        "success": True,
        "data": {
            "total":      total,
            "expires":    expires,
            "cni":        cni,
            "passeports": passeports,
            "actifs":     total - expires
        }
    }

@router.get("/stats/evolution")
def get_evolution(period: str = "month"):
    """
    Retourne l'évolution des enregistrements
    day   → par heure aujourd'hui
    month → par jour ce mois
    year  → par mois cette année
    """
    conn = get_connection()
    cursor = conn.cursor()

    if period == "day":
        cursor.execute("""
            SELECT strftime('%H:00', date_enreg) as label,
                   COUNT(*) as total
            FROM extractions
            WHERE DATE(date_enreg) = DATE('now', 'localtime')
            GROUP BY label ORDER BY label
        """)
    elif period == "year":
        cursor.execute("""
            SELECT strftime('%m/%Y', date_enreg) as label,
                   COUNT(*) as total
            FROM extractions
            WHERE strftime('%Y', date_enreg) = strftime('%Y', 'now')
            GROUP BY label ORDER BY label
        """)
    else:  # month
        cursor.execute("""
            SELECT strftime('%d/%m', date_enreg) as label,
                   COUNT(*) as total
            FROM extractions
            WHERE strftime('%m/%Y', date_enreg) = strftime('%m/%Y', 'now')
            GROUP BY label ORDER BY label
        """)

    rows = cursor.fetchall()
    conn.close()

    return {
        "success": True,
        "data": [dict(row) for row in rows]
    }


@router.get("/")
def get_documents():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM extractions ORDER BY date_enreg DESC")
    rows = cursor.fetchall()

    # Compte le nombre total de venues par numéro de document
    # (les doublons sont autorisés, donc plusieurs lignes par visiteur)
    cursor.execute("""
        SELECT numero_doc, COUNT(*) as total
        FROM extractions
        GROUP BY numero_doc
    """)
    compteurs = {row["numero_doc"]: row["total"] for row in cursor.fetchall()}
    conn.close()

    today = datetime.now().date()
    documents = []

    for row in rows:
        doc = dict(row)
        try:
            date_exp = datetime.strptime(doc["date_expiration"], "%d/%m/%Y").date()
            doc["est_expire"] = date_exp < today
        except:
            doc["est_expire"] = False
        doc["nombre_visites"] = compteurs.get(doc["numero_doc"], 1)
        documents.append(doc)

    return {
        "success": True,
        "data": [d for d in documents if not d["est_expire"]]
    }


@router.get("/expires")
def get_expired_documents():
    """
    Retourne uniquement les documents expirés
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM extractions ORDER BY date_enreg DESC")
    rows = cursor.fetchall()
    conn.close()

    today = datetime.now().date()
    expires = []

    for row in rows:
        doc = dict(row)
        try:
            date_exp = datetime.strptime(doc["date_expiration"], "%d/%m/%Y").date()
            if date_exp < today:
                expires.append(doc)
        except:
            pass

    return {
        "success": True,
        "data": expires
    }

@router.get("/{doc_id}")
def get_document(doc_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM extractions WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    return {"success": True, "data": dict(row)}


@router.delete("/{doc_id}")
def delete_document(doc_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM extractions WHERE id = ?", (doc_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    cursor.execute("DELETE FROM extractions WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Document supprimé avec succès"}


@router.put("/{doc_id}")
def update_document(doc_id: int, doc: DocumentSchema):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM extractions WHERE id = ?", (doc_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    cursor.execute("""
        UPDATE extractions SET
            nom = ?, prenom = ?, numero_doc = ?,
            nationalite = ?, date_naissance = ?,
            lieu_naissance = ?, sexe = ?,
            profession = ?, date_delivrance = ?,
            date_expiration = ?, motif_visite = ?,
            type_doc = ?, photo_profil = ?
        WHERE id = ?
    """, (
        doc.nom, doc.prenom, doc.numero_doc,
        doc.nationalite, doc.date_naissance,
        doc.lieu_naissance, doc.sexe,
        doc.profession, doc.date_delivrance,
        doc.date_expiration, doc.motif_visite,
        doc.type_doc, doc.photo_profil, doc_id
    ))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Document mis à jour avec succès"}


@router.put("/{doc_id}/sortie")
def marquer_sortie(doc_id: int):
    """
    Marque la sortie d'un visiteur : enregistre l'heure actuelle
    dans heure_sortie. Action manuelle, déclenchée depuis la liste
    ou la fiche du visiteur.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, heure_sortie FROM extractions WHERE id = ?", (doc_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    if existing["heure_sortie"]:
        conn.close()
        raise HTTPException(
            status_code=409,
            detail="La sortie de ce visiteur a déjà été enregistrée."
        )

    cursor.execute("""
        UPDATE extractions
        SET heure_sortie = datetime('now', 'localtime')
        WHERE id = ?
    """, (doc_id,))

    conn.commit()
    cursor.execute("SELECT heure_sortie FROM extractions WHERE id = ?", (doc_id,))
    heure_sortie = cursor.fetchone()["heure_sortie"]
    conn.close()

    return {
        "success": True,
        "message": "Sortie enregistrée avec succès",
        "heure_sortie": heure_sortie
    }