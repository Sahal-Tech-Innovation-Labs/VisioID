from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.database import get_connection
from typing import Optional

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


class DocumentSchema(BaseModel):
    nom: str
    prenom: str
    numero_doc: str
    nationalite: str
    date_naissance:str
    lieu_naissance: str
    sexe: str
    profession: str
    date_delivrance: Optional[str] = None
    date_expiration: str
    motif_visite: Optional[str] = None
    date_enreg: str


@router.post("/")
def save_document(doc: DocumentSchema):
    """
    Sauvegarde un document en BDD.
    Vérifie si le même numéro de document existe déjà aujourd'hui
    pour éviter les doublons.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id FROM extractions
        WHERE numero_doc = ?
        AND DATE(date_enreg) = DATE('now', 'localtime')
    """, (doc.numero_doc,))

    existing = cursor.fetchone()

    if existing:
        conn.close()
        raise HTTPException(
            status_code=409,
            detail="Ce document a déjà été enregistré aujourd'hui."
        )

    
    cursor.execute("""
        INSERT INTO extractions (
            nom, prenom, numero_doc, nationalite,
            date_naissance, lieu_naissance, sexe,
            profession, date_delivrance, date_expiration,
            motif_visite, date_enreg
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc.nom, doc.prenom, doc.numero_doc, doc.nationalite,
        doc.date_naissance, doc.lieu_naissance, doc.sexe,
        doc.profession, doc.date_delivrance, doc.date_expiration,
        doc.motif_visite, doc.date_enreg
    ))

    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {
        "success": True,
        "message": "Document sauvegardé avec succès",
        "id": new_id
    }


@router.get("/")
def get_documents():
    """
    Retourne la liste de tous les documents.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM extractions
        ORDER BY date_enreg DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    return {
        "success": True,
        "data": [dict(row) for row in rows]
    }


@router.get("/{doc_id}")
def get_document(doc_id: int):
    """
    Retourne le détail d'un document par son ID.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM extractions WHERE id = ?
    """, (doc_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Document non trouvé."
        )

    return {
        "success": True,
        "data": dict(row)
    }

@router.delete("/{doc_id}")
def delete_document(doc_id: int):
   
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM extractions WHERE id = ?", (doc_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail="Document non trouvé."
        )

    cursor.execute("DELETE FROM extractions WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Document supprimé avec succès"
    }

@router.put("/{doc_id}")
def update_document(doc_id: int, doc: DocumentSchema):
    """
    Met à jour un document existant
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Vérifie que le document existe
    cursor.execute("SELECT id FROM extractions WHERE id = ?", (doc_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail="Document non trouvé."
        )

    # Met à jour le document
    cursor.execute("""
        UPDATE extractions SET
            nom = ?, prenom = ?, numero_doc = ?,
            nationalite = ?, date_naissance = ?,
            lieu_naissance = ?, sexe = ?,
            profession = ?, date_delivrance = ?,
            date_expiration = ?, motif_visite = ?
        WHERE id = ?
    """, (
        doc.nom, doc.prenom, doc.numero_doc,
        doc.nationalite, doc.date_naissance,
        doc.lieu_naissance, doc.sexe,
        doc.profession, doc.date_delivrance,
        doc.date_expiration, doc.motif_visite,
        doc_id
    ))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Document mis à jour avec succès"
    }