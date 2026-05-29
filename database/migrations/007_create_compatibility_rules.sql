-- Migration 007: compatibility_level enum + compatibility_rules
-- Run AFTER 006

DO $$ BEGIN
  CREATE TYPE compatibility_level AS ENUM ('safe', 'caution', 'danger', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS compatibility_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_a_id        UUID NOT NULL REFERENCES fish_species(id),
  species_b_id        UUID NOT NULL REFERENCES fish_species(id),
  level               compatibility_level NOT NULL,
  reason              TEXT NOT NULL,
  source_id           UUID REFERENCES fish_species_sources(id),
  verification_status verification_status NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_pair CHECK (species_a_id != species_b_id),
  CONSTRAINT ordered_pair CHECK (species_a_id < species_b_id)
);
