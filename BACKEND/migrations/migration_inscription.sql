-- Ajoute les colonnes nécessaires à l'inscription + vérification email
-- Les comptes déjà existants (comme ton super_admin) restent "vérifiés"
-- par défaut (email_verifie TRUE), pour ne pas te bloquer.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verifie BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_verification TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_expiration TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_token_verification ON users(token_verification);