-- ============================================================
-- Fishy Supabase Full Setup
-- Copy-paste this full file into Supabase SQL Editor for MVP setup.
-- This combines migrations 001-008, seed data, and MVP RLS settings.
-- Storage bucket creation is listed as a manual step at the end.
-- ============================================================

-- ============================================================
-- 001_create_fish_categories.sql
-- ============================================================

-- Migration 001: fish_categories
-- Run this first in Supabase SQL editor

CREATE TABLE IF NOT EXISTS fish_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 002_create_fish_species.sql
-- ============================================================

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

-- ============================================================
-- 003_create_fish_species_sources.sql
-- ============================================================

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

-- ============================================================
-- 004_create_user_fish.sql
-- ============================================================

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

-- ============================================================
-- 005_create_fish_photos.sql
-- ============================================================

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

-- ============================================================
-- 006_create_reminders.sql
-- ============================================================

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

-- ============================================================
-- 007_create_compatibility_rules.sql
-- ============================================================

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

-- ============================================================
-- 008_create_indexes.sql
-- ============================================================

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

-- ============================================================
-- categories.sql
-- ============================================================

-- Seed: fish_categories
-- Run AFTER migrations 001-008

INSERT INTO fish_categories (name, slug, description) VALUES
  ('Cichlid', 'cichlid', 'Cichlidae family - includes Oscars, Jack Dempseys, African cichlids, Discus'),
  ('Angelfish', 'angelfish', 'Freshwater angelfish - Pterophyllum species'),
  ('Gourami', 'gourami', 'Labyrinth fish - Pearl, Honey, Dwarf, Three Spot Gourami'),
  ('Betta', 'betta', 'Siamese fighting fish - Betta splendens and relatives'),
  ('Arowana', 'arowana', 'Large surface-dwelling predatory fish'),
  ('Goldfish', 'goldfish', 'Common and fancy goldfish - Carassius auratus varieties'),
  ('Koi', 'koi', 'Nishikigoi - ornamental carp for ponds and large aquariums'),
  ('Tetra', 'tetra', 'Small schooling fish - Neon, Cardinal, Rummy Nose and relatives'),
  ('Barb', 'barb', 'Active schooling fish - Tiger Barb, Cherry Barb, Rosy Barb'),
  ('Rasbora', 'rasbora', 'Small schooling fish - Harlequin, Chili Rasbora'),
  ('Catfish', 'catfish', 'Bottom-dwelling catfish - Corydoras, Synodontis and relatives'),
  ('Pleco', 'pleco', 'Armoured catfish - Common Pleco, Bristlenose Pleco, L-number plecos'),
  ('Loach', 'loach', 'Clown Loach, Kuhli Loach, Yoyo Loach'),
  ('Discus', 'discus', 'South American discus - Symphysodon species'),
  ('Livebearer', 'livebearer', 'Guppies, Platies, Swordtails, Mollies'),
  ('Marine Fish', 'marine-fish', 'Saltwater species - Clownfish, Blue Tang, Damselfish'),
  ('Brackish Fish', 'brackish-fish', 'Brackish water species - Figure 8 Puffer, Archer Fish'),
  ('River Monster Fish', 'river-monster-fish', 'Large predatory freshwater fish - Arapaima, Alligator Gar')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- species_seed.sql
-- ============================================================

-- Seed: Initial verified species
-- Sources: FishBase (fishbase.se), Seriously Fish (seriouslyfish.com)
-- Run AFTER categories.sql
-- Retrieved: 2026-05-26

-- ============================================================
-- 1. Betta splendens - Siamese Fighting Fish
-- Sources: FishBase fishbase.se/summary/Betta-splendens.html
--          Seriously Fish seriouslyfish.com/species/betta-splendens/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Siamese Fighting Fish', 'Betta splendens',
  (SELECT id FROM fish_categories WHERE slug = 'betta'),
  'freshwater', 'Thailand, Laos, Cambodia - slow-moving waters, rice paddies',
  5, 7, 2, 4,
  'aggressive', 'carnivore', 'beginner',
  24, 30,
  6.0, 8.0,
  1, 15,
  19,
  'top', false,
  'One of the most popular aquarium fish worldwide. Males display spectacular finnage and intense coloration. Builds bubble nests for breeding.',
  'Male Bettas must be kept individually - they will fight to the death with other males. A heated, filtered tank of at least 19 litres is required. Minimal water flow. Provide floating plants or a leaf hammock near the surface. Females can sometimes be kept together in larger groups (sororities) with caution.',
  'Carnivore. Feed high-quality betta pellets as staple. Supplement with frozen or live bloodworms, brine shrimp, daphnia. Feed small amounts once or twice daily. Avoid overfeeding - uneaten food pollutes water rapidly.',
  'Can coexist with fast-moving peaceful bottom dwellers such as Corydoras. Avoid tankmates with bright colors or flowing fins that may be mistaken for rival males.',
  'Other male Bettas, fish with flowing fins (male guppies, fancy angelfish), fin-nipping species (Tiger Barbs), aggressive species',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Betta-splendens.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin','diet'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Betta splendens'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/betta-splendens/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','temperament','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Betta splendens'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 2. Paracheirodon innesi - Neon Tetra
-- Sources: FishBase fishbase.se/summary/Paracheirodon-innesi.html
--          Seriously Fish seriouslyfish.com/species/paracheirodon-innesi/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Neon Tetra', 'Paracheirodon innesi',
  (SELECT id FROM fish_categories WHERE slug = 'tetra'),
  'freshwater', 'Western Amazon basin, Peru, Colombia, Brazil',
  3, 4, 5, 8,
  'peaceful', 'omnivore', 'beginner',
  20, 26,
  4.0, 7.5,
  1, 10,
  40,
  'mid', true,
  'One of the most recognisable aquarium fish. Named for its vivid iridescent blue stripe and red tail. Best kept in schools.',
  'Keep in groups of at least 6, ideally 10 or more. Prefers soft, slightly acidic, well-planted water. Sensitive to poor water quality and sudden parameter changes. Not suitable for new, uncycled tanks.',
  'Omnivore. Accepts high-quality micro pellets, crushed flakes, frozen baby brine shrimp, micro worms, Daphnia. Feed small amounts twice daily.',
  'Excellent community fish. Compatible with other small peaceful tetras, rasboras, small Corydoras, small plecos, dwarf cichlids.',
  'Large predatory fish (any fish that can fit a Neon Tetra in its mouth), aggressive cichlids, fish requiring hard alkaline water',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Paracheirodon-innesi.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Paracheirodon innesi'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/paracheirodon-innesi/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Paracheirodon innesi'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 3. Astronotus ocellatus - Oscar Cichlid
-- Sources: FishBase fishbase.se/summary/Astronotus-ocellatus.html
--          Seriously Fish seriouslyfish.com/species/astronotus-ocellatus/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Oscar Cichlid', 'Astronotus ocellatus',
  (SELECT id FROM fish_categories WHERE slug = 'cichlid'),
  'freshwater', 'Amazon River basin, South America',
  25, 35, 10, 15,
  'aggressive', 'carnivore', 'intermediate',
  23, 28,
  6.0, 8.0,
  5, 20,
  380,
  'mid', false,
  'A large, intelligent cichlid known for its personality and ability to recognise owners. Grows very large and produces significant waste.',
  'Requires a very large, heavily filtered aquarium (380+ litres for one adult). Powerful filtration essential. Will rearrange decor and uproot plants. Can be kept in pairs or with other large cichlids of similar size. Extremely territorial when breeding.',
  'Carnivore. In the wild eats fish, crustaceans, insects. In aquaria: high-quality cichlid pellets as staple. Supplement with earthworms, prawns, mussels. Avoid feeder fish - disease risk. Feed once daily, remove uneaten food.',
  'Can be kept with other large robust cichlids of similar size (e.g., Jack Dempseys). Best kept as a specimen fish or bonded pair.',
  'Small fish of any species (will be eaten), invertebrates, fin-nipping species, fish requiring pristine water conditions',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Astronotus-ocellatus.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin','lifespan_max_years'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Astronotus ocellatus'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/astronotus-ocellatus/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','temperament','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Astronotus ocellatus'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 4. Pterophyllum scalare - Freshwater Angelfish
-- Sources: FishBase fishbase.se/summary/Pterophyllum-scalare.html
--          Seriously Fish seriouslyfish.com/species/pterophyllum-scalare/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Freshwater Angelfish', 'Pterophyllum scalare',
  (SELECT id FROM fish_categories WHERE slug = 'angelfish'),
  'freshwater', 'Amazon River basin and tributaries, South America',
  12, 15, 8, 12,
  'semi_aggressive', 'omnivore', 'intermediate',
  24, 30,
  6.0, 7.5,
  3, 10,
  110,
  'mid', false,
  'Iconic tall-bodied cichlid with distinctive triangular fins. Sold in many color varieties. Can be territorial, especially when spawning.',
  'Requires a tall aquarium (minimum 45cm depth) due to body height. Prefers soft, slightly acidic water. Can be kept in groups when young but adults may form pairs and become territorial. Will eat very small fish.',
  'Omnivore. Accepts flake food, pellets, frozen bloodworms, brine shrimp, Daphnia. Feed 2-3 times daily in small amounts.',
  'Compatible with medium-sized peaceful fish: larger tetras (Black Skirt, Rummy Nose), Corydoras, peaceful cichlids, Discus.',
  'Very small fish (Neon Tetras - may be eaten), fin-nipping species (Tiger Barbs), highly aggressive cichlids',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Pterophyllum-scalare.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Pterophyllum scalare'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/pterophyllum-scalare/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Pterophyllum scalare'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 5. Carassius auratus - Common Goldfish
-- Sources: FishBase fishbase.se/summary/Carassius-auratus.html
--          Seriously Fish seriouslyfish.com/species/carassius-auratus/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Common Goldfish', 'Carassius auratus',
  (SELECT id FROM fish_categories WHERE slug = 'goldfish'),
  'freshwater', 'East Asia - originally China',
  20, 30, 10, 15,
  'peaceful', 'omnivore', 'beginner',
  10, 22,
  6.5, 8.5,
  5, 20,
  113,
  'mid', false,
  'The classic pet fish. Comes in many varieties. A coldwater species that does not require a heater. Produces significant waste and requires excellent filtration.',
  'Coldwater species - does NOT need a heater. Requires high filtration due to heavy waste production. Minimum 113 litres for one fish. Single-tailed varieties can grow very large. Not suitable for tropical community tanks - temperature mismatch.',
  'Omnivore. Accepts goldfish pellets, flakes, vegetables (blanched peas, spinach), occasional frozen bloodworms. Feed once or twice daily - amount consumed in 2 minutes.',
  'Compatible with other goldfish of similar size. Can be kept with weather loaches (Misgurnus) and White Cloud Mountain Minnows in coldwater setups.',
  'Tropical fish (temperature mismatch), small fish (goldfish may consume them), invertebrates',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Carassius-auratus.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin','lifespan_max_years'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Carassius auratus'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/carassius-auratus/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Carassius auratus'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 6. Corydoras paleatus - Peppered Corydoras
-- Sources: FishBase fishbase.se/summary/Corydoras-paleatus.html
--          Seriously Fish seriouslyfish.com/species/corydoras-paleatus/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Peppered Corydoras', 'Corydoras paleatus',
  (SELECT id FROM fish_categories WHERE slug = 'catfish'),
  'freshwater', 'South America - La Plata basin, Brazil, Argentina',
  5, 7, 3, 5,
  'peaceful', 'omnivore', 'beginner',
  18, 26,
  6.0, 7.2,
  2, 12,
  60,
  'bottom', true,
  'A popular, hardy bottom-dwelling catfish. Peaceful, active during the day, and best kept in groups. Uses barbels to forage through substrate.',
  'Keep in groups of at least 6. Requires a soft or fine-grained substrate to protect barbels - avoid sharp gravel. Sensitive to salt in the water. Good community fish.',
  'Omnivore. Sinking pellets, wafers, frozen bloodworms, tubifex, Daphnia. Feed once daily after lights-out or early morning when they are most active foraging.',
  'Excellent community fish. Compatible with virtually all peaceful community species. A classic bottom-level companion for tetras, rasboras, livebearers, angelfish.',
  'Fish requiring salt in water (Corydoras are sensitive to salt), aggressive cichlids that may bully bottom dwellers',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Corydoras-paleatus.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Corydoras paleatus'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/corydoras-paleatus/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Corydoras paleatus'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 7. Hypostomus plecostomus - Common Pleco
-- Sources: FishBase fishbase.se/summary/Hypostomus-plecostomus.html
--          Seriously Fish seriouslyfish.com/species/hypostomus-plecostomus/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Common Pleco', 'Hypostomus plecostomus',
  (SELECT id FROM fish_categories WHERE slug = 'pleco'),
  'freshwater', 'Trinidad, northeastern South America',
  30, 50, 10, 15,
  'peaceful', 'herbivore', 'beginner',
  22, 28,
  6.5, 7.5,
  3, 20,
  400,
  'bottom', false,
  'A large armoured catfish often sold as an algae eater. Grows very large - frequently outgrows home aquariums. Nocturnal. Produces significant waste.',
  'Grows up to 50 cm and requires a very large aquarium. Often purchased as juveniles and outgrows tanks - rehoming is common. Provides little meaningful algae control as an adult. Requires driftwood in the tank. Nocturnal - provide hiding spots.',
  'Primarily herbivore. In aquaria: algae wafers, blanched vegetables (zucchini, cucumber, peas, spinach), driftwood to rasp. Supplement with sinking pellets. Feed after lights out.',
  'Generally peaceful with most fish. Can be territorial with other bottom-dwelling plecos, especially in small tanks.',
  'Other plecos sharing the same territory (territorial fights), delicate plants (will uproot and eat them)',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Hypostomus-plecostomus.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Hypostomus plecostomus'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/hypostomus-plecostomus/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Hypostomus plecostomus'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 8. Poecilia reticulata - Guppy
-- Sources: FishBase fishbase.se/summary/Poecilia-reticulata.html
--          Seriously Fish seriouslyfish.com/species/poecilia-reticulata/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Guppy', 'Poecilia reticulata',
  (SELECT id FROM fish_categories WHERE slug = 'livebearer'),
  'freshwater', 'Trinidad, Barbados, Venezuela, northeastern Brazil',
  3, 6, 1, 2,
  'peaceful', 'omnivore', 'beginner',
  22, 28,
  7.0, 8.5,
  8, 20,
  40,
  'top', false,
  'One of the most commonly kept aquarium fish. Livebearers - give birth to free-swimming young. Males are colourful; females are larger and plainer.',
  'Hardy and adaptable. Males can be kept together but will also harass females. Maintain ratio of 2-3 females per male to reduce stress. Live-bearing - will breed readily; population control may be needed. Prefers hard, slightly alkaline water.',
  'Omnivore. Accepts flakes, micro pellets, frozen baby brine shrimp, Daphnia, vegetable-based foods. Feed small amounts 2-3 times daily.',
  'Good community fish with other peaceful small species. Compatible with most community tetras, Corydoras, small rasboras, small plecos.',
  'Bettas (males attack flowing fins), large predatory fish, aggressive cichlids, fin-nipping species like Tiger Barbs',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Poecilia-reticulata.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Poecilia reticulata'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/poecilia-reticulata/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Poecilia reticulata'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 9. Chromobotia macracanthus - Clown Loach
-- Sources: FishBase fishbase.se/summary/Chromobotia-macracanthus.html
--          Seriously Fish seriouslyfish.com/species/chromobotia-macracanthus/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Clown Loach', 'Chromobotia macracanthus',
  (SELECT id FROM fish_categories WHERE slug = 'loach'),
  'freshwater', 'Sumatra and Borneo, Indonesia',
  15, 30, 10, 20,
  'peaceful', 'omnivore', 'intermediate',
  25, 30,
  5.0, 8.0,
  3, 12,
  300,
  'bottom', true,
  'A large, active loach with vivid orange and black banding. Highly social - must be kept in groups. Very long-lived and grows much larger than commonly expected.',
  'Grows to 30 cm and is very long-lived. Requires a large aquarium (300+ litres for a group). Must be kept in groups of at least 6 - individuals pine away. Prefers soft water and high temperatures. Sensitive to poor water quality and medications (ich treatment can be problematic). Playful and active - will explore the entire tank.',
  'Omnivore. Accepts sinking pellets, wafers, frozen bloodworms, Daphnia, snails (a natural food - effective snail control). Feed once or twice daily.',
  'Excellent with other large peaceful fish. Ideal with large tetras, barbs, medium cichlids that share similar water requirements.',
  'Aggressive cichlids, fin-nipping species, fish requiring cool water (goldfish), small delicate fish that may be disturbed by their activity',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Chromobotia-macracanthus.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin','lifespan_max_years'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Chromobotia macracanthus'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/chromobotia-macracanthus/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Chromobotia macracanthus'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 10. Symphysodon discus - Discus
-- Sources: FishBase fishbase.se/summary/Symphysodon-discus.html
--          Seriously Fish seriouslyfish.com/species/symphysodon-discus/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Discus', 'Symphysodon discus',
  (SELECT id FROM fish_categories WHERE slug = 'discus'),
  'freshwater', 'Amazon River floodplains, Brazil',
  15, 20, 10, 15,
  'semi_aggressive', 'carnivore', 'advanced',
  26, 32,
  5.0, 7.0,
  1, 8,
  200,
  'mid', true,
  'Often called the "King of the Aquarium". Disc-shaped cichlid with extraordinary coloration. Demanding water requirements - soft, very warm, very clean water is essential.',
  'One of the most demanding aquarium fish. Requires very warm water (26-32 C), very soft and acidic conditions, and pristine water quality. Frequent large water changes required (25-50% every 1-3 days for optimal health). Sensitive to stress and temperature swings. Not suitable for beginners.',
  'Carnivore. Wild diet includes invertebrates, plant material. In aquaria: high-quality discus pellets, frozen bloodworms, beef heart mix (commercial preparations). Feed 2-3 times daily. Remove uneaten food promptly.',
  'Best kept with other Discus in species-specific setups. Can be kept with small, peaceful, warm-water fish such as cardinal tetras, small Corydoras, rummy-nose tetras that tolerate the same water parameters.',
  'Fish requiring cooler water, fish requiring hard/alkaline water, aggressive species, large fish',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Symphysodon-discus.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Symphysodon discus'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/symphysodon-discus/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Symphysodon discus'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 11. Amphiprion ocellaris - Common Clownfish
-- Sources: FishBase fishbase.se/summary/Amphiprion-ocellaris.html
--          Seriously Fish seriouslyfish.com/species/amphiprion-ocellaris/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Common Clownfish', 'Amphiprion ocellaris',
  (SELECT id FROM fish_categories WHERE slug = 'marine-fish'),
  'marine', 'Eastern Indian Ocean, Western Pacific - associated with sea anemones',
  8, 11, 6, 10,
  'semi_aggressive', 'omnivore', 'intermediate',
  24, 28,
  8.1, 8.4,
  NULL, NULL,
  114,
  'mid', false,
  'The "Nemo" fish. The most recognisable marine aquarium fish. Lives symbiotically with sea anemones in the wild. Hardy for a marine species.',
  'Saltwater species - MARINE ONLY. Requires a reef or fish-only marine aquarium with a specific gravity (salinity) of 1.020-1.025. Can be kept with or without an anemone host. All-captive-bred specimens are strongly preferred over wild-caught. Pairs bond for life.',
  'Omnivore. Accepts marine pellets, frozen Mysis shrimp, brine shrimp, Cyclops, finely chopped fish/seafood. Feed once or twice daily.',
  'Generally compatible with peaceful reef fish. Can be aggressive toward other clownfish (will defend territory around anemone or chosen host).',
  'Freshwater fish of any kind (completely incompatible water type), other clownfish in small tanks (territorial), large predatory reef fish',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Amphiprion-ocellaris.html',
  'scientific_database',
  ARRAY['scientific_name','adult_size_max_cm','temperature_min_c','temperature_max_c','origin'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Amphiprion ocellaris'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/amphiprion-ocellaris/',
  'care_guide',
  ARRAY['ph_min','ph_max','minimum_tank_size_liters','care_notes','feeding_notes','care_level'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Amphiprion ocellaris'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- 12. Ancistrus cf. cirrhosus - Bristlenose Pleco
-- Sources: FishBase fishbase.se/summary/Ancistrus-sp.html
--          Seriously Fish seriouslyfish.com/species/ancistrus-cf-cirrhosus/
-- ============================================================
INSERT INTO fish_species (
  common_name, scientific_name, category_id,
  water_type, origin,
  adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level,
  temperature_min_c, temperature_max_c,
  ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters,
  tank_level, schooling_behavior,
  description, care_notes, feeding_notes,
  compatibility_notes, avoid_with_notes,
  verification_status, confidence_level
) VALUES (
  'Bristlenose Pleco', 'Ancistrus cf. cirrhosus',
  (SELECT id FROM fish_categories WHERE slug = 'pleco'),
  'freshwater', 'South America - Amazon and Orinoco basins',
  10, 15, 5, 12,
  'peaceful', 'herbivore', 'beginner',
  20, 28,
  6.0, 7.5,
  2, 15,
  70,
  'bottom', false,
  'A much more suitable alternative to the Common Pleco for most aquariums. Stays smaller (max ~15cm) and provides genuine algae control. Males have distinctive bristle appendages on the face.',
  'Stays small enough for most community aquariums. Good algae eater. Provide driftwood - essential for digestion and hiding. Can be kept as a breeding pair in a community tank. Males may be territorial with other males. Generally peaceful with other species.',
  'Primarily herbivore. Algae wafers, blanched vegetables (zucchini, spinach, cucumber, peas), driftwood. Supplement with sinking pellets. Feed after lights-out.',
  'Excellent community fish. Compatible with virtually all peaceful community species. Will not bother other fish. Useful algae control in planted or community tanks.',
  'Other male Bristlenose Plecos (territorial in small tanks), cichlids that may attack bottom-dwellers',
  'verified', 'high'
)
ON CONFLICT (scientific_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/ancistrus-cf-cirrhosus/',
  'care_guide',
  ARRAY['ph_min','ph_max','hardness_min_dgh','hardness_max_dgh','minimum_tank_size_liters','care_notes','feeding_notes','care_level','adult_size_max_cm','temperature_min_c','temperature_max_c'],
  '2026-05-26'
FROM fish_species WHERE scientific_name = 'Ancistrus cf. cirrhosus'
ON CONFLICT (species_id, source_name) DO NOTHING;

-- ============================================================
-- MVP RLS Disable Setup
-- ============================================================
-- MVP personal-use setup: disable RLS so the Expo app can use the anon key during local development.
-- Revisit these policies before adding real authentication or production multi-user behavior.

ALTER TABLE fish_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE fish_species DISABLE ROW LEVEL SECURITY;
ALTER TABLE fish_species_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_fish DISABLE ROW LEVEL SECURITY;
ALTER TABLE fish_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_rules DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Manual Storage Setup Required
-- ============================================================
-- MANUAL STORAGE SETUP REQUIRED:
-- Go to Supabase Dashboard > Storage > New bucket
-- Bucket name: fish-photos
-- Set Public bucket = ON for MVP
-- Create bucket
--
-- If uploads are blocked, run these MVP storage object policies:
--
-- DROP POLICY IF EXISTS "fish_photos_public_read" ON storage.objects;
-- CREATE POLICY "fish_photos_public_read"
-- ON storage.objects
-- FOR SELECT
-- TO anon
-- USING (bucket_id = 'fish-photos');
--
-- DROP POLICY IF EXISTS "fish_photos_anon_upload" ON storage.objects;
-- CREATE POLICY "fish_photos_anon_upload"
-- ON storage.objects
-- FOR INSERT
-- TO anon
-- WITH CHECK (bucket_id = 'fish-photos');
--
-- DROP POLICY IF EXISTS "fish_photos_anon_update" ON storage.objects;
-- CREATE POLICY "fish_photos_anon_update"
-- ON storage.objects
-- FOR UPDATE
-- TO anon
-- USING (bucket_id = 'fish-photos')
-- WITH CHECK (bucket_id = 'fish-photos');
--
-- DROP POLICY IF EXISTS "fish_photos_anon_delete" ON storage.objects;
-- CREATE POLICY "fish_photos_anon_delete"
-- ON storage.objects
-- FOR DELETE
-- TO anon
-- USING (bucket_id = 'fish-photos');

