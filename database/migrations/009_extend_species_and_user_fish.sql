BEGIN;

-- Drop UNIQUE on scientific_name.
-- Reason: multiple strains share the same base scientific name.
-- e.g. Full Red Guppy, Blue Grass Guppy both = Poecilia reticulata.
ALTER TABLE fish_species
  DROP CONSTRAINT IF EXISTS fish_species_scientific_name_key;

-- Make scientific_name nullable.
-- Reason: hybrids (Flowerhorn, Blood Parrot) have no formal scientific name.
ALTER TABLE fish_species
  ALTER COLUMN scientific_name DROP NOT NULL;

-- Add entry_type.
-- Values: species | strain | variety | morph | hybrid
-- species = true biological species
-- strain  = selectively bred line (guppy strains, betta fin types)
-- variety = named variety (goldfish varieties, koi varieties)
-- morph   = color/pattern morph (Galaxy Betta, Dragon Scale Betta)
-- hybrid  = interspecific hybrid (Flowerhorn, Blood Parrot)
ALTER TABLE fish_species
  ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'species';

-- Add local_availability.
-- Values: 'common' | 'moderate' | 'rare' | NULL (unknown / not assessed)
ALTER TABLE fish_species
  ADD COLUMN IF NOT EXISTS local_availability TEXT;

-- Add custom_species_name to user_fish.
-- Stores free-text species name when user picks "Enter manually"
-- and species_id is NULL.
ALTER TABLE user_fish
  ADD COLUMN IF NOT EXISTS custom_species_name TEXT;

COMMIT;
