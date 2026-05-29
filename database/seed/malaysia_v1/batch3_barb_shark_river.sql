BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, origin, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, avoid_with_notes, image_url, thumbnail_url, image_license,
  image_source_url, verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type, v.origin,
  v.adult_size_min_cm, v.adult_size_max_cm, v.temperament::temperament, v.diet::diet_type, v.care_level::care_level,
  v.temperature_min_c, v.temperature_max_c, v.ph_min, v.ph_max, v.minimum_tank_size_liters, v.tank_level,
  v.schooling_behavior, v.description, v.care_notes, v.avoid_with_notes, v.image_url, v.thumbnail_url, v.image_license,
  v.image_source_url, v.verification_status::verification_status, v.confidence_level::confidence_level,
  v.last_reviewed_at::timestamptz, v.local_availability
FROM (VALUES
  ('Tiger Barb', 'Puntigrus tetrazona', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 5, 7, 'semi_aggressive', 'omnivore', 'beginner', 22, 28, 6.0, 8.0, 75, 'Middle', true, 'Active striped barb known as a fin-nipper if kept in too small a group.', 'Keep in groups of 6 or more to spread aggression.', 'Long-finned slow tankmates', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Green Tiger Barb', 'Puntigrus tetrazona', 'variety', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Selectively bred; base species from Southeast Asia', 5, 7, 'semi_aggressive', 'omnivore', 'beginner', 22, 28, 6.0, 8.0, 75, 'Middle', true, 'Green colour variety of Tiger Barb.', 'Parameters inherited from base species Puntigrus tetrazona.', 'Long-finned slow tankmates', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Albino Tiger Barb', 'Puntigrus tetrazona', 'variety', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Selectively bred; base species from Southeast Asia', 5, 7, 'semi_aggressive', 'omnivore', 'beginner', 22, 28, 6.0, 8.0, 75, 'Middle', true, 'Albino variety of Tiger Barb.', 'Parameters inherited from base species Puntigrus tetrazona.', 'Long-finned slow tankmates', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Cherry Barb', 'Puntius titteya', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Sri Lanka', 4, 5, 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Middle', true, 'Peaceful red barb suitable for planted community tanks.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Rosy Barb', 'Pethia conchonius', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'South Asia', 8, 14, 'peaceful', 'omnivore', 'beginner', 18, 26, 6.0, 8.0, 110, 'Middle', true, 'Hardy active barb with rosy colour in males.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Golden Barb', 'Pethia semifasciolata', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'East Asia', 6, 8, 'peaceful', 'omnivore', 'beginner', 18, 26, 6.0, 8.0, 75, 'Middle', true, 'Gold form commonly traded as an active community barb.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Odessa Barb', 'Pethia padamya', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Myanmar', 6, 8, 'peaceful', 'omnivore', 'beginner', 20, 26, 6.0, 7.5, 75, 'Middle', true, 'Colourful active barb with red lateral colour in males.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Checker Barb', 'Oliotius oligolepis', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 4, 5, 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Middle', true, 'Small peaceful barb with checker-like scale pattern.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Denison Barb', 'Sahyadria denisonii', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'India', 12, 15, 'peaceful', 'omnivore', 'intermediate', 20, 26, 6.5, 7.8, 200, 'Middle', true, 'Active shoaling barb requiring clean, well-oxygenated water.', 'Needs swimming space and high oxygen levels.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Tinfoil Barb', 'Barbonymus schwanenfeldii', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia including Malaysia', 25, 35, 'peaceful', 'omnivore', 'intermediate', 22, 28, 6.0, 8.0, 300, 'Middle', true, 'Large schooling barb often sold small but grows very large.', 'Requires a very large aquarium or pond as an adult.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Red-tail Tinfoil Barb', 'Barbonymus schwanenfeldii', 'variety', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Selectively bred; base species from Southeast Asia including Malaysia', 25, 35, 'peaceful', 'omnivore', 'intermediate', 22, 28, 6.0, 8.0, 300, 'Middle', true, 'Red-tail ornamental variety of Tinfoil Barb.', 'Parameters inherited from base species Barbonymus schwanenfeldii.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Bala Shark', 'Balantiocheilos melanopterus', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 25, 35, 'peaceful', 'omnivore', 'intermediate', 22, 28, 6.0, 8.0, 300, 'Middle', true, 'Large active schooling cyprinid commonly sold as Bala Shark.', 'Requires a very large tank and should be kept in a group.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Rainbow Shark', 'Epalzeorhynchos frenatum', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 12, 15, 'semi_aggressive', 'omnivore', 'beginner', 22, 28, 6.0, 8.0, 110, 'Bottom to middle', false, 'Territorial bottom-oriented cyprinid with red fins.', NULL, 'Similar-shaped bottom fish in small tanks', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Red Tail Black Shark', 'Epalzeorhynchos bicolor', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Thailand', 12, 15, 'semi_aggressive', 'omnivore', 'intermediate', 22, 28, 6.0, 8.0, 110, 'Bottom to middle', false, 'Territorial black cyprinid with red tail.', 'Keep only one per tank unless the aquarium is very large.', 'Own kind and similar-shaped bottom fish', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Flying Fox', 'Epalzeorhynchos kalopterus', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 12, 15, 'semi_aggressive', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 110, 'Bottom to middle', false, 'Southeast Asian algae-grazing cyprinid.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Siamese Algae Eater', 'Crossocheilus oblongus', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 12, 15, 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 110, 'Bottom to middle', true, 'Active algae-grazing cyprinid widely used in planted aquariums.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Chinese Algae Eater', 'Gyrinocheilus aymonieri', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Gyrinocheilidae', 'freshwater', 'Southeast Asia', 20, 28, 'semi_aggressive', 'omnivore', 'intermediate', 22, 28, 6.0, 8.0, 200, 'Bottom', false, 'Algae eater that can become aggressive with age.', 'Adults may harass tankmates and attach to broad-bodied fish.', 'Slow broad-bodied fish', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Spanner Barb', 'Puntius lateristriga', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia including Malaysia', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 200, 'Middle', true, 'Large Southeast Asian river barb with limited aquarium detail in this seed.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Lampam', 'Barbonymus gonionotus', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Southeast Asia including Malaysia', 20, 30, 'peaceful', 'omnivore', 'beginner', NULL, NULL, NULL, NULL, 300, 'Middle', true, 'Silver Barb; common food and pond fish in Malaysia.', 'Best suited to ponds or very large aquariums.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Tengas', 'Cyclocheilichthys apogon', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Malaysian rivers and wider Southeast Asia', NULL, NULL, 'peaceful', 'omnivore', 'advanced', NULL, NULL, NULL, NULL, NULL, 'Middle', true, 'Local Malaysian river fish with limited aquarium husbandry data.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'low', '2025-01-01', 'rare'),
  ('Kelah / Malaysian Mahseer', 'Tor tambroides', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Malaysian rivers and wider Southeast Asia', 50, 70, 'semi_aggressive', 'omnivore', 'advanced', NULL, NULL, NULL, NULL, 500, 'Middle', true, 'Large Malaysian river mahseer with limited home aquarium suitability.', 'Large river fish requiring specialist large-system care.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Sebarau / Hampala Barb', 'Hampala macrolepidota', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Malaysian rivers and wider Southeast Asia', 40, 60, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 400, 'Middle', false, 'Local Malaysian predatory barb also known as Sebarau.', 'Predatory river fish requiring a very large aquarium.', 'Any fish small enough to be eaten', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Silver Sharkminnow', 'Luciosoma bleekeri', 'species', (SELECT id FROM fish_categories WHERE slug = 'barb'), 'Cyprinidae', 'freshwater', 'Malaysian and Southeast Asian rivers', NULL, NULL, 'peaceful', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 300, 'Middle', true, 'Elongated active schooling cyprinid from Malaysian rivers, distinct from Bala Shark.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, origin, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, avoid_with_notes, image_url, thumbnail_url, image_license,
  image_source_url, verification_status, confidence_level, last_reviewed_at, local_availability
)
WHERE NOT EXISTS (
  SELECT 1 FROM fish_species existing
  WHERE existing.common_name = v.common_name
    AND existing.entry_type = v.entry_type
);

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase', 'https://www.fishbase.se/summary/' || replace(fs.scientific_name, ' ', '-') || '.html',
'scientific_database', ARRAY['scientific_name','water_type','origin','adult_size_min_cm','adult_size_max_cm'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN (
  'Tiger Barb','Green Tiger Barb','Albino Tiger Barb','Cherry Barb','Rosy Barb','Golden Barb','Odessa Barb',
  'Checker Barb','Denison Barb','Tinfoil Barb','Red-tail Tinfoil Barb','Bala Shark','Rainbow Shark',
  'Red Tail Black Shark','Flying Fox','Siamese Algae Eater','Chinese Algae Eater','Spanner Barb','Lampam',
  'Tengas','Kelah / Malaysian Mahseer','Sebarau / Hampala Barb','Silver Sharkminnow'
)
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/' || lower(replace(fs.scientific_name, ' ', '-')) || '/',
'care_guide', ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.entry_type = 'species'
  AND fs.common_name IN (
    'Tiger Barb','Cherry Barb','Rosy Barb','Golden Barb','Odessa Barb','Checker Barb','Denison Barb','Tinfoil Barb',
    'Bala Shark','Rainbow Shark','Red Tail Black Shark','Flying Fox','Siamese Algae Eater','Chinese Algae Eater'
  )
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
