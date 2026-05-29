BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, avoid_with_notes, image_url, thumbnail_url, image_license,
  image_source_url, verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type,
  v.adult_size_min_cm, v.adult_size_max_cm, v.temperament::temperament, v.diet::diet_type, v.care_level::care_level,
  v.temperature_min_c, v.temperature_max_c, v.ph_min, v.ph_max, v.minimum_tank_size_liters, v.tank_level,
  v.schooling_behavior, v.description, v.care_notes, v.avoid_with_notes, v.image_url, v.thumbnail_url, v.image_license,
  v.image_source_url, v.verification_status::verification_status, v.confidence_level::confidence_level,
  v.last_reviewed_at::timestamptz, v.local_availability
FROM (VALUES
  ('Giant Snakehead / Toman', 'Channa micropeltes', 'species', (SELECT id FROM fish_categories WHERE slug = 'snakehead'), 'Channidae', 'freshwater', 100, 130, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 1000, 'Middle to top', false, 'Giant Malaysian snakehead; apex predator and common food fish.', 'Requires very large tank; adult fish extremely powerful and aggressive; not suitable for typical home aquariums. Juveniles often sold but grow very large. Check local regulations before keeping; some jurisdictions regulate keeping of large snakehead species.', 'Any fish that can fit in its mouth', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Striped Snakehead / Haruan', 'Channa striata', 'species', (SELECT id FROM fish_categories WHERE slug = 'snakehead'), 'Channidae', 'freshwater', NULL, NULL, 'aggressive', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 400, 'Middle to top', false, 'Important food fish in Malaysia; adults are aggressive predators.', 'Ornamental value mainly as juveniles.', 'Any fish that can fit in its mouth', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Forest Snakehead', 'Channa lucius', 'species', (SELECT id FROM fish_categories WHERE slug = 'snakehead'), 'Channidae', 'freshwater', NULL, NULL, 'aggressive', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 300, 'Middle to top', false, 'Southeast Asian forest snakehead with limited ornamental husbandry detail.', NULL, 'Any fish that can fit in its mouth', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Dwarf Snakehead', 'Channa gachua', 'species', (SELECT id FROM fish_categories WHERE slug = 'snakehead'), 'Channidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 110, 'Middle to top', false, 'Smaller snakehead complex kept by specialist aquarists.', NULL, 'Small fish', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Bleheri Snakehead', 'Channa bleheri', 'species', (SELECT id FROM fish_categories WHERE slug = 'snakehead'), 'Channidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 110, 'Middle to top', false, 'Ornamental snakehead from India; import only in Malaysia.', NULL, 'Small fish', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Barca Snakehead', 'Channa barca', 'species', (SELECT id FROM fish_categories WHERE slug = 'snakehead'), 'Channidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 300, 'Middle to top', false, 'Rare large ornamental snakehead with demanding specialist care.', NULL, 'Small fish', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Stewartii Snakehead', 'Channa stewartii', 'species', (SELECT id FROM fish_categories WHERE slug = 'snakehead'), 'Channidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 200, 'Middle to top', false, 'Northeast Indian snakehead; import only in Malaysia.', NULL, 'Small fish', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Aurantimaculata Snakehead', 'Channa aurantimaculata', 'species', (SELECT id FROM fish_categories WHERE slug = 'snakehead'), 'Channidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 200, 'Middle to top', false, 'Assam snakehead species for specialist keepers.', NULL, 'Small fish', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Climbing Perch / Puyu', 'Anabas testudineus', 'species', (SELECT id FROM fish_categories WHERE slug = 'gourami'), 'Anabantidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 110, 'Middle to top', false, 'Labyrinth fish native to Southeast Asia and common in Malaysia.', 'Has labyrinth organ allowing brief air breathing. Can jump out of tank; secure lid essential. Considered invasive in some regions outside its native range.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Freshwater Halfbeak', 'Dermogenys pusilla', 'species', (SELECT id FROM fish_categories WHERE slug = 'livebearer'), 'Zenarchopteridae', 'freshwater', NULL, NULL, 'peaceful', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 60, 'Middle to top', false, 'Livebearing surface-dwelling halfbeak from Southeast Asia.', 'Can be nippy to each other; best in species tank or with large peaceful fish.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Wrestling Halfbeak', 'Hemirhamphodon pogonognathus', 'species', (SELECT id FROM fish_categories WHERE slug = 'livebearer'), 'Zenarchopteridae', 'freshwater', NULL, NULL, 'peaceful', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 60, 'Middle to top', false, 'Peninsular Malaysia native halfbeak with limited aquarium care data.', 'Males are aggressive toward each other and display or wrestle; keep only one male per tank or in a species-only setup.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'low', '2025-01-01', 'moderate')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
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
SELECT fs.id, 'FishBase', s.url, 'scientific_database',
ARRAY['scientific_name','water_type','adult_size_min_cm','adult_size_max_cm'], NULL, '2025-01-01'
FROM fish_species fs
JOIN (VALUES
  ('Giant Snakehead / Toman', 'https://www.fishbase.se/summary/Channa-micropeltes.html'),
  ('Striped Snakehead / Haruan', 'https://www.fishbase.se/summary/Channa-striata.html'),
  ('Forest Snakehead', 'https://www.fishbase.se/summary/Channa-lucius.html'),
  ('Dwarf Snakehead', 'https://www.fishbase.se/summary/Channa-gachua.html'),
  ('Bleheri Snakehead', 'https://www.fishbase.se/summary/Channa-bleheri.html'),
  ('Barca Snakehead', 'https://www.fishbase.se/summary/Channa-barca.html'),
  ('Stewartii Snakehead', 'https://www.fishbase.se/summary/Channa-stewartii.html'),
  ('Aurantimaculata Snakehead', 'https://www.fishbase.se/summary/Channa-aurantimaculata.html'),
  ('Climbing Perch / Puyu', 'https://www.fishbase.se/summary/Anabas-testudineus.html'),
  ('Freshwater Halfbeak', 'https://www.fishbase.se/summary/Dermogenys-pusilla.html'),
  ('Wrestling Halfbeak', 'https://www.fishbase.se/summary/Hemirhamphodon-pogonognathus.html')
) AS s(common_name, url)
  ON fs.common_name = s.common_name AND fs.entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
