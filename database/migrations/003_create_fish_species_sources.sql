-- Migration 003: source_type enum + fish_species_sources
-- Run AFTER 002

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM (
    'scientific_database', 'care_guide', 'organization',
    'breeder', 'forum_secondary', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS fish_species_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id       UUID NOT NULL REFERENCES fish_species(id) ON DELETE CASCADE,
  source_name      TEXT NOT NULL,
  source_url       TEXT,
  source_type      source_type NOT NULL DEFAULT 'other',
  fields_supported TEXT[],
  notes            TEXT,
  retrieved_at     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (species_id, source_name)
);
