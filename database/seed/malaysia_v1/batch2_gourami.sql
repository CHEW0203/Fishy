BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, origin,
  adult_size_min_cm, adult_size_max_cm, lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh, minimum_tank_size_liters, tank_level,
  schooling_behavior, description, care_notes, feeding_notes, compatibility_notes,
  avoid_with_notes, image_url, thumbnail_url, image_license, image_source_url,
  verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type, v.origin,
  v.adult_size_min_cm, v.adult_size_max_cm, v.lifespan_min_years, v.lifespan_max_years,
  v.temperament::temperament, v.diet::diet_type, v.care_level::care_level,
  v.temperature_min_c, v.temperature_max_c, v.ph_min, v.ph_max,
  v.hardness_min_dgh, v.hardness_max_dgh, v.minimum_tank_size_liters, v.tank_level,
  v.schooling_behavior, v.description, v.care_notes, v.feeding_notes, v.compatibility_notes,
  v.avoid_with_notes, v.image_url, v.thumbnail_url, v.image_license, v.image_source_url,
  v.verification_status::verification_status, v.confidence_level::confidence_level,
  v.last_reviewed_at::timestamptz, v.local_availability
FROM (VALUES
  ('Dwarf Gourami', 'Trichogaster lalius', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'South Asia; widely captive-bred in the aquarium trade', 5, 7, NULL, NULL, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 40, 'Middle to top', false, 'Small colourful labyrinth fish widely kept in planted community aquariums.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Powder Blue Dwarf Gourami', 'Trichogaster lalius', 'variety', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from South Asia', 5, 7, NULL, NULL, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 40, 'Middle to top', false, 'Powder-blue colour variety of the Dwarf Gourami.', 'Water parameters follow the base species Trichogaster lalius.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Flame Dwarf Gourami', 'Trichogaster lalius', 'variety', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from South Asia', 5, 7, NULL, NULL, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 40, 'Middle to top', false, 'Red-orange colour variety of the Dwarf Gourami.', 'Water parameters follow the base species Trichogaster lalius.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Honey Gourami', 'Trichogaster chuna', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'India and Bangladesh', 4, 5, NULL, NULL, 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, NULL, NULL, 40, 'Middle to top', false, 'Peaceful small gourami suited to planted community tanks.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Pearl Gourami', 'Trichopodus leerii', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Southeast Asia including Malaysia, Thailand, Sumatra and Borneo', 10, 12, NULL, NULL, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 110, 'Middle to top', false, 'Graceful Southeast Asian gourami with pearl-like body spotting.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Moonlight Gourami', 'Trichopodus microlepis', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Mekong and Chao Phraya basins', 12, 15, NULL, NULL, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 110, 'Middle to top', false, 'Pale silver gourami with a calm temperament and larger adult size.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Three Spot Gourami', 'Trichopodus trichopterus', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Southeast Asia', 10, 15, NULL, NULL, 'semi_aggressive', 'omnivore', 'beginner', 24, 28, 6.0, 8.0, NULL, NULL, 110, 'Middle to top', false, 'Hardy gourami species that is the base for several common colour varieties.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Blue Gourami', 'Trichopodus trichopterus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Southeast Asia', 10, 15, NULL, NULL, 'semi_aggressive', 'omnivore', 'beginner', 24, 28, 6.0, 8.0, NULL, NULL, 110, 'Middle to top', false, 'Blue colour variety of the Three Spot Gourami.', 'Water parameters follow the base species Trichopodus trichopterus.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Gold Gourami', 'Trichopodus trichopterus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Southeast Asia', 10, 15, NULL, NULL, 'semi_aggressive', 'omnivore', 'beginner', 24, 28, 6.0, 8.0, NULL, NULL, 110, 'Middle to top', false, 'Gold colour variety of the Three Spot Gourami.', 'Water parameters follow the base species Trichopodus trichopterus.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Opaline Gourami', 'Trichopodus trichopterus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Southeast Asia', 10, 15, NULL, NULL, 'semi_aggressive', 'omnivore', 'beginner', 24, 28, 6.0, 8.0, NULL, NULL, 110, 'Middle to top', false, 'Marbled blue variety of the Three Spot Gourami.', 'Water parameters follow the base species Trichopodus trichopterus.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Snakeskin Gourami', 'Trichopodus pectoralis', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Southeast Asia', 15, 25, NULL, NULL, 'peaceful', 'omnivore', 'intermediate', 24, 28, 6.0, 8.0, NULL, NULL, 200, 'Middle to top', false, 'Large gourami from Southeast Asia with snakeskin-like patterning.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Croaking Gourami', 'Trichopsis vittata', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Southeast Asia', 5, 7, NULL, NULL, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 40, 'Middle to top', false, 'Small labyrinth fish known for audible croaking sounds.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Sparkling Gourami', 'Trichopsis pumila', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Southeast Asia', 3, 4, NULL, NULL, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 30, 'Middle to top', false, 'Tiny colourful gourami suited to quiet planted aquariums.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Giant Gourami', 'Osphronemus goramy', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Southeast Asia; common food fish in Malaysia', 50, 70, NULL, NULL, 'semi_aggressive', 'omnivore', 'intermediate', 24, 30, 6.5, 8.0, NULL, NULL, 500, 'Middle to top', false, 'Very large gourami kept as a food fish and pond ornamental in Malaysia.', 'Requires a very large aquarium or pond as an adult.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Chocolate Gourami', 'Sphaerichthys osphromenoides', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Peat swamp habitats of Southeast Asia including Malaysia and Indonesia', 4, 6, NULL, NULL, 'peaceful', 'omnivore', 'advanced', 24, 28, 4.0, 6.5, 1, 5, 40, 'Middle to top', false, 'Delicate blackwater gourami from soft acidic peat swamp habitats.', 'Sensitive to water quality; needs very soft acidic blackwater and a mature quiet aquarium.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'rare'),
  ('Licorice Gourami', 'Parosphromenus deissneri', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Osphronemidae', 'freshwater', 'Blackwater habitats of Southeast Asia', 3, 4, NULL, NULL, 'peaceful', 'carnivore', 'advanced', 24, 28, 4.0, 6.5, 1, 5, 30, 'Middle to top', false, 'Small specialist blackwater gourami requiring very soft acidic water.', 'Requires specialist blackwater conditions and small live or frozen foods.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, origin,
  adult_size_min_cm, adult_size_max_cm, lifespan_min_years, lifespan_max_years,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max,
  hardness_min_dgh, hardness_max_dgh, minimum_tank_size_liters, tank_level,
  schooling_behavior, description, care_notes, feeding_notes, compatibility_notes,
  avoid_with_notes, image_url, thumbnail_url, image_license, image_source_url,
  verification_status, confidence_level, last_reviewed_at, local_availability
)
WHERE NOT EXISTS (
  SELECT 1 FROM fish_species existing
  WHERE existing.common_name = v.common_name
    AND existing.entry_type = v.entry_type
);

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase', s.url, 'scientific_database',
ARRAY['scientific_name','water_type','origin','adult_size_min_cm','adult_size_max_cm','temperature_min_c','temperature_max_c','ph_min','ph_max'],
s.notes, '2025-01-01'
FROM fish_species fs
JOIN (VALUES
  ('Dwarf Gourami', 'species', 'https://www.fishbase.se/summary/Trichogaster-lalius.html', NULL),
  ('Powder Blue Dwarf Gourami', 'variety', 'https://www.fishbase.se/summary/Trichogaster-lalius.html', 'Parameters inherited from base species Trichogaster lalius'),
  ('Flame Dwarf Gourami', 'variety', 'https://www.fishbase.se/summary/Trichogaster-lalius.html', 'Parameters inherited from base species Trichogaster lalius'),
  ('Honey Gourami', 'species', 'https://www.fishbase.se/summary/Trichogaster-chuna.html', NULL),
  ('Pearl Gourami', 'species', 'https://www.fishbase.se/summary/Trichopodus-leerii.html', NULL),
  ('Moonlight Gourami', 'species', 'https://www.fishbase.se/summary/Trichopodus-microlepis.html', NULL),
  ('Three Spot Gourami', 'species', 'https://www.fishbase.se/summary/Trichopodus-trichopterus.html', NULL),
  ('Blue Gourami', 'variety', 'https://www.fishbase.se/summary/Trichopodus-trichopterus.html', 'Parameters inherited from base species Trichopodus trichopterus'),
  ('Gold Gourami', 'variety', 'https://www.fishbase.se/summary/Trichopodus-trichopterus.html', 'Parameters inherited from base species Trichopodus trichopterus'),
  ('Opaline Gourami', 'variety', 'https://www.fishbase.se/summary/Trichopodus-trichopterus.html', 'Parameters inherited from base species Trichopodus trichopterus'),
  ('Snakeskin Gourami', 'species', 'https://www.fishbase.se/summary/Trichopodus-pectoralis.html', NULL),
  ('Croaking Gourami', 'species', 'https://www.fishbase.se/summary/Trichopsis-vittata.html', NULL),
  ('Sparkling Gourami', 'species', 'https://www.fishbase.se/summary/Trichopsis-pumila.html', NULL),
  ('Giant Gourami', 'species', 'https://www.fishbase.se/summary/Osphronemus-goramy.html', NULL),
  ('Chocolate Gourami', 'species', 'https://www.fishbase.se/summary/Sphaerichthys-osphromenoides.html', NULL),
  ('Licorice Gourami', 'species', 'https://www.fishbase.se/summary/Parosphromenus-deissneri.html', NULL)
) AS s(common_name, entry_type, url, notes)
  ON fs.common_name = s.common_name AND fs.entry_type = s.entry_type
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'Seriously Fish', s.url, 'care_guide',
ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species fs
JOIN (VALUES
  ('Dwarf Gourami', 'https://www.seriouslyfish.com/species/trichogaster-lalius/'),
  ('Honey Gourami', 'https://www.seriouslyfish.com/species/trichogaster-chuna/'),
  ('Pearl Gourami', 'https://www.seriouslyfish.com/species/trichopodus-leerii/'),
  ('Moonlight Gourami', 'https://www.seriouslyfish.com/species/trichopodus-microlepis/'),
  ('Three Spot Gourami', 'https://www.seriouslyfish.com/species/trichopodus-trichopterus/'),
  ('Snakeskin Gourami', 'https://www.seriouslyfish.com/species/trichopodus-pectoralis/'),
  ('Croaking Gourami', 'https://www.seriouslyfish.com/species/trichopsis-vittata/'),
  ('Sparkling Gourami', 'https://www.seriouslyfish.com/species/trichopsis-pumila/'),
  ('Giant Gourami', 'https://www.seriouslyfish.com/species/osphronemus-goramy/'),
  ('Chocolate Gourami', 'https://www.seriouslyfish.com/species/sphaerichthys-osphromenoides/')
) AS s(common_name, url)
  ON fs.common_name = s.common_name AND fs.entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
