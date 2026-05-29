-- Migration 006: reminder_type enum + reminders
-- Run AFTER 005

DO $$ BEGIN
  CREATE TYPE reminder_type AS ENUM (
    'feeding', 'photo_update', 'health_check', 'water_change', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS reminders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          TEXT NOT NULL DEFAULT 'local-user',
  fish_id           UUID REFERENCES user_fish(id) ON DELETE CASCADE,
  species_id        UUID REFERENCES fish_species(id),
  type              reminder_type NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  frequency         TEXT NOT NULL DEFAULT 'daily',
  next_due_at       TIMESTAMPTZ NOT NULL,
  last_completed_at TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
