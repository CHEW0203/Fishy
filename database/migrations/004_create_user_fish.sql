-- Migration 004: fish_status enum + user_fish
-- Run AFTER 003

DO $$ BEGIN
  CREATE TYPE fish_status AS ENUM ('alive', 'dead', 'sold', 'given_away', 'missing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- current_photo_id is NULL until 005 adds fish_photos and we add the FK
CREATE TABLE IF NOT EXISTS user_fish (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         TEXT NOT NULL DEFAULT 'local-user',
  species_id       UUID REFERENCES fish_species(id),
  name             TEXT NOT NULL,
  status           fish_status NOT NULL DEFAULT 'alive',
  start_date       DATE NOT NULL,
  death_date       DATE,
  end_date         DATE,
  current_photo_id UUID,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
