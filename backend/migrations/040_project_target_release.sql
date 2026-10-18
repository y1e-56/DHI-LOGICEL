-- Version cible d'un projet : une version (release) du produit du projet.
-- Jusqu'ici la version cible n'etait stockee nulle part et se perdait.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_release_id INTEGER REFERENCES releases(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_target_release_id ON projects(target_release_id);
