-- Phase 2-complément : Lien feature→scenarios, table incidents, table versions

-- ── Enums ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM (
    'ouvert', 'en_cours', 'corrige', 'verifie', 'rejete', 'ferme'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM (
    'mineur', 'majeur', 'critique', 'bloquant'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE version_status AS ENUM (
    'en_preparation', 'en_cours_de_test', 'release', 'archivee'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── Ajout feature_id à test_scenarios ───────────────────
ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS feature_id INTEGER REFERENCES features(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_test_scenarios_feature ON test_scenarios(feature_id);

-- ── Incidents (suivi des bugs / incidents de production) ─
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  severity incident_severity NOT NULL DEFAULT 'majeur',
  status incident_status NOT NULL DEFAULT 'ouvert',
  feature_id INTEGER REFERENCES features(id) ON DELETE SET NULL,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  anomaly_id INTEGER REFERENCES anomalies(id) ON DELETE SET NULL,
  test_execution_id INTEGER REFERENCES test_executions(id) ON DELETE SET NULL,
  reported_by INTEGER REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  environment VARCHAR(100),
  version_affected VARCHAR(50),
  fix_version VARCHAR(50),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_feature ON incidents(feature_id);
CREATE INDEX IF NOT EXISTS idx_incidents_campaign ON incidents(campaign_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);

-- ── Versions (versions logicielles testées) ─────────────
CREATE TABLE IF NOT EXISTS software_versions (
  id SERIAL PRIMARY KEY,
  version_number VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  feature_id INTEGER REFERENCES features(id) ON DELETE SET NULL,
  status version_status NOT NULL DEFAULT 'en_preparation',
  release_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_software_versions_campaign ON software_versions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_software_versions_feature ON software_versions(feature_id);
CREATE INDEX IF NOT EXISTS idx_software_versions_status ON software_versions(status);
