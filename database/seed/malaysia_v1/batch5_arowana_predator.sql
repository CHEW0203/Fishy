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
  ('Asian Arowana', 'Scleropages formosus', 'species', (SELECT id FROM fish_categories WHERE slug = 'arowana'), 'Osteoglossidae', 'freshwater', 60, 90, 'aggressive', 'carnivore', 'advanced', 24, 30, 6.0, 7.5, 1000, 'Top', false, 'CITES Appendix I listed. Only purchase from licensed, documented sources. Requires very large tank (minimum 400+ litres for juveniles, 1000+ litres for adults).', 'CITES Appendix I. International commercial trade is generally prohibited except from registered farms with CITES documentation. In Malaysia, licensed farms may trade microchipped individuals. Buyers must verify fish are legally sourced from licensed farms and have proper documentation.', 'Small fish (any fish under 15 cm will likely be eaten)', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Malaysian Golden Arowana', 'Scleropages formosus', 'morph', (SELECT id FROM fish_categories WHERE slug = 'arowana'), 'Osteoglossidae', 'freshwater', 60, 90, 'aggressive', 'carnivore', 'advanced', 24, 30, 6.0, 7.5, 1000, 'Top', false, 'CITES Appendix I listed morph of Asian Arowana. Only purchase from licensed, documented sources.', 'Morph of base species Scleropages formosus; CITES Appendix I. Verify legal farm documentation.', 'Small fish (any fish under 15 cm will likely be eaten)', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Red Arowana', 'Scleropages formosus', 'morph', (SELECT id FROM fish_categories WHERE slug = 'arowana'), 'Osteoglossidae', 'freshwater', 60, 90, 'aggressive', 'carnivore', 'advanced', 24, 30, 6.0, 7.5, 1000, 'Top', false, 'CITES Appendix I listed morph of Asian Arowana. Only purchase from licensed, documented sources.', 'Morph of base species Scleropages formosus; CITES Appendix I. Verify legal farm documentation.', 'Small fish (any fish under 15 cm will likely be eaten)', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Green Arowana', 'Scleropages formosus', 'morph', (SELECT id FROM fish_categories WHERE slug = 'arowana'), 'Osteoglossidae', 'freshwater', 60, 90, 'aggressive', 'carnivore', 'advanced', 24, 30, 6.0, 7.5, 1000, 'Top', false, 'CITES Appendix I listed morph of Asian Arowana. Only purchase from licensed, documented sources.', 'Morph of base species Scleropages formosus; CITES Appendix I. Verify legal farm documentation.', 'Small fish (any fish under 15 cm will likely be eaten)', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Silver Arowana', 'Osteoglossum bicirrhosum', 'species', (SELECT id FROM fish_categories WHERE slug = 'arowana'), 'Osteoglossidae', 'freshwater', 80, 110, 'aggressive', 'carnivore', 'advanced', 24, 30, 6.0, 7.5, 1000, 'Top', false, 'Large South American arowana that can exceed 100 cm.', 'CITES Appendix II. Trade regulated; documentation may be required depending on jurisdiction.', 'Small fish (any fish under 15 cm will likely be eaten)', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Black Arowana', 'Osteoglossum ferreirai', 'species', (SELECT id FROM fish_categories WHERE slug = 'arowana'), 'Osteoglossidae', 'freshwater', 70, 100, 'aggressive', 'carnivore', 'advanced', 24, 30, 6.0, 7.5, 1000, 'Top', false, 'Large South American arowana species.', 'CITES Appendix II. Trade regulated; documentation may be required depending on jurisdiction.', 'Small fish (any fish under 15 cm will likely be eaten)', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Jardini Arowana', 'Scleropages jardini', 'species', (SELECT id FROM fish_categories WHERE slug = 'arowana'), 'Osteoglossidae', 'freshwater', 60, 90, 'aggressive', 'carnivore', 'advanced', 24, 30, 6.5, 7.8, 1000, 'Top', false, 'Australian arowana; CITES Appendix I listed.', 'CITES Appendix I. International trade requires proper legal documentation.', 'Small fish (any fish under 15 cm will likely be eaten)', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Senegal Bichir', 'Polypterus senegalus', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Polypteridae', 'freshwater', 30, 35, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 6.0, 7.5, 200, 'Bottom', false, 'Hardy primitive fish that breathes air and eats small tankmates.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Ornate Bichir', 'Polypterus ornatipinnis', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Polypteridae', 'freshwater', 45, 60, 'semi_aggressive', 'carnivore', 'advanced', 24, 28, 6.0, 7.5, 300, 'Bottom', false, 'Large patterned bichir that may eat small fish.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Delhezi Bichir', 'Polypterus delhezi', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Polypteridae', 'freshwater', 30, 40, 'semi_aggressive', 'carnivore', 'advanced', 24, 28, 6.0, 7.5, 250, 'Bottom', false, 'Armoured bichir with banded markings.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Endlicheri Bichir', 'Polypterus endlicheri', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Polypteridae', 'freshwater', 60, 75, 'semi_aggressive', 'carnivore', 'advanced', 24, 28, 6.0, 7.5, 500, 'Bottom', false, 'Very large lower-jaw bichir requiring a large aquarium.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Rope Fish', 'Erpetoichthys calabaricus', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Polypteridae', 'freshwater', 30, 40, 'semi_aggressive', 'carnivore', 'advanced', 24, 28, 6.0, 7.5, 200, 'Bottom', false, 'Eel-like polypterid that requires a tight lid.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Clown Knifefish', 'Chitala ornata', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Notopteridae', 'freshwater', 80, 100, 'semi_aggressive', 'carnivore', 'advanced', 24, 30, 6.0, 7.5, 1000, 'Middle to bottom', false, 'Large Southeast Asian knifefish that can reach around 100 cm.', 'Not suitable for typical home aquariums as an adult.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Black Ghost Knifefish', 'Apteronotus albifrons', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Apteronotidae', 'freshwater', 35, 50, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 6.0, 7.5, 300, 'Middle to bottom', false, 'Nocturnal electric knifefish requiring hiding places.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Fire Eel', 'Mastacembelus erythrotaenia', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Mastacembelidae', 'freshwater', 60, 100, 'semi_aggressive', 'carnivore', 'advanced', 24, 28, 6.0, 7.5, 500, 'Bottom', false, 'Large spiny eel requiring soft substrate and secure cover.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Peacock Eel', 'Macrognathus siamensis', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Mastacembelidae', 'freshwater', 20, 30, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 6.0, 7.5, 200, 'Bottom', false, 'Smaller spiny eel native to Southeast Asia.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Spotted Gar', 'Lepisosteus oculatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Lepisosteidae', 'freshwater', NULL, NULL, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 1000, 'Top to middle', false, 'North American gar species imported rarely.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Florida Gar', 'Lepisosteus platyrhincus', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Lepisosteidae', 'freshwater', NULL, NULL, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 1000, 'Top to middle', false, 'North American gar species imported rarely.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Tiger Datnoid', 'Datnioides microlepis', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Datnioididae', 'freshwater', NULL, NULL, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 500, 'Middle', false, 'Large predatory datnoid from Southeast Asian waters.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Silver Datnoid', 'Datnioides polota', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Datnioididae', 'freshwater', NULL, NULL, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 500, 'Middle', false, 'Large datnoid species from brackish and freshwater habitats.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Peacock Bass', 'Cichla ocellaris', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Cichlidae', 'freshwater', NULL, NULL, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 500, 'Middle to top', false, 'Large predatory cichlid naturalized in some Malaysian waters.', NULL, 'Any fish small enough to be eaten', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Motoro Stingray', 'Potamotrygon motoro', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Potamotrygonidae', 'freshwater', NULL, NULL, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 1000, 'Bottom', false, 'Freshwater stingray with venomous spine.', 'CITES Appendix III (Colombia). Import may require permits depending on country of origin. Check local regulations.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Freshwater Archerfish', 'Toxotes microlepis', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Toxotidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 300, 'Middle to top', false, 'Freshwater archerfish from Southeast Asia.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Banded Archerfish', 'Toxotes jaculatrix', 'species', (SELECT id FROM fish_categories WHERE slug = 'river-monster-fish'), 'Toxotidae', 'freshwater', NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 300, 'Middle to top', false, 'Archerfish species from Southeast Asia; often associated with brackish habitats.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate')
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
SELECT fs.id, 'FishBase', 'https://www.fishbase.se/summary/' || replace(fs.scientific_name, ' ', '-') || '.html',
'scientific_database', ARRAY['scientific_name','water_type','adult_size_min_cm','adult_size_max_cm'],
CASE WHEN fs.entry_type = 'morph' THEN 'Morph of base species Scleropages formosus; CITES Appendix I' ELSE NULL END,
'2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN (
  'Asian Arowana','Malaysian Golden Arowana','Red Arowana','Green Arowana','Silver Arowana','Black Arowana',
  'Jardini Arowana','Senegal Bichir','Ornate Bichir','Delhezi Bichir','Endlicheri Bichir','Rope Fish',
  'Clown Knifefish','Black Ghost Knifefish','Fire Eel','Peacock Eel','Spotted Gar','Florida Gar',
  'Tiger Datnoid','Silver Datnoid','Peacock Bass','Motoro Stingray','Freshwater Archerfish','Banded Archerfish'
)
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/' || lower(replace(fs.scientific_name, ' ', '-')) || '/',
'care_guide', ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN ('Senegal Bichir','Black Ghost Knifefish','Fire Eel')
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
