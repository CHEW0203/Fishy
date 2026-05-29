BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, feeding_notes, image_url, thumbnail_url, image_license,
  image_source_url, verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type,
  v.adult_size_min_cm, v.adult_size_max_cm, v.temperament::temperament, v.diet::diet_type, v.care_level::care_level,
  v.temperature_min_c, v.temperature_max_c, v.ph_min, v.ph_max, v.minimum_tank_size_liters, v.tank_level,
  v.schooling_behavior, v.description, v.care_notes, v.feeding_notes, v.image_url, v.thumbnail_url, v.image_license,
  v.image_source_url, v.verification_status::verification_status, v.confidence_level::confidence_level,
  v.last_reviewed_at::timestamptz, v.local_availability
FROM (VALUES
  ('Bronze Corydoras', 'Corydoras aeneus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 6, 7, 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Bottom', true, 'Hardy social Corydoras catfish.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Albino Corydoras', 'Corydoras aeneus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 6, 7, 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Bottom', true, 'Albino variety of Bronze Corydoras.', 'Parameters inherited from base species Corydoras aeneus.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Peppered Corydoras', 'Corydoras paleatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 6, 7, 'peaceful', 'omnivore', 'beginner', 20, 26, 6.0, 7.5, 60, 'Bottom', true, 'Cold-tolerant social Corydoras with peppered pattern.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Panda Corydoras', 'Corydoras panda', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 4, 5, 'peaceful', 'omnivore', 'beginner', 20, 26, 6.0, 7.5, 60, 'Bottom', true, 'Small social Corydoras with black eye and tail markings.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Sterbai Corydoras', 'Corydoras sterbai', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 6, 7, 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, 60, 'Bottom', true, 'Warm-water Corydoras often kept with discus.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Julii Corydoras', 'Corydoras julii', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 5, 6, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 60, 'Bottom', true, 'Spotted Corydoras often misidentified as C. trilineatus in the trade.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Three-line Corydoras', 'Corydoras trilineatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 5, 6, 'peaceful', 'omnivore', 'beginner', NULL, NULL, NULL, NULL, 60, 'Bottom', true, 'Commonly traded Corydoras similar to Julii Corydoras.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Pygmy Corydoras', 'Corydoras pygmaeus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 2, 3, 'peaceful', 'omnivore', 'beginner', 22, 26, 6.0, 7.5, 40, 'Bottom to middle', true, 'Tiny Corydoras that often swims midwater in groups.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Salt and Pepper Corydoras', 'Corydoras habrosus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 2, 3, 'peaceful', 'omnivore', 'beginner', 22, 26, 6.0, 7.5, 40, 'Bottom', true, 'Dwarf Corydoras species for small peaceful aquariums.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Skunk Corydoras', 'Corydoras arcuatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 60, 'Bottom', true, 'Corydoras with a dark stripe along the back.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Adolfo''s Corydoras', 'Corydoras adolfoi', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 60, 'Bottom', true, 'Attractive specialist Corydoras with orange head marking.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Orange Venezuelan Corydoras', 'Corydoras venezuelanus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'beginner', NULL, NULL, NULL, NULL, 60, 'Bottom', true, 'Orange-toned Corydoras popular in the aquarium trade.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Otocinclus Catfish', 'Otocinclus affinis', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Callichthyidae', 'freshwater', 3, 5, 'peaceful', 'herbivore', 'intermediate', 22, 26, 6.0, 7.5, 40, 'Bottom', true, 'Small algae-grazing catfish best kept in groups.', 'Requires mature aquariums with biofilm and supplemental vegetable foods.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Glass Catfish', 'Kryptopterus vitreolus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Siluridae', 'freshwater', 6, 8, 'peaceful', 'carnivore', 'intermediate', 24, 28, 6.0, 7.5, 75, 'Middle', true, 'Transparent schooling catfish formerly misidentified as K. bicirrhis.', 'Must be kept in groups; stressed individuals do poorly.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Pictus Catfish', 'Pimelodus pictus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Pimelodidae', 'freshwater', 10, 15, 'semi_aggressive', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 200, 'Bottom', false, 'Active predatory catfish that may eat small fish.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Redtail Catfish', 'Phractocephalus hemioliopterus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Pimelodidae', 'freshwater', 100, 130, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 2000, 'Bottom', false, 'Monster catfish that grows far too large for typical aquariums.', 'Not suitable for typical home aquariums; requires public-aquarium scale housing.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Tiger Shovelnose Catfish', 'Pseudoplatystoma tigrinum', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Pimelodidae', 'freshwater', 100, 130, 'aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 2000, 'Bottom', false, 'Monster predatory catfish requiring enormous housing.', 'Not suitable for typical home aquariums; requires public-aquarium scale housing.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Iridescent Shark Catfish', 'Pangasianodon hypophthalmus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Pangasiidae', 'freshwater', 100, 130, 'peaceful', 'omnivore', 'advanced', NULL, NULL, NULL, NULL, 2000, 'Middle', true, 'Commercial food fish in Malaysia commonly sold small but grows very large.', 'Not suitable for typical home aquariums; grows to river-fish scale.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Upside-down Catfish', 'Synodontis nigriventris', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Mochokidae', 'freshwater', 8, 10, 'peaceful', 'omnivore', 'beginner', NULL, NULL, NULL, NULL, 75, 'Bottom', true, 'African Synodontis known for swimming upside-down.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Featherfin Synodontis', 'Synodontis eupterus', 'species', (SELECT id FROM fish_categories WHERE slug = 'catfish'), 'Mochokidae', 'freshwater', 15, 20, 'semi_aggressive', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 200, 'Bottom', false, 'Larger Synodontis with high dorsal fin.', NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Bristlenose Pleco', 'Ancistrus cirrhosus', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 10, 15, 'peaceful', 'herbivore', 'beginner', 22, 28, 6.0, 7.5, 75, 'Bottom', false, 'Common small pleco; often sold as Ancistrus sp.', 'Provide driftwood and vegetable foods.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Albino Bristlenose Pleco', 'Ancistrus cirrhosus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 10, 15, 'peaceful', 'herbivore', 'beginner', 22, 28, 6.0, 7.5, 75, 'Bottom', false, 'Albino variety of Bristlenose Pleco.', 'Parameters inherited from base species Ancistrus cirrhosus.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Super Red Bristlenose Pleco', 'Ancistrus cirrhosus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 10, 15, 'peaceful', 'herbivore', 'beginner', 22, 28, 6.0, 7.5, 75, 'Bottom', false, 'Red-orange variety of Bristlenose Pleco.', 'Parameters inherited from base species Ancistrus cirrhosus.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Longfin Bristlenose Pleco', 'Ancistrus cirrhosus', 'variety', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 10, 15, 'peaceful', 'herbivore', 'beginner', 22, 28, 6.0, 7.5, 75, 'Bottom', false, 'Longfin variety of Bristlenose Pleco.', 'Parameters inherited from base species Ancistrus cirrhosus.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Common Pleco', 'Hypostomus plecostomus', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 30, 50, 'peaceful', 'herbivore', 'intermediate', NULL, NULL, NULL, NULL, 300, 'Bottom', false, 'Large pleco often sold small but requiring a very large aquarium.', 'Provide driftwood, vegetable foods, and large filtration capacity.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Sailfin Pleco', 'Pterygoplichthys gibbiceps', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 35, 50, 'peaceful', 'herbivore', 'intermediate', NULL, NULL, NULL, NULL, 300, 'Bottom', false, 'Large sailfin pleco requiring substantial space.', 'Provide driftwood, vegetable foods, and large filtration capacity.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Clown Pleco', 'Panaqolus maccus', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 8, 10, 'peaceful', 'herbivore', 'beginner', NULL, NULL, NULL, NULL, 75, 'Bottom', false, 'Small wood-grazing pleco suitable for community aquariums.', 'Provide driftwood as part of the diet.', 'Feeds heavily on wood and vegetable matter.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Rubber Lip Pleco', 'Chaetostoma milesi', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 10, 15, 'peaceful', 'herbivore', 'intermediate', NULL, NULL, NULL, NULL, 110, 'Bottom', false, 'Stream pleco requiring clean oxygenated water.', NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Zebra Pleco', 'Hypancistrus zebra', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 8, 10, 'peaceful', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, 75, 'Bottom', false, 'Rare striped L-number pleco.', 'CITES Appendix III listed; requires warm, clean, well-oxygenated water.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'rare'),
  ('Gold Nugget Pleco', 'Baryancistrus xanthellus', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'advanced', NULL, NULL, NULL, NULL, 200, 'Bottom', false, 'L-number pleco requiring clean, oxygenated water and driftwood.', 'Requires well-oxygenated water and mature filtration.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Blue Phantom Pleco', 'Hemiancistrus sp.', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 200, 'Bottom', false, 'L128 pleco; scientific name not fully settled in trade.', 'Requires well-oxygenated water and driftwood.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Green Phantom Pleco', 'Hemiancistrus subviridis', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 200, 'Bottom', false, 'Green phantom L-number pleco.', 'Requires well-oxygenated water and driftwood.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Royal Pleco', 'Panaque nigrolineatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', 30, 40, 'peaceful', 'herbivore', 'intermediate', NULL, NULL, NULL, NULL, 300, 'Bottom', false, 'Large wood-eating Panaque pleco.', 'Provide driftwood and powerful filtration.', 'Xylophagous; feeds on wood and vegetable matter.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Snowball Pleco', 'Hypancistrus inspector', 'species', (SELECT id FROM fish_categories WHERE slug = 'pleco'), 'Loricariidae', 'freshwater', NULL, NULL, 'peaceful', 'carnivore', 'intermediate', NULL, NULL, NULL, NULL, 110, 'Bottom', false, 'L102 pleco; may also be listed as Hypancistrus sp.', 'Requires clean, well-oxygenated water.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, feeding_notes, image_url, thumbnail_url, image_license,
  image_source_url, verification_status, confidence_level, last_reviewed_at, local_availability
)
WHERE NOT EXISTS (
  SELECT 1 FROM fish_species existing
  WHERE existing.common_name = v.common_name
    AND existing.entry_type = v.entry_type
);

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase',
CASE WHEN fs.scientific_name LIKE '%sp.%' THEN NULL ELSE 'https://www.fishbase.se/summary/' || replace(fs.scientific_name, ' ', '-') || '.html' END,
'scientific_database', ARRAY['scientific_name','water_type','adult_size_min_cm','adult_size_max_cm'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN (
  'Bronze Corydoras','Albino Corydoras','Peppered Corydoras','Panda Corydoras','Sterbai Corydoras','Julii Corydoras',
  'Three-line Corydoras','Pygmy Corydoras','Salt and Pepper Corydoras','Skunk Corydoras','Adolfo''s Corydoras',
  'Orange Venezuelan Corydoras','Otocinclus Catfish','Glass Catfish','Pictus Catfish','Redtail Catfish',
  'Tiger Shovelnose Catfish','Iridescent Shark Catfish','Upside-down Catfish','Featherfin Synodontis',
  'Bristlenose Pleco','Albino Bristlenose Pleco','Super Red Bristlenose Pleco','Longfin Bristlenose Pleco',
  'Common Pleco','Sailfin Pleco','Clown Pleco','Rubber Lip Pleco','Zebra Pleco','Gold Nugget Pleco',
  'Blue Phantom Pleco','Green Phantom Pleco','Royal Pleco','Snowball Pleco'
)
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/' || lower(replace(fs.scientific_name, ' ', '-')) || '/',
'care_guide', ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.entry_type = 'species'
  AND fs.common_name IN (
    'Bronze Corydoras','Peppered Corydoras','Panda Corydoras','Sterbai Corydoras','Julii Corydoras',
    'Three-line Corydoras','Pygmy Corydoras','Salt and Pepper Corydoras','Otocinclus Catfish','Glass Catfish',
    'Bristlenose Pleco','Common Pleco','Clown Pleco','Zebra Pleco'
  )
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
