from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models.database import get_connection, get_cursor, set_tenant_context
from app.routers.auth import verify_token, require_admin
from typing import Optional
from datetime import datetime

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
    dependencies=[Depends(verify_token)],
)


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


def _est_expire(date_expiration, today):
    try:
        return datetime.strptime(date_expiration, "%d/%m/%Y").date() < today
    except (ValueError, TypeError):
        return False


def _conn(payload: dict):
    """Connexion déjà configurée pour RLS (entreprise + rôle du token)."""
    conn = get_connection()
    set_tenant_context(conn, payload["entreprise_id"], payload["role"])
    return conn


@router.post("/")
def save_document(doc: DocumentSchema, payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)

    cursor.execute("""
        INSERT INTO extractions (
            entreprise_id, nom, prenom, numero_doc, nationalite,
            date_naissance, lieu_naissance, sexe,
            profession, date_delivrance, date_expiration,
            motif_visite, type_doc, photo_profil, date_enreg, agent_login
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        payload["entreprise_id"],
        doc.nom, doc.prenom, doc.numero_doc, doc.nationalite,
        doc.date_naissance, doc.lieu_naissance, doc.sexe,
        doc.profession, doc.date_delivrance, doc.date_expiration,
        doc.motif_visite, doc.type_doc, doc.photo_profil,
        doc.date_enreg, payload["login"]
    ))

    new_id = cursor.fetchone()["id"]
    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Document sauvegardé avec succès", "id": new_id}


@router.get("/stats")
def get_stats(payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)
    cursor.execute(
        "SELECT type_doc, date_expiration FROM extractions WHERE entreprise_id = %s",
        (payload["entreprise_id"],)
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    today = datetime.now().date()
    total = len(rows)
    expires = 0
    cni = 0
    passeports = 0

    for row in rows:
        if _est_expire(row["date_expiration"], today):
            expires += 1
        if row.get("type_doc") == "CNI":
            cni += 1
        elif row.get("type_doc") == "PASSEPORT":
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
def get_evolution(period: str = "month", payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)
    entreprise_id = payload["entreprise_id"]

    if period == "day":
        cursor.execute("""
            SELECT TO_CHAR(date_enreg::timestamp, 'HH24:00') as label, COUNT(*) as total
            FROM extractions
            WHERE entreprise_id = %s AND date_enreg::date = CURRENT_DATE
            GROUP BY label ORDER BY label
        """, (entreprise_id,))
    elif period == "year":
        cursor.execute("""
            SELECT TO_CHAR(date_enreg::timestamp, 'MM/YYYY') as label, COUNT(*) as total
            FROM extractions
            WHERE entreprise_id = %s AND EXTRACT(YEAR FROM date_enreg::timestamp) = EXTRACT(YEAR FROM NOW())
            GROUP BY label ORDER BY label
        """, (entreprise_id,))
    else:
        cursor.execute("""
            SELECT TO_CHAR(date_enreg::timestamp, 'DD/MM') as label, COUNT(*) as total
            FROM extractions
            WHERE entreprise_id = %s AND TO_CHAR(date_enreg::timestamp, 'MM/YYYY') = TO_CHAR(NOW(), 'MM/YYYY')
            GROUP BY label ORDER BY label
        """, (entreprise_id,))

    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"success": True, "data": [dict(r) for r in rows]}


@router.get("/")
def get_documents(payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)

    cursor.execute("""
        SELECT *, COUNT(*) OVER (PARTITION BY numero_doc) as nombre_visites
        FROM extractions
        WHERE entreprise_id = %s
        ORDER BY date_enreg DESC
    """, (payload["entreprise_id"],))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    today = datetime.now().date()
    documents = []
    for row in rows:
        doc = dict(row)
        doc["est_expire"] = _est_expire(doc["date_expiration"], today)
        documents.append(doc)

    return {"success": True, "data": [d for d in documents if not d["est_expire"]]}


@router.get("/expires")
def get_expired_documents(payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)
    cursor.execute(
        "SELECT * FROM extractions WHERE entreprise_id = %s ORDER BY date_enreg DESC",
        (payload["entreprise_id"],)
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    today = datetime.now().date()
    expires = [dict(r) for r in rows if _est_expire(r["date_expiration"], today)]
    return {"success": True, "data": expires}


@router.get("/historique/{numero_doc}")
def get_historique(numero_doc: str, payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)
    cursor.execute("""
        SELECT id, date_enreg, heure_sortie, motif_visite, agent_login
        FROM extractions
        WHERE numero_doc = %s AND entreprise_id = %s
        ORDER BY date_enreg DESC
    """, (numero_doc, payload["entreprise_id"]))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"success": True, "nombre": len(rows), "data": [dict(r) for r in rows]}


def _get_document_or_404(cursor, doc_id: int, entreprise_id: int):
    cursor.execute(
        "SELECT * FROM extractions WHERE id = %s AND entreprise_id = %s",
        (doc_id, entreprise_id)
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Document non trouvé.")
    return row


@router.get("/{doc_id}")
def get_document(doc_id: int, payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)
    row = _get_document_or_404(cursor, doc_id, payload["entreprise_id"])
    cursor.close()
    conn.close()
    return {"success": True, "data": dict(row)}


@router.delete("/{doc_id}")
def delete_document(doc_id: int, payload: dict = Depends(require_admin)):
    conn = _conn(payload)
    cursor = get_cursor(conn)
    _get_document_or_404(cursor, doc_id, payload["entreprise_id"])
    cursor.execute(
        "DELETE FROM extractions WHERE id = %s AND entreprise_id = %s",
        (doc_id, payload["entreprise_id"])
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Document supprimé avec succès"}


@router.put("/{doc_id}")
def update_document(doc_id: int, doc: DocumentSchema, payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)
    _get_document_or_404(cursor, doc_id, payload["entreprise_id"])

    cursor.execute("""
        UPDATE extractions SET
            nom=%s, prenom=%s, numero_doc=%s, nationalite=%s,
            date_naissance=%s, lieu_naissance=%s, sexe=%s,
            profession=%s, date_delivrance=%s, date_expiration=%s,
            motif_visite=%s, type_doc=%s, photo_profil=%s
        WHERE id = %s AND entreprise_id = %s
    """, (
        doc.nom, doc.prenom, doc.numero_doc, doc.nationalite,
        doc.date_naissance, doc.lieu_naissance, doc.sexe,
        doc.profession, doc.date_delivrance, doc.date_expiration,
        doc.motif_visite, doc.type_doc, doc.photo_profil,
        doc_id, payload["entreprise_id"]
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Document mis à jour avec succès"}


@router.put("/{doc_id}/sortie")
def marquer_sortie(doc_id: int, payload: dict = Depends(verify_token)):
    conn = _conn(payload)
    cursor = get_cursor(conn)
    existing = _get_document_or_404(cursor, doc_id, payload["entreprise_id"])

    if existing["heure_sortie"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=409, detail="La sortie de ce visiteur a déjà été enregistrée.")

    cursor.execute("""
        UPDATE extractions
        SET heure_sortie = TO_CHAR(NOW() AT TIME ZONE 'Africa/Abidjan', 'YYYY-MM-DD HH24:MI:SS')
        WHERE id = %s AND entreprise_id = %s
        RETURNING heure_sortie
    """, (doc_id, payload["entreprise_id"]))

    heure_sortie = cursor.fetchone()["heure_sortie"]
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Sortie enregistrée avec succès", "heure_sortie": heure_sortie}