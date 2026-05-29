BEGIN;

-- Section A-C: Malaysia ornamental betta library batch 1.
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
  ('Betta', 'Betta splendens', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Thailand, Mekong River basin; widely captive-bred worldwide', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Siamese fighting fish. Males display brilliant colours and flowing fins. One of the most widely kept ornamental fish in Malaysia.', 'Males must be kept one per tank. Aggressive to their own kind and fish with similar colour or long fins. Labyrinth organ allows brief air breathing at the surface. Water temperature must not drop below 24C.', 'Primarily insectivorous. Feed live or frozen bloodworm, daphnia, brine shrimp. Quality betta pellets suitable. Do not overfeed.', 'Can be kept with peaceful community fish in larger tanks if provided hiding spots. Avoid fin-nippers.', 'Other male bettas, Tiger Barbs, aggressive fin-nipping species, fish with bright colours or long flowing fins that may trigger aggression', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Halfmoon Betta', 'Betta splendens', 'strain', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Caudal fin spreads to a full 180-degree D-shape. Popular in show competitions.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Plakat Betta', 'Betta splendens', 'strain', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Short-finned fighting form. More active and less susceptible to fin damage than long-finned types.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Crowntail Betta', 'Betta splendens', 'strain', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Reduced webbing between fin rays creates a spiky crown-like appearance.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Veiltail Betta', 'Betta splendens', 'strain', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Long flowing asymmetrical tail that drapes downward. The most common form in general trade.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Dumbo Betta', 'Betta splendens', 'strain', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Greatly enlarged pectoral fins resembling elephant ears. Also called Elephant Ear Betta.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Koi Betta', 'Betta splendens', 'morph', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Marble-like red, black, orange and white koi-inspired patterning. Colour may change with age.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Galaxy Betta', 'Betta splendens', 'morph', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Dark body covered in iridescent white or blue spots resembling a starfield.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Dragon Scale Betta', 'Betta splendens', 'morph', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Thick metallic iridescent scales overlaying the body in a dragon-scale pattern.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Copper Betta', 'Betta splendens', 'morph', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Metallic copper or gold iridescent colouration across most of the body.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Samurai Betta', 'Betta splendens', 'morph', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Selectively bred; base species from Thailand', 5, 7, 2, 5, 'aggressive', 'carnivore', 'beginner', 24, 30, 6.0, 7.5, 1, 10, 15, 'Middle to top', false, 'Contrasting metallic and dark scale pattern creating an armoured warrior-like appearance.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Peaceful Betta', 'Betta imbellis', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Peninsular Malaysia, Southern Thailand, Northern Sumatra', 4, 6, 2, 4, 'semi_aggressive', 'carnivore', 'intermediate', 24, 28, 4.0, 7.0, 1, 8, 30, 'Middle to top', false, 'Native to Peninsular Malaysia. Relatively peaceful compared to B. splendens. Found in rice paddies, peat swamps, and sluggish streams.', 'Prefers soft acidic water. Can be kept in pairs or small groups in a well-planted tank unlike B. splendens. Blackwater conditions preferred.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Slender Betta', 'Betta bellica', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Peninsular Malaysia (Perak)', 8, 11, NULL, NULL, 'aggressive', 'carnivore', 'advanced', 24, 28, 4.0, 6.5, 1, 5, 60, 'Middle to top', false, 'Large mouthbrooding betta native to Peninsular Malaysia. Less commonly traded but occasionally available from specialist breeders.', 'Requires soft, acidic, peat-filtered water. Males are aggressive; keep one per tank.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Akar Betta', 'Betta akarensis', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Sarawak, Malaysian Borneo', 8, 12, NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', 23, 27, 4.0, 7.0, 1, 8, 75, 'Middle to top', false, 'Large mouthbrooding betta from the rivers of Sarawak, Borneo.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Iban Betta', 'Betta ibanorum', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Sarawak, Malaysian Borneo', NULL, NULL, NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', NULL, NULL, NULL, NULL, NULL, NULL, 40, 'Middle to top', false, 'Rarely traded betta from Sarawak, Borneo. Very limited aquarium husbandry data available.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'low', '2025-01-01', 'rare'),
  ('Snakehead Betta', 'Betta channoides', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'East Kalimantan, Borneo', 4, 5, NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', 24, 28, 4.5, 6.5, 1, 5, 40, 'Middle to top', false, 'Small mouthbrooding betta from Borneo blackwater streams. Occasionally available from specialist breeders in Malaysia.', 'Strict blackwater conditions required. Soft, acidic peat-filtered water essential.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Brown''s Betta', 'Betta brownorum', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Sarawak, Malaysian Borneo', 3, 4, NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', 23, 27, 4.0, 6.5, 1, 5, 30, 'Middle to top', false, 'Small mouthbrooding betta from Sarawak peat swamps. Deep red body with iridescent blue-green markings.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Spotfin Betta', 'Betta macrostoma', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Brunei; Sarawak, Malaysian Borneo', 8, 10, NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', 22, 26, 4.0, 6.5, 1, 5, 75, 'Middle to top', false, 'One of the most striking wild bettas. Males are orange with bold black spots on the dorsal and caudal fins.', 'CITES Appendix II listed. Import may require documentation. Mouthbrooder. Requires mature blackwater setup.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Apollo Betta', 'Betta apollon', 'species', (SELECT id FROM fish_categories WHERE slug = 'betta'), 'Osphronemidae', 'freshwater', 'Peninsular Malaysia', 4, 6, NULL, NULL, 'semi_aggressive', 'carnivore', 'advanced', 23, 27, 5.0, 7.0, NULL, NULL, 40, 'Middle to top', false, 'Mouthbrooding betta from Peninsular Malaysia. Closely related to B. imbellis complex.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'low', '2025-01-01', 'rare')
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

-- Section D: Source rows.
INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT id, 'FishBase', 'https://www.fishbase.se/summary/Betta-splendens.html', 'scientific_database',
ARRAY['scientific_name','origin','adult_size_min_cm','adult_size_max_cm','temperature_min_c','temperature_max_c','ph_min','ph_max','water_type','diet'], NULL, '2025-01-01'
FROM fish_species WHERE common_name = 'Betta' AND entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/betta-splendens/', 'care_guide',
ARRAY['care_level','care_notes','feeding_notes','compatibility_notes','avoid_with_notes','minimum_tank_size_liters','temperament','description'], NULL, '2025-01-01'
FROM fish_species WHERE common_name = 'Betta' AND entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase', 'https://www.fishbase.se/summary/Betta-splendens.html', 'scientific_database',
ARRAY['scientific_name','water_type','temperature_min_c','temperature_max_c','ph_min','ph_max','adult_size_min_cm','adult_size_max_cm'],
'Water parameters inherited from base species Betta splendens', '2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN (
  'Halfmoon Betta',
  'Plakat Betta',
  'Crowntail Betta',
  'Veiltail Betta',
  'Dumbo Betta',
  'Koi Betta',
  'Galaxy Betta',
  'Dragon Scale Betta',
  'Copper Betta',
  'Samurai Betta'
)
AND fs.entry_type IN ('strain','morph')
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'FishBase', s.source_url, 'scientific_database',
ARRAY['scientific_name','origin','adult_size_min_cm','adult_size_max_cm','temperature_min_c','temperature_max_c','ph_min','ph_max'], s.notes, '2025-01-01'
FROM fish_species fs
JOIN (VALUES
  ('Peaceful Betta', 'Betta imbellis', 'https://www.fishbase.se/summary/Betta-imbellis.html', NULL),
  ('Slender Betta', 'Betta bellica', 'https://www.fishbase.se/summary/Betta-bellica.html', NULL),
  ('Akar Betta', 'Betta akarensis', 'https://www.fishbase.se/summary/Betta-akarensis.html', NULL),
  ('Iban Betta', 'Betta ibanorum', 'https://www.fishbase.se/summary/Betta-ibanorum.html', 'Limited published husbandry data; temperature and pH left NULL'),
  ('Snakehead Betta', 'Betta channoides', 'https://www.fishbase.se/summary/Betta-channoides.html', NULL),
  ('Brown''s Betta', 'Betta brownorum', 'https://www.fishbase.se/summary/Betta-brownorum.html', NULL),
  ('Spotfin Betta', 'Betta macrostoma', 'https://www.fishbase.se/summary/Betta-macrostoma.html', NULL),
  ('Apollo Betta', 'Betta apollon', 'https://www.fishbase.se/summary/Betta-apollon.html', 'Insufficient verified hardness data; hardness left NULL')
) AS s(common_name, scientific_name, source_url, notes)
  ON fs.common_name = s.common_name
  AND fs.scientific_name = s.scientific_name
  AND fs.entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/betta-imbellis/', 'care_guide',
ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament','description'], NULL, '2025-01-01'
FROM fish_species WHERE common_name = 'Peaceful Betta' AND entry_type = 'species'
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
