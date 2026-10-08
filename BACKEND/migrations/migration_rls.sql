-- Active Row-Level Security sur la table extractions.
-- Même si le code applicatif filtre déjà par entreprise_id (testé et validé),
-- ceci ajoute une protection au niveau de PostgreSQL lui-même : même une
-- requête SQL mal écrite dans une future route ne pourra pas voir les
-- données d'une autre entreprise.

ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

-- FORCE est nécessaire car l'application se connecte avec l'utilisateur
-- propriétaire de la table (postgres) ; sans FORCE, le propriétaire
-- contournerait RLS par défaut.
ALTER TABLE extractions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_extractions ON extractions;

CREATE POLICY tenant_isolation_extractions ON extractions
USING (
    entreprise_id = NULLIF(current_setting('app.entreprise_id', true), '')::integer
    OR current_setting('app.role', true) = 'super_admin'
)
WITH CHECK (
    entreprise_id = NULLIF(current_setting('app.entreprise_id', true), '')::integer
    OR current_setting('app.role', true) = 'super_admin'
);

-- Vérification : sans contexte défini (app.entreprise_id vide), aucune
-- ligne n'est visible ni modifiable. C'est le comportement voulu
-- (refus par défaut plutôt qu'accès par défaut).