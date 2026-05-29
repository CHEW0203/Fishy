BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, temperament, diet, care_level,
  temperature_min_c, temperature_max_c, ph_min, ph_max, hardness_min_dgh, hardness_max_dgh, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, image_url, thumbnail_url, image_license, image_source_url,
  verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type,
  v.temperament::temperament, v.diet::diet_type, v.care_level::care_level, v.temperature_min_c, v.temperature_max_c,
  v.ph_min, v.ph_max, v.hardness_min_dgh, v.hardness_max_dgh, v.minimum_tank_size_liters, v.tank_level,
  v.schooling_behavior, v.description, v.care_notes, v.image_url, v.thumbnail_url, v.image_license, v.image_source_url,
  v.verification_status::verification_status, v.confidence_level::confidence_level, v.last_reviewed_at::timestamptz,
  v.local_availability
FROM (VALUES
  ('Ocellaris Clownfish', 'Amphiprion ocellaris', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacentridae', 'marine', 'peaceful', 'omnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Hardy clownfish widely available as captive-bred stock.', 'Marine fish require stable salinity around 1.020-1.025 SG.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Percula Clownfish', 'Amphiprion percula', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacentridae', 'marine', 'peaceful', 'omnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Classic clownfish species for marine aquariums.', 'Marine fish require stable salinity around 1.020-1.025 SG.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Tomato Clownfish', 'Amphiprion frenatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacentridae', 'marine', 'peaceful', 'omnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Robust red clownfish species.', 'Marine fish require stable salinity around 1.020-1.025 SG.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Maroon Clownfish', 'Premnas biaculeatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacentridae', 'marine', 'semi_aggressive', 'omnivore', 'intermediate', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Large aggressive clownfish species.', 'Most aggressive clownfish; females are dominant and large; must be introduced carefully with other clownfish.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Clarkii Clownfish', 'Amphiprion clarkii', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacentridae', 'marine', 'peaceful', 'omnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Hardy clownfish species.', 'Marine fish require stable salinity around 1.020-1.025 SG.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Blue Green Chromis', 'Chromis viridis', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacentridae', 'marine', 'peaceful', 'omnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 110, 'Middle to top', true, 'Green-blue schooling damselfish for marine aquariums.', 'Marine fish require stable salinity around 1.020-1.025 SG.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Blue Devil Damselfish', 'Chrysiptera cyanea', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacentridae', 'marine', 'semi_aggressive', 'omnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Hardy blue damselfish with territorial behaviour.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Yellowtail Damselfish', 'Chrysiptera parasema', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacentridae', 'marine', 'semi_aggressive', 'omnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Hardy blue and yellow damselfish.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Banggai Cardinalfish', 'Pterapogon kauderni', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Apogonidae', 'marine', 'peaceful', 'carnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', true, 'Distinctive cardinalfish from the Banggai Islands.', 'CITES Appendix II. Prefer captive-bred specimens which are widely available and help reduce pressure on wild populations from the Banggai Islands, Indonesia.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Pajama Cardinalfish', 'Sphaeramia nematoptera', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Apogonidae', 'marine', 'peaceful', 'carnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Peaceful patterned cardinalfish.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Yellow Tang', 'Zebrasoma flavescens', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Acanthuridae', 'marine', 'peaceful', 'herbivore', 'intermediate', 23, 28, 8.1, 8.4, NULL, NULL, 200, 'Middle', false, 'Yellow surgeonfish requiring swimming space and algae-based diet.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Blue Tang', 'Paracanthurus hepatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Acanthuridae', 'marine', 'peaceful', 'herbivore', 'intermediate', 23, 28, 8.1, 8.4, NULL, NULL, 200, 'Middle', false, 'Blue surgeonfish requiring swimming space and stable marine water.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Royal Gramma', 'Gramma loreto', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Grammatidae', 'marine', 'peaceful', 'carnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Small purple and yellow reef fish.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Firefish Goby', 'Nemateleotris magnifica', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Microdesmidae', 'marine', 'peaceful', 'carnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Middle', false, 'Peaceful dartfish that may jump.', 'Secure lid recommended.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Mandarin Dragonet', 'Synchiropus splendidus', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Callionymidae', 'marine', 'peaceful', 'carnivore', 'advanced', 23, 28, 8.1, 8.4, NULL, NULL, 200, 'Bottom', false, 'Specialist reef fish with demanding feeding needs.', 'Requires a mature reef aquarium (6+ months) with an established population of live copepods. Does not typically accept prepared foods. Very difficult to keep long-term; high mortality in captivity without specialist care.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Cleaner Wrasse', 'Labroides dimidiatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Labridae', 'marine', 'peaceful', 'carnivore', 'intermediate', 23, 28, 8.1, 8.4, NULL, NULL, 110, 'Middle', false, 'Cleaner wrasse with specialized feeding behaviour.', 'Removes parasites from other fish. Diet is specialized (ectoparasites, mucus); very difficult to sustain in captivity long-term on prepared foods. Many die within months. Only suitable for experienced reefkeepers with established parasite load.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Six Line Wrasse', 'Pseudocheilinus hexataenia', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Labridae', 'marine', 'semi_aggressive', 'carnivore', 'intermediate', 23, 28, 8.1, 8.4, NULL, NULL, 110, 'Middle', false, 'Small active wrasse that may become aggressive to smaller fish or invertebrates.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Flame Angelfish', 'Centropyge loriculus', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacanthidae', 'marine', 'semi_aggressive', 'omnivore', 'intermediate', 23, 28, 8.1, 8.4, NULL, NULL, 110, 'Middle', false, 'Small marine angelfish with bright red-orange body.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Coral Beauty Angelfish', 'Centropyge bispinosa', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Pomacanthidae', 'marine', 'semi_aggressive', 'omnivore', 'intermediate', 23, 28, 8.1, 8.4, NULL, NULL, 110, 'Middle', false, 'Small marine angelfish common in reef aquariums.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Yellow Watchman Goby', 'Cryptocentrus cinctus', 'species', (SELECT id FROM fish_categories WHERE slug = 'marine-fish'), 'Gobiidae', 'marine', 'peaceful', 'carnivore', 'beginner', 23, 28, 8.1, 8.4, NULL, NULL, 75, 'Bottom', false, 'Bottom-dwelling goby often kept with pistol shrimp.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, temperament, diet, care_level,
  temperature_min_c, temperature_max_c, ph_min, ph_max, hardness_min_dgh, hardness_max_dgh, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, image_url, thumbnail_url, image_license, image_source_url,
  verification_status, confidence_level, last_reviewed_at, local_availability
)
WHERE NOT EXISTS (
  SELECT 1 FROM fish_species existing
  WHERE existing.common_name = v.common_name
    AND existing.entry_type = v.entry_type
);

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase', 'https://www.fishbase.se/summary/' || replace(fs.scientific_name, ' ', '-') || '.html',
'scientific_database', ARRAY['scientific_name','water_type','adult_size_min_cm','adult_size_max_cm'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN (
  'Ocellaris Clownfish','Percula Clownfish','Tomato Clownfish','Maroon Clownfish','Clarkii Clownfish',
  'Blue Green Chromis','Blue Devil Damselfish','Yellowtail Damselfish','Banggai Cardinalfish','Pajama Cardinalfish',
  'Yellow Tang','Blue Tang','Royal Gramma','Firefish Goby','Mandarin Dragonet','Cleaner Wrasse','Six Line Wrasse',
  'Flame Angelfish','Coral Beauty Angelfish','Yellow Watchman Goby'
)
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
