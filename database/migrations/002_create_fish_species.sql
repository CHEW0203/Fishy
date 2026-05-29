-- Migration 002: Enums + fish_species
-- Run AFTER 001

-- Enums (skip if already exist)
DO $$ BEGIN
  CREATE TYPE water_type AS ENUM ('freshwater', 'brackish', 'marine', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE temperament AS ENUM ('peaceful', 'semi_aggressive', 'aggressive', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE diet_type AS ENUM ('carnivore', 'herbivore', 'omnivore', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE care_level AS ENUM ('beginner', 'intermediate', 'advanced', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('verified', 'partially_verified', 'draft', 'needs_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- fish_species table
CREATE TABLE IF NOT EXISTS fish_species (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name              TEXT NOT NULL,
  scientific_name          TEXT NOT NULL UNIQUE,
  category_id              UUID REFERENCES fish_categories(id),
  family                   TEXT,
  water_type               water_type NOT NULL DEFAULT 'unknown',
  origin                   TEXT,
  adult_size_min_cm        NUMERIC,
  adult_size_max_cm        NUMERIC,
  lifespan_min_years       NUMERIC,
  lifespan_max_years       NUMERIC,
  temperament              temperament NOT NULL DEFAULT 'unknown',
  diet                     diet_type NOT NULL DEFAULT 'unknown',
  care_level               care_level NOT NULL DEFAULT 'unknown',
  temperature_min_c        NUMERIC,
  temperature_max_c        NUMERIC,
  ph_min                   NUMERIC,
  ph_max                   NUMERIC,
  hardness_min_dgh         NUMERIC,
  hardness_max_dgh         NUMERIC,
  minimum_tank_size_liters NUMERIC,
  tank_level               TEXT,
  schooling_behavior       BOOLEAN,
  description              TEXT,
  care_notes               TEXT,
  feeding_notes            TEXT,
  compatibility_notes      TEXT,
  avoid_with_notes         TEXT,
  image_url                TEXT,
  thumbnail_url            TEXT,
  image_license            TEXT,
  image_source_url         TEXT,
  verification_status      verification_status NOT NULL DEFAULT 'draft',
  confidence_level         confidence_level NOT NULL DEFAULT 'unknown',
  last_reviewed_at         TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
