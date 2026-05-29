-- Migration 008: All indexes
-- Run AFTER 007

-- Species: search and filter
CREATE INDEX IF NOT EXISTS idx_species_common_name_fts
  ON fish_species USING gin(to_tsvector('english', common_name));
CREATE INDEX IF NOT EXISTS idx_species_scientific_name
  ON fish_species(scientific_name);
CREATE INDEX IF NOT EXISTS idx_species_category
  ON fish_species(category_id);
CREATE INDEX IF NOT EXISTS idx_species_water_type
  ON fish_species(water_type);
CREATE INDEX IF NOT EXISTS idx_species_care_level
  ON fish_species(care_level);
CREATE INDEX IF NOT EXISTS idx_species_temperament
  ON fish_species(temperament);
CREATE INDEX IF NOT EXISTS idx_species_verification
  ON fish_species(verification_status);
CREATE INDEX IF NOT EXISTS idx_species_filter_combo
  ON fish_species(water_type, care_level, temperament);

-- Species sources
CREATE INDEX IF NOT EXISTS idx_sources_species
  ON fish_species_sources(species_id);

-- User fish
CREATE INDEX IF NOT EXISTS idx_user_fish_owner
  ON user_fish(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_fish_status
  ON user_fish(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_user_fish_species
  ON user_fish(species_id);
CREATE INDEX IF NOT EXISTS idx_user_fish_start
  ON user_fish(start_date);

-- Fish photos
CREATE INDEX IF NOT EXISTS idx_photos_fish
  ON fish_photos(fish_id);
CREATE INDEX IF NOT EXISTS idx_photos_current
  ON fish_photos(fish_id, is_current);
CREATE INDEX IF NOT EXISTS idx_photos_captured
  ON fish_photos(fish_id, captured_at DESC);

-- Reminders
CREATE INDEX IF NOT EXISTS idx_reminders_owner
  ON reminders(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_due
  ON reminders(owner_id, next_due_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reminders_fish
  ON reminders(fish_id);

-- Compatibility rules
CREATE UNIQUE INDEX IF NOT EXISTS idx_compat_pair
  ON compatibility_rules(species_a_id, species_b_id);
