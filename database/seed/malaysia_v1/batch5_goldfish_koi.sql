BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years, temperament, diet, care_level, temperature_min_c, temperature_max_c,
  ph_min, ph_max, minimum_tank_size_liters, tank_level, schooling_behavior, description, care_notes,
  image_url, thumbnail_url, image_license, image_source_url, verification_status, confidence_level,
  last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type,
  v.adult_size_min_cm, v.adult_size_max_cm, v.lifespan_min_years, v.lifespan_max_years,
  v.temperament::temperament, v.diet::diet_type, v.care_level::care_level, v.temperature_min_c, v.temperature_max_c,
  v.ph_min, v.ph_max, v.minimum_tank_size_liters, v.tank_level, v.schooling_behavior, v.description, v.care_notes,
  v.image_url, v.thumbnail_url, v.image_license, v.image_source_url, v.verification_status::verification_status,
  v.confidence_level::confidence_level, v.last_reviewed_at::timestamptz, v.local_availability
FROM (VALUES
  ('Common Goldfish', 'Carassius auratus', 'species', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 20, 30, 10, 20, 'peaceful', 'omnivore', 'beginner', 10, 24, 6.5, 8.0, 200, 'Middle', false, 'Single-tailed goldfish that can grow large and tolerate cooler water.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Comet Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 20, 30, 10, 20, 'peaceful', 'omnivore', 'beginner', 10, 24, 6.5, 8.0, 200, 'Middle', false, 'Fast single-tailed goldfish variety with long tail.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Shubunkin Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 20, 30, 10, 20, 'peaceful', 'omnivore', 'beginner', 10, 24, 6.5, 8.0, 200, 'Middle', false, 'Calico single-tailed goldfish variety.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Fantail Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 12, 20, 8, 15, 'peaceful', 'omnivore', 'beginner', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Double-tailed fancy goldfish variety.', 'Do not keep with fast-moving single-tailed goldfish; fancy goldfish are slower and may not compete well for food.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Oranda Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 15, 25, 8, 15, 'peaceful', 'omnivore', 'intermediate', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Fancy goldfish with head growth called a wen.', 'Do not keep with fast-moving single-tailed goldfish; fancy goldfish are slower and may not compete well for food.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Ranchu Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 12, 20, 8, 15, 'peaceful', 'omnivore', 'intermediate', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Dorsal-less fancy goldfish with rounded body.', 'Do not keep with fast-moving single-tailed goldfish; fancy goldfish are slower and may not compete well for food.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Ryukin Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 12, 20, 8, 15, 'peaceful', 'omnivore', 'beginner', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Fancy goldfish with high back and double tail.', 'Do not keep with fast-moving single-tailed goldfish; fancy goldfish are slower and may not compete well for food.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Telescope Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 12, 20, 8, 15, 'peaceful', 'omnivore', 'intermediate', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Fancy goldfish with protruding eyes.', 'Avoid sharp decor; protruding eyes are vulnerable to injury.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Black Moor Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 12, 20, 8, 15, 'peaceful', 'omnivore', 'intermediate', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Black telescope-eye fancy goldfish variety.', 'Avoid sharp decor; protruding eyes are vulnerable to injury.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Pearlscale Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 12, 18, 8, 15, 'peaceful', 'omnivore', 'intermediate', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Fancy goldfish with rounded body and raised pearl-like scales.', 'Do not keep with fast-moving single-tailed goldfish; maintain excellent water quality.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Lionhead Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 12, 18, 8, 15, 'peaceful', 'omnivore', 'intermediate', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Dorsal-less fancy goldfish with head growth.', 'Do not keep with fast-moving single-tailed goldfish; maintain excellent water quality.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Bubble Eye Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 10, 15, 8, 15, 'peaceful', 'omnivore', 'advanced', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Delicate fancy goldfish with fluid-filled eye sacs.', 'Extremely delicate fluid-filled eye sacs can rupture; no sharp decor; no strong filtration currents.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Celestial Eye Goldfish', 'Carassius auratus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'goldfish'), 'Cyprinidae', 'freshwater', 10, 15, 8, 15, 'peaceful', 'omnivore', 'advanced', 18, 24, 6.5, 8.0, 110, 'Middle', false, 'Delicate fancy goldfish with upward-facing eyes.', 'Delicate eye structure; avoid sharp decor and strong competition for food.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Koi', 'Cyprinus rubrofuscus', 'species', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'Large pond fish that can live 20-35 years and grow very large.', 'Pond fish by nature; juveniles can be kept in very large aquariums temporarily.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Kohaku Koi', 'Cyprinus rubrofuscus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'White koi variety with red markings.', 'Parameters inherited from base species Cyprinus rubrofuscus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Sanke Koi', 'Cyprinus rubrofuscus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'White koi variety with red and black markings.', 'Parameters inherited from base species Cyprinus rubrofuscus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Showa Koi', 'Cyprinus rubrofuscus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'Black-based koi variety with red and white markings.', 'Parameters inherited from base species Cyprinus rubrofuscus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Ogon Koi', 'Cyprinus rubrofuscus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'Single-colour metallic koi variety.', 'Parameters inherited from base species Cyprinus rubrofuscus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Chagoi Koi', 'Cyprinus rubrofuscus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'Brown koi variety known in koi keeping as a large-growing type.', 'Parameters inherited from base species Cyprinus rubrofuscus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Shusui Koi', 'Cyprinus rubrofuscus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'Doitsu koi variety related to Asagi patterning.', 'Parameters inherited from base species Cyprinus rubrofuscus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Asagi Koi', 'Cyprinus rubrofuscus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'Blue-gray koi variety with red/orange lower body markings.', 'Parameters inherited from base species Cyprinus rubrofuscus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Utsuri Koi', 'Cyprinus rubrofuscus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'koi'), 'Cyprinidae', 'freshwater', 50, 90, 20, 35, 'peaceful', 'omnivore', 'intermediate', 10, 28, 7.0, 8.5, 1000, 'Middle', false, 'Black koi variety group with contrasting coloured markings.', 'Parameters inherited from base species Cyprinus rubrofuscus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  lifespan_min_years, lifespan_max_years, temperament, diet, care_level, temperature_min_c, temperature_max_c,
  ph_min, ph_max, minimum_tank_size_liters, tank_level, schooling_behavior, description, care_notes,
  image_url, thumbnail_url, image_license, image_source_url, verification_status, confidence_level,
  last_reviewed_at, local_availability
)
WHERE NOT EXISTS (
  SELECT 1 FROM fish_species existing
  WHERE existing.common_name = v.common_name
    AND existing.entry_type = v.entry_type
);

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase',
CASE WHEN fs.scientific_name = 'Carassius auratus' THEN 'https://www.fishbase.se/summary/Carassius-auratus.html' ELSE 'https://www.fishbase.se/summary/Cyprinus-rubrofuscus.html' END,
'scientific_database', ARRAY['scientific_name','water_type','adult_size_min_cm','adult_size_max_cm'],
CASE WHEN fs.scientific_name = 'Cyprinus rubrofuscus' THEN 'Formerly Cyprinus carpio in older literature; current accepted name is Cyprinus rubrofuscus per FishBase.' ELSE 'Water parameters inherited from base species Carassius auratus' END,
'2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN (
  'Common Goldfish','Comet Goldfish','Shubunkin Goldfish','Fantail Goldfish','Oranda Goldfish','Ranchu Goldfish',
  'Ryukin Goldfish','Telescope Goldfish','Black Moor Goldfish','Pearlscale Goldfish','Lionhead Goldfish',
  'Bubble Eye Goldfish','Celestial Eye Goldfish','Koi','Kohaku Koi','Sanke Koi','Showa Koi','Ogon Koi',
  'Chagoi Koi','Shusui Koi','Asagi Koi','Utsuri Koi'
)
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/carassius-auratus/', 'care_guide',
ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species WHERE common_name = 'Common Goldfish' AND entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/cyprinus-carpio/', 'care_guide',
ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], 'Care guide uses older Cyprinus carpio URL.', '2025-01-01'
FROM fish_species WHERE common_name = 'Koi' AND entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
