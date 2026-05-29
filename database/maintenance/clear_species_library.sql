-- MANUAL MAINTENANCE SCRIPT
-- Phase 19A: Clear old species library before Malaysia ornamental fish V1 seed.
-- Run in Supabase SQL Editor. Do NOT run automatically.
-- This clears fish_species and fish_species_sources.
-- user_fish records are preserved; species_id is set to NULL.
-- fish_categories rows are NOT deleted.

BEGIN;

-- Unlink all user fish from species before deleting species rows.
-- user_fish.species_id is nullable, so this is safe.
UPDATE user_fish SET species_id = NULL WHERE species_id IS NOT NULL;

-- Delete sources first (also covered by ON DELETE CASCADE on fish_species).
DELETE FROM fish_species_sources;

-- Delete all species entries from the old partial library.
DELETE FROM fish_species;

-- Note: fish_categories rows are intentionally kept.
-- They will be reused when the Malaysia ornamental fish V1 library is seeded in Phase 19B/19C.

COMMIT;
