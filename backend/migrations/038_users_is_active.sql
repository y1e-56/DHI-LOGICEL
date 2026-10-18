-- Desactivation reversible d'un compte, distincte de la suppression (date_suppression)
-- et des verrouillages temporaires apres echecs de connexion (locked_until).
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
