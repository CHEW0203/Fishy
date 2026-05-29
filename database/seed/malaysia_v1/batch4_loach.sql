BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, image_url, thumbnail_url, image_license, image_source_url,
  verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type,
  v.adult_size_min_cm, v.adult_size_max_cm, v.temperament::temperament, v.diet::diet_type, v.care_level::care_level,
  v.temperature_min_c, v.temperature_max_c, v.ph_min, v.ph_max, v.minimum_tank_size_liters, v.tank_level,
  v.schooling_behavior, v.description, v.care_notes, v.image_url, v.thumbnail_url, v.image_license, v.image_source_url,
  v.verification_status::verification_status, v.confidence_level::confidence_level, v.last_reviewed_at::timestamptz,
  v.local_availability
FROM (VALUES
  ('Clown Loach', 'Chromobotia macracanthus', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Botiidae', 'freshwater', 20, 30, 'peaceful', 'omnivore', 'intermediate', 24, 30, 6.0, 7.5, 300, 'Bottom', true, 'Large social loach from Southeast Asia.', 'Juveniles are frequently sold but grow large, requiring a very large tank long-term.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Kuhli Loach', 'Pangio kuhlii', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Botiidae', 'freshwater', 8, 12, 'peaceful', 'omnivore', 'beginner', 24, 28, 5.5, 7.0, 40, 'Bottom', true, 'Slender nocturnal loach that appreciates hiding places and groups.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Black Kuhli Loach', 'Pangio oblonga', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Botiidae', 'freshwater', 8, 10, 'peaceful', 'omnivore', 'beginner', 24, 28, 5.5, 7.0, 40, 'Bottom', true, 'Dark Pangio loach often sold alongside Kuhli Loach.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Zebra Loach', 'Botia striata', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Botiidae', 'freshwater', 7, 10, 'peaceful', 'omnivore', 'beginner', 23, 28, 6.0, 7.5, 75, 'Bottom', true, 'Striped social loach for community aquariums.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Yoyo Loach', 'Botia almorhae', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Botiidae', 'freshwater', 10, 16, 'semi_aggressive', 'omnivore', 'beginner', 23, 28, 6.0, 7.5, 110, 'Bottom', true, 'Active social loach with reticulated juvenile patterning.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Dwarf Chain Loach', 'Ambastaia sidthimunki', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Botiidae', 'freshwater', 5, 6, 'peaceful', 'omnivore', 'intermediate', 24, 28, 6.0, 7.5, 75, 'Bottom', true, 'Small social loach formerly known as Botia sidthimunki.', 'IUCN Endangered in the wild; captive-bred specimens are widely available in trade.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Skunk Loach', 'Yasuhikotakia morleti', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Botiidae', 'freshwater', 8, 10, 'semi_aggressive', 'omnivore', 'intermediate', 24, 28, 6.0, 7.5, 110, 'Bottom', false, 'Assertive loach with a dark dorsal stripe.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Hillstream Loach', 'Beaufortia leveretti', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Gastromyzontidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', 20, 24, 6.5, 7.5, 75, 'Bottom', false, 'Representative hillstream loach for broad trade-name use.', 'Requires strong current, high oxygen, and mature surfaces for grazing.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Reticulated Hillstream Loach', 'Sewellia lineolata', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Gastromyzontidae', 'freshwater', 5, 7, 'peaceful', 'omnivore', 'intermediate', 20, 24, 6.5, 7.5, 75, 'Bottom', false, 'Reticulated hillstream species requiring flowing water.', 'Requires strong current, high oxygen, and mature surfaces for grazing.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Horseface Loach', 'Acantopsis dialuzona', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Cobitidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 110, 'Bottom', false, 'Sand-burrowing loach with elongated snout.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Weather Loach', 'Misgurnus anguillicaudatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'loach'), 'Cobitidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 110, 'Bottom', false, 'Temperate loach with lower temperature tolerance than tropical loaches.', 'May be invasive if released outside its native or permitted range.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, image_url, thumbnail_url, image_license, image_source_url,
  verification_status, confidence_level, last_reviewed_at, local_availability
)
WHERE NOT EXISTS (
  SELECT 1 FROM fish_species existing
  WHERE existing.common_name = v.common_name
    AND existing.entry_type = v.entry_type
);

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase', s.url, 'scientific_database',
ARRAY['scientific_name','water_type','adult_size_min_cm','adult_size_max_cm'], NULL, '2025-01-01'
FROM fish_species fs
JOIN (VALUES
  ('Clown Loach', 'https://www.fishbase.se/summary/Chromobotia-macracanthus.html'),
  ('Kuhli Loach', 'https://www.fishbase.se/summary/Pangio-kuhlii.html'),
  ('Black Kuhli Loach', 'https://www.fishbase.se/summary/Pangio-oblonga.html'),
  ('Zebra Loach', 'https://www.fishbase.se/summary/Botia-striata.html'),
  ('Yoyo Loach', 'https://www.fishbase.se/summary/Botia-almorhae.html'),
  ('Dwarf Chain Loach', 'https://www.fishbase.se/summary/Ambastaia-sidthimunki.html'),
  ('Skunk Loach', 'https://www.fishbase.se/summary/Yasuhikotakia-morleti.html'),
  ('Hillstream Loach', 'https://www.fishbase.se/summary/Beaufortia-leveretti.html'),
  ('Reticulated Hillstream Loach', 'https://www.fishbase.se/summary/Sewellia-lineolata.html'),
  ('Horseface Loach', 'https://www.fishbase.se/summary/Acantopsis-dialuzona.html'),
  ('Weather Loach', 'https://www.fishbase.se/summary/Misgurnus-anguillicaudatus.html')
) AS s(common_name, url)
  ON fs.common_name = s.common_name AND fs.entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'Seriously Fish', s.url, 'care_guide',
ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species fs
JOIN (VALUES
  ('Clown Loach', 'https://www.seriouslyfish.com/species/chromobotia-macracanthus/'),
  ('Kuhli Loach', 'https://www.seriouslyfish.com/species/pangio-kuhlii/'),
  ('Dwarf Chain Loach', 'https://www.seriouslyfish.com/species/ambastaia-sidthimunki/'),
  ('Yoyo Loach', 'https://www.seriouslyfish.com/species/botia-almorhae/'),
  ('Reticulated Hillstream Loach', 'https://www.seriouslyfish.com/species/sewellia-lineolata/')
) AS s(common_name, url)
  ON fs.common_name = s.common_name AND fs.entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
