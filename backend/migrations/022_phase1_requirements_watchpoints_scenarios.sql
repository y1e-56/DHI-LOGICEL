-- Phase 1 CDC : Requirements, WatchPoints, TestScenarios + enrichissement test_cases

-- ── Enums (IF NOT EXISTS via DO block) ────────────────────
DO $$ BEGIN
  CREATE TYPE test_case_type AS ENUM (
    'fonctionnel', 'integration', 'end_to_end', 'regression', 'unitaire',
    'api', 'interface', 'securite', 'performance', 'charge', 'stress',
    'endurance', 'resilience', 'compatibilite', 'accessibilite',
    'ergonomie', 'disponibilite', 'recuperation', 'installation',
    'migration', 'documentation', 'testabilite'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE requirement_category AS ENUM (
    'fonctionnelle', 'securite', 'performance', 'disponibilite',
    'ergonomie', 'accessibilite', 'maintenabilite', 'compatibilite',
    'resilience', 'observabilite', 'documentation', 'testabilite', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE requirement_status AS ENUM (
    'proposed', 'validated', 'approved', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE watch_point_status AS ENUM (
    'open', 'validated', 'passed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── Requirements ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requirements (
  id SERIAL PRIMARY KEY,
  feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category requirement_category NOT NULL DEFAULT 'fonctionnelle',
  status requirement_status NOT NULL DEFAULT 'proposed',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requirements_feature ON requirements(feature_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);

-- ── Watch Points (points critiques / à surveiller) ────────
CREATE TABLE IF NOT EXISTS watch_points (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  feature_id INTEGER REFERENCES features(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  context TEXT,
  criticality priority_level NOT NULL DEFAULT 'high',
  consequence TEXT,
  owner_id INTEGER REFERENCES users(id),
  validation_criteria TEXT,
  recommendations TEXT,
  status watch_point_status NOT NULL DEFAULT 'open',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watch_points_project ON watch_points(project_id);
CREATE INDEX IF NOT EXISTS idx_watch_points_campaign ON watch_points(campaign_id);
CREATE INDEX IF NOT EXISTS idx_watch_points_feature ON watch_points(feature_id);
CREATE INDEX IF NOT EXISTS idx_watch_points_status ON watch_points(status);
CREATE INDEX IF NOT EXISTS idx_watch_points_criticality ON watch_points(criticality);

-- ── Test Scenarios ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_scenarios (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category test_case_type NOT NULL DEFAULT 'fonctionnel',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_scenarios_campaign ON test_scenarios(campaign_id);

-- ── Enrichissement test_cases ─────────────────────────────
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS type test_case_type NOT NULL DEFAULT 'fonctionnel';
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS criticality priority_level NOT NULL DEFAULT 'medium';
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS evaluation_method TEXT;
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS tolerance VARCHAR(100);
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS version VARCHAR(50);
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS scenario_id INTEGER REFERENCES test_scenarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_test_cases_scenario ON test_cases(scenario_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_type ON test_cases(type);
CREATE INDEX IF NOT EXISTS idx_test_cases_criticality ON test_cases(criticality);
