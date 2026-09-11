-- Phase 2 CDC : Test Executions, Evidence, Dependencies

-- ── Enums ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE execution_result AS ENUM (
    'passed', 'failed', 'blocked', 'not_run', 'skipped'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE dependency_type AS ENUM (
    'blocks', 'helps', 'relates_to'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE evidence_entity_type AS ENUM (
    'test_execution', 'anomaly', 'requirement', 'feature', 'campaign'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── Test Executions (suivi de chaque exécution d'un cas de test) ──
CREATE TABLE IF NOT EXISTS test_executions (
  id SERIAL PRIMARY KEY,
  test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  executed_by INTEGER REFERENCES users(id),
  result execution_result NOT NULL DEFAULT 'not_run',
  execution_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER,
  environment VARCHAR(100),
  notes TEXT,
  screenshot_path VARCHAR(500),
  expected_behavior TEXT,
  actual_behavior TEXT,
  anomaly_id INTEGER REFERENCES anomalies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_executions_test_case ON test_executions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_campaign ON test_executions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_executed_by ON test_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_test_executions_result ON test_executions(result);
CREATE INDEX IF NOT EXISTS idx_test_executions_anomaly ON test_executions(anomaly_id);

-- ── Evidence (preuves / pièces jointes) ───────────────────
CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY,
  entity_type evidence_entity_type NOT NULL,
  entity_id INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size VARCHAR(50),
  description TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_entity ON evidence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON evidence(uploaded_by);

-- ── Dependencies (dépendances entre fonctionnalités) ─────
CREATE TABLE IF NOT EXISTS feature_dependencies (
  id SERIAL PRIMARY KEY,
  feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  depends_on_feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  dependency_type dependency_type NOT NULL DEFAULT 'blocks',
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feature_id, depends_on_feature_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_deps_feature ON feature_dependencies(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_deps_depends_on ON feature_dependencies(depends_on_feature_id);
