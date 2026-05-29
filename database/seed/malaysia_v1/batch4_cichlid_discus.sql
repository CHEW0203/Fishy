BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters, tank_level, schooling_behavior, description, care_notes, image_url, thumbnail_url,
  image_license, image_source_url, verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type,
  v.adult_size_min_cm, v.adult_size_max_cm, v.temperament::temperament, v.diet::diet_type, v.care_level::care_level,
  v.temperature_min_c, v.temperature_max_c, v.ph_min, v.ph_max, v.hardness_min_dgh, v.hardness_max_dgh,
  v.minimum_tank_size_liters, v.tank_level, v.schooling_behavior, v.description, v.care_notes, v.image_url,
  v.thumbnail_url, v.image_license, v.image_source_url, v.verification_status::verification_status,
  v.confidence_level::confidence_level, v.last_reviewed_at::timestamptz, v.local_availability
FROM (VALUES
  ('Angelfish', 'Pterophyllum scalare', 'species', (SELECT id FROM fish_categories WHERE slug = 'angelfish'), 'Cichlidae', 'freshwater', 10, 15, 'semi_aggressive', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 110, 'Middle', false, 'Tall-bodied South American cichlid widely kept in aquariums.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Altum Angelfish', 'Pterophyllum altum', 'species', (SELECT id FROM fish_categories WHERE slug = 'angelfish'), 'Cichlidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'omnivore', 'advanced', 26, 30, 4.5, 6.5, 1, 5, 200, 'Middle', false, 'Demanding wild-type angelfish requiring a tall tank and soft acidic water.', 'More demanding than common angelfish; requires very soft acidic water.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Discus', 'Symphysodon aequifasciatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'discus'), 'Cichlidae', 'freshwater', 12, 20, 'peaceful', 'omnivore', 'advanced', 28, 30, 5.0, 7.0, 1, 8, 200, 'Middle', false, 'South American cichlid requiring warm clean soft acidic water.', 'Requires very high water quality and frequent partial water changes.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Blue Diamond Discus', 'Symphysodon aequifasciatus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'discus'), 'Cichlidae', 'freshwater', 12, 20, 'peaceful', 'omnivore', 'advanced', 28, 30, 5.0, 7.0, 1, 8, 200, 'Middle', false, 'Blue domestic variety of Discus.', 'Parameters inherited from base species Symphysodon aequifasciatus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Pigeon Blood Discus', 'Symphysodon aequifasciatus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'discus'), 'Cichlidae', 'freshwater', 12, 20, 'peaceful', 'omnivore', 'advanced', 28, 30, 5.0, 7.0, 1, 8, 200, 'Middle', false, 'Domestic pigeon blood discus variety.', 'Parameters inherited from base species Symphysodon aequifasciatus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Red Melon Discus', 'Symphysodon aequifasciatus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'discus'), 'Cichlidae', 'freshwater', 12, 20, 'peaceful', 'omnivore', 'advanced', 28, 30, 5.0, 7.0, 1, 8, 200, 'Middle', false, 'Domestic red discus variety.', 'Parameters inherited from base species Symphysodon aequifasciatus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('German Blue Ram', 'Mikrogeophagus ramirezi', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 5, 7, 'peaceful', 'omnivore', 'intermediate', 26, 30, 5.0, 7.0, NULL, NULL, 60, 'Bottom to middle', false, 'Small colourful dwarf cichlid requiring warm stable water.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Bolivian Ram', 'Mikrogeophagus altispinosus', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 7, 9, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 75, 'Bottom to middle', false, 'Hardier ram cichlid from Bolivia and Brazil.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Apistogramma cacatuoides', 'Apistogramma cacatuoides', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 5, 8, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 5.5, 7.5, NULL, NULL, 60, 'Bottom', false, 'Dwarf South American cichlid with showy male fins.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Apistogramma agassizii', 'Apistogramma agassizii', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 5, 8, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 5.0, 7.0, NULL, NULL, 60, 'Bottom', false, 'Dwarf cichlid complex with many colour forms.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Apistogramma borellii', 'Apistogramma borellii', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, NULL, NULL, 60, 'Bottom', false, 'Less common dwarf cichlid with limited local trade availability.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Kribensis', 'Pelvicachromis pulcher', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 8, 10, 'semi_aggressive', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, NULL, NULL, 75, 'Bottom to middle', false, 'Hardy West African dwarf cichlid that breeds readily.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Oscar', 'Astronotus ocellatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 25, 35, 'aggressive', 'carnivore', 'intermediate', 24, 28, 6.0, 7.5, NULL, NULL, 300, 'Middle', false, 'Large intelligent South American cichlid.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Albino Oscar', 'Astronotus ocellatus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 25, 35, 'aggressive', 'carnivore', 'intermediate', 24, 28, 6.0, 7.5, NULL, NULL, 300, 'Middle', false, 'Albino variety of Oscar.', 'Parameters inherited from base species Astronotus ocellatus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Tiger Oscar', 'Astronotus ocellatus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 25, 35, 'aggressive', 'carnivore', 'intermediate', 24, 28, 6.0, 7.5, NULL, NULL, 300, 'Middle', false, 'Tiger-pattern variety of Oscar.', 'Parameters inherited from base species Astronotus ocellatus.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Flowerhorn', NULL, 'hybrid', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 25, 35, 'aggressive', 'omnivore', 'intermediate', 26, 30, 6.5, 8.0, NULL, NULL, 300, 'Middle', false, 'Hybrid cichlid bred in Malaysia and Southeast Asia; exact origins are debated.', 'Aggressive; usually kept singly.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Blood Parrot Cichlid', NULL, 'hybrid', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 15, 25, 'semi_aggressive', 'omnivore', 'intermediate', 24, 28, 6.5, 8.0, NULL, NULL, 200, 'Middle', false, 'Hybrid cichlid with no formal scientific name.', 'Deformed mouth can make eating harder; provide soft or small foods.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Severum', 'Heros efasciatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 15, 25, 'semi_aggressive', 'omnivore', 'intermediate', 24, 28, 6.0, 7.5, NULL, NULL, 200, 'Middle', false, 'Large South American cichlid with comparatively mild temperament.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Green Terror', 'Andinoacara rivulatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 20, 30, 'aggressive', 'carnivore', 'intermediate', 22, 28, 6.5, 8.0, NULL, NULL, 250, 'Middle', false, 'Aggressive New World cichlid requiring robust tankmates.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Jack Dempsey', 'Rocio octofasciata', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 20, 25, 'aggressive', 'carnivore', 'intermediate', 22, 28, 6.5, 8.0, NULL, NULL, 250, 'Middle', false, 'Robust territorial Central American cichlid.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Electric Blue Jack Dempsey', 'Rocio octofasciata', 'variety', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 20, 25, 'aggressive', 'carnivore', 'intermediate', 22, 28, 6.5, 8.0, NULL, NULL, 250, 'Middle', false, 'Electric blue variety of Jack Dempsey.', 'Parameters inherited from base species Rocio octofasciata.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Firemouth Cichlid', 'Thorichthys meeki', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 12, 15, 'semi_aggressive', 'omnivore', 'beginner', 22, 28, 6.5, 8.0, NULL, NULL, 110, 'Middle', false, 'Central American cichlid with red throat display.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Convict Cichlid', 'Amatitlania nigrofasciata', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 10, 15, 'aggressive', 'omnivore', 'beginner', 22, 28, 6.5, 8.0, NULL, NULL, 110, 'Middle', false, 'Hardy striped Central American cichlid that breeds readily.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Texas Cichlid', 'Herichthys cyanoguttatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 25, 30, 'aggressive', 'omnivore', 'intermediate', 22, 28, 7.0, 8.0, NULL, NULL, 300, 'Middle', false, 'Large territorial North American cichlid.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Jewel Cichlid', 'Hemichromis bimaculatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 10, 15, 'aggressive', 'carnivore', 'intermediate', 24, 28, 6.5, 7.5, NULL, NULL, 110, 'Middle', false, 'Colourful African cichlid with aggressive breeding behaviour.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Frontosa', 'Cyphotilapia frontosa', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 25, 35, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 7.8, 9.0, 10, 20, 400, 'Middle', false, 'Large Lake Tanganyika cichlid requiring hard alkaline water.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Yellow Lab Cichlid', 'Labidochromis caeruleus', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 8, 12, 'semi_aggressive', 'omnivore', 'beginner', 24, 28, 7.8, 8.6, 10, 20, 200, 'Middle', false, 'Lake Malawi mbuna requiring hard alkaline water.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Electric Blue Hap', 'Sciaenochromis fryeri', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 15, 20, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 7.8, 8.6, 10, 20, 250, 'Middle', false, 'Blue Lake Malawi haplochromine cichlid requiring hard alkaline water.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Red Zebra Cichlid', 'Maylandia estherae', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 10, 15, 'semi_aggressive', 'omnivore', 'intermediate', 24, 28, 7.8, 8.6, 10, 20, 200, 'Middle', false, 'Lake Malawi mbuna requiring hard alkaline water.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Demasoni Cichlid', 'Chindongo demasoni', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', 7, 9, 'aggressive', 'herbivore', 'intermediate', 24, 28, 7.8, 8.6, 10, 20, 200, 'Middle', false, 'Small aggressive Lake Malawi mbuna requiring hard alkaline water.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Peacock Cichlid', 'Aulonocara sp.', 'species', (SELECT id FROM fish_categories WHERE slug = 'cichlid'), 'Cichlidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 7.8, 8.6, 10, 20, 250, 'Middle', false, 'Trade name covering several Aulonocara species from Lake Malawi.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, hardness_min_dgh, hardness_max_dgh,
  minimum_tank_size_liters, tank_level, schooling_behavior, description, care_notes, image_url, thumbnail_url,
  image_license, image_source_url, verification_status, confidence_level, last_reviewed_at, local_availability
)
WHERE NOT EXISTS (
  SELECT 1 FROM fish_species existing
  WHERE existing.common_name = v.common_name
    AND existing.entry_type = v.entry_type
);

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase',
CASE WHEN fs.scientific_name IS NULL OR fs.scientific_name LIKE '%sp.%' THEN NULL ELSE 'https://www.fishbase.se/summary/' || replace(fs.scientific_name, ' ', '-') || '.html' END,
'scientific_database', ARRAY['scientific_name','water_type','adult_size_min_cm','adult_size_max_cm'],
CASE WHEN fs.entry_type IN ('variety','hybrid') THEN 'Parameters inherited from base species where applicable; hybrids have no formal scientific name.' ELSE NULL END,
'2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN (
  'Angelfish','Altum Angelfish','Discus','Blue Diamond Discus','Pigeon Blood Discus','Red Melon Discus',
  'German Blue Ram','Bolivian Ram','Apistogramma cacatuoides','Apistogramma agassizii','Apistogramma borellii',
  'Kribensis','Oscar','Albino Oscar','Tiger Oscar','Severum','Green Terror','Jack Dempsey',
  'Electric Blue Jack Dempsey','Firemouth Cichlid','Convict Cichlid','Texas Cichlid','Jewel Cichlid',
  'Frontosa','Yellow Lab Cichlid','Electric Blue Hap','Red Zebra Cichlid','Demasoni Cichlid','Peacock Cichlid'
)
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT id, 'General aquarium trade knowledge', NULL, 'other',
ARRAY['common_name','entry_type','description','care_notes'],
'Hybrid cichlid with no formal scientific name. Data from general trade knowledge.', '2025-01-01'
FROM fish_species
WHERE common_name IN ('Flowerhorn','Blood Parrot Cichlid') AND entry_type = 'hybrid'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/' || lower(replace(fs.scientific_name, ' ', '-')) || '/',
'care_guide', ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.entry_type = 'species'
  AND fs.common_name IN (
    'Angelfish','Discus','German Blue Ram','Bolivian Ram','Apistogramma cacatuoides','Apistogramma agassizii',
    'Kribensis','Oscar','Firemouth Cichlid','Convict Cichlid','Frontosa'
  )
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
