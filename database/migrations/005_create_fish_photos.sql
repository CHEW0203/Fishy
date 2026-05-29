-- Migration 005: fish_photos + circular FK resolution
-- Run AFTER 004

CREATE TABLE IF NOT EXISTS fish_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_id       UUID NOT NULL REFERENCES user_fish(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  photo_url     TEXT NOT NULL,
  thumbnail_url TEXT,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  note          TEXT,
  is_current    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resolve circular FK: user_fish.current_photo_id -> fish_photos.
-- PostgreSQL does not support "ADD CONSTRAINT IF NOT EXISTS", so guard it explicitly.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_current_photo'
      AND conrelid = 'user_fish'::regclass
  ) THEN
    ALTER TABLE user_fish
      ADD CONSTRAINT fk_current_photo
      FOREIGN KEY (current_photo_id) REFERENCES fish_photos(id);
  END IF;
END $$;
