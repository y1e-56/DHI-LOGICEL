-- Go Live : décisions Go/No-Go et checklist de validation par release
-- Modèle front de référence : GoLiveVerdict / GoLiveChecklistItem / GoLiveDecision
DO $$ BEGIN
  CREATE TYPE go_live_verdict AS ENUM ('GO', 'GO_CONDITIONNEL', 'NO_GO', 'AJOURNE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'go_live_decision';

CREATE TABLE IF NOT EXISTS go_live_checklist (
  id SERIAL PRIMARY KEY,
  release_ref VARCHAR(50) NOT NULL,
  template_key VARCHAR(20) NOT NULL,
  label TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 0,
  is_checked BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(release_ref, template_key)
);

CREATE INDEX IF NOT EXISTS idx_go_live_checklist_release_ref ON go_live_checklist(release_ref);

CREATE TABLE IF NOT EXISTS go_live_decisions (
  id SERIAL PRIMARY KEY,
  release_ref VARCHAR(50) NOT NULL,
  verdict go_live_verdict NOT NULL,
  decider VARCHAR(150) NOT NULL,
  justification TEXT,
  checklist_completion INTEGER NOT NULL DEFAULT 0,
  decided_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_go_live_decisions_release_ref ON go_live_decisions(release_ref);