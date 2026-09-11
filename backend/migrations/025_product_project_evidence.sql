DO $$ BEGIN
  ALTER TYPE evidence_entity_type ADD VALUE IF NOT EXISTS 'product';
  ALTER TYPE evidence_entity_type ADD VALUE IF NOT EXISTS 'project';
EXCEPTION WHEN duplicate_object THEN null;
END $$;