from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.models.database import get_connection, get_cursor
from typing import Optional
import re
from datetime import datetime

router = APIRouter(prefix="/documents", tags=["Documents"])


class DocumentSchema(BaseModel):
    nom: str
    prenom: str
    numero_doc: str
    nationalite: str
    date_naissance: str
    lieu_naissance: str
    sexe: str
    profession: Optional[str] = None
    date_delivrance: Optional[str] = None
    date_expiration: Optional[str] = None
    motif_visite: Optional[str] = None
    type_doc: Optional[str] = None
    photo_profil: Optional[str] = None
    date_enreg: str
    agent_login: Optional[str] = None

    @field_validator("numero_doc")
    @classmethod
    def valider_numero_doc(cls, v):
        return v


@router.post("/")
def save_document(doc: DocumentSchema):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("""
        INSERT INTO extractions (
            nom, prenom, numero_doc, nationalite,
            date_naissance, lieu_naissance, sexe,
            profession, date_delivrance, date_expiration,
            motif_visite, type_doc, photo_profil, date_enreg, agent_login
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        doc.nom, doc.prenom, doc.numero_doc, doc.nationalite,
        doc.date_naissance, doc.lieu_naissance, doc.sexe,
        doc.profession, doc.date_delivrance, doc.date_expiration,
        doc.motif_visite, doc.type_doc, doc.photo_profil,
        doc.date_enreg, doc.agent_login
    ))

    new_id = cursor.fetchone()["id"]
    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Document sauvegardé avec succès", "id": new_id}


@router.get("/stats")
def get_stats():
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT * FROM extractions")
    rows = cursor.fetchall()
    cursor.close()
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
            "total": total, "expires": expires,
            "cni": cni, "passeports": passeports,
            "actifs": total - expires
        }
    }


@router.get("/stats/evolution")
def get_evolution(period: str = "month"):
    conn = get_connection()
    cursor = get_cursor(conn)

    if period == "day":
        cursor.execute("""
            SELECT TO_CHAR(date_enreg::timestamp, 'HH24:00') as label, COUNT(*) as total
            FROM extractions
            WHERE date_enreg::date = CURRENT_DATE
            GROUP BY label ORDER BY label
        """)
    elif period == "year":
        cursor.execute("""
            SELECT TO_CHAR(date_enreg::timestamp, 'MM/YYYY') as label, COUNT(*) as total
            FROM extractions
            WHERE EXTRACT(YEAR FROM date_enreg::timestamp) = EXTRACT(YEAR FROM NOW())
            GROUP BY label ORDER BY label
        """)
    else:
        cursor.execute("""
            SELECT TO_CHAR(date_enreg::timestamp, 'DD/MM') as label, COUNT(*) as total
            FROM extractions
            WHERE TO_CHAR(date_enreg::timestamp, 'MM/YYYY') = TO_CHAR(NOW(), 'MM/YYYY')
            GROUP BY label ORDER BY label
        """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"success": True, "data": [dict(r) for r in rows]}


@router.get("/")
def get_documents():
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("""
        SELECT *, COUNT(*) OVER (PARTITION BY numero_doc) as nombre_visites
        FROM extractions ORDER BY date_enreg DESC
    """)
    rows = cursor.fetchall()
    cursor.close()
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
        documents.append(doc)

    return {"success": True, "data": [d for d in documents if not d["est_expire"]]}


@router.get("/expires")
def get_expired_documents():
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT * FROM extractions ORDER BY date_enreg DESC")
    rows = cursor.fetchall()
    cursor.close()
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
    return {"success": True, "data": expires}


@router.get("/historique/{numero_doc}")
def get_historique(numero_doc: str):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("""
        SELECT id, date_enreg, heure_sortie, motif_visite, agent_login
        FROM extractions WHERE numero_doc = %s
        ORDER BY date_enreg DESC
    """, (numero_doc,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"success": True, "nombre": len(rows), "data": [dict(r) for r in rows]}


@router.get("/{doc_id}")
def get_document(doc_id: int):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT * FROM extractions WHERE id = %s", (doc_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Document non trouvé.")
    return {"success": True, "data": dict(row)}


@router.delete("/{doc_id}")
def delete_document(doc_id: int):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT id FROM extractions WHERE id = %s", (doc_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Document non trouvé.")
    cursor.execute("DELETE FROM extractions WHERE id = %s", (doc_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Document supprimé avec succès"}


@router.put("/{doc_id}")
def update_document(doc_id: int, doc: DocumentSchema):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT id FROM extractions WHERE id = %s", (doc_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    cursor.execute("""
        UPDATE extractions SET
            nom=%s, prenom=%s, numero_doc=%s, nationalite=%s,
            date_naissance=%s, lieu_naissance=%s, sexe=%s,
            profession=%s, date_delivrance=%s, date_expiration=%s,
            motif_visite=%s, type_doc=%s, photo_profil=%s, agent_login=%s
        WHERE id = %s
    """, (
        doc.nom, doc.prenom, doc.numero_doc, doc.nationalite,
        doc.date_naissance, doc.lieu_naissance, doc.sexe,
        doc.profession, doc.date_delivrance, doc.date_expiration,
        doc.motif_visite, doc.type_doc, doc.photo_profil,
        doc.agent_login, doc_id
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Document mis à jour avec succès"}


@router.put("/{doc_id}/sortie")
def marquer_sortie(doc_id: int):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT id, heure_sortie FROM extractions WHERE id = %s", (doc_id,))
    existing = cursor.fetchone()

    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    if existing["heure_sortie"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=409, detail="La sortie de ce visiteur a déjà été enregistrée.")

    cursor.execute("""
        UPDATE extractions
        SET heure_sortie = TO_CHAR(NOW() AT TIME ZONE 'Africa/Abidjan', 'YYYY-MM-DD HH24:MI:SS')
        WHERE id = %s RETURNING heure_sortie
    """, (doc_id,))

    heure_sortie = cursor.fetchone()["heure_sortie"]
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Sortie enregistrée avec succès", "heure_sortie": heure_sortie}