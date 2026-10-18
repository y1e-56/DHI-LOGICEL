-- Regles du referentiel : seuils structures, exploitables par les controles.
--   value       valeur numerique du seuil
--   unit        score (/100) | percent (%) | days (jours) | count (nombre)
--   comparator  gte (>=) | lte (<=) : sens dans lequel la valeur mesuree doit respecter le seuil
--   mode        blocking (l'action est refusee) | warning (l'action demande confirmation)
-- La colonne threshold reste le libelle affiche, regenere a partir de ces champs.
ALTER TABLE referential_rules ADD COLUMN IF NOT EXISTS value NUMERIC;
ALTER TABLE referential_rules ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE referential_rules ADD COLUMN IF NOT EXISTS comparator TEXT;
ALTER TABLE referential_rules ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'warning';

DO $$ BEGIN
  ALTER TABLE referential_rules ADD CONSTRAINT referential_rules_unit_chk
    CHECK (unit IS NULL OR unit IN ('score', 'percent', 'days', 'count'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE referential_rules ADD CONSTRAINT referential_rules_comparator_chk
    CHECK (comparator IS NULL OR comparator IN ('gte', 'lte'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE referential_rules ADD CONSTRAINT referential_rules_mode_chk
    CHECK (mode IN ('blocking', 'warning'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Valeurs initiales, seulement tant qu'aucune valeur structuree n'existe :
-- un reglage deja fait par l'admin n'est jamais ecrase au redemarrage.
UPDATE referential_rules r SET value = v.value, unit = v.unit, comparator = v.comparator, mode = v.mode
FROM (VALUES
  ('RG-1',  85,  'score',   'gte', 'warning'),
  ('RG-2',  75,  'score',   'gte', 'warning'),
  ('RG-3',  60,  'score',   'gte', 'warning'),
  ('RG-4',  95,  'percent', 'gte', 'warning'),
  ('RG-5',  90,  'percent', 'gte', 'warning'),
  ('RG-6',  90,  'percent', 'gte', 'warning'),
  ('RG-7',  100, 'percent', 'gte', 'blocking'),
  ('RG-8',  7,   'days',    'lte', 'warning'),
  ('RG-9',  0,   'count',   'lte', 'blocking'),
  ('RG-10', 85,  'percent', 'gte', 'warning')
) AS v(id, value, unit, comparator, mode)
WHERE r.id = v.id AND r.value IS NULL;
