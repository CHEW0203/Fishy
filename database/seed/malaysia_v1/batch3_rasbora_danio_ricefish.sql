BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, origin, adult_size_min_cm, adult_size_max_cm,
  temperament, diet, care_level, temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters,
  tank_level, schooling_behavior, description, care_notes, image_url, thumbnail_url, image_license, image_source_url,
  verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type, v.origin,
  v.adult_size_min_cm, v.adult_size_max_cm, v.temperament::temperament, v.diet::diet_type, v.care_level::care_level,
  v.temperature_min_c, v.temperature_max_c, v.ph_min, v.ph_max, v.minimum_tank_size_liters, v.tank_level,
  v.schooling_behavior, v.description, v.care_notes, v.image_url, v.thumbnail_url, v.image_license, v.image_source_url,
  v.verification_status::verification_status, v.confidence_level::confidence_level, v.last_reviewed_at::timestamptz,
  v.local_availability
FROM (VALUES
  ('Harlequin Rasbora', 'Trigonostigma heteromorpha', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Peninsular Malaysia, Thailand, Sumatra and Singapore', 4, 5, 'peaceful', 'omnivore', 'beginner', 22, 28, 5.5, 7.5, 40, 'Middle', true, 'Locally relevant schooling rasbora with a black wedge marking.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Lambchop Rasbora', 'Trigonostigma espei', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Thailand and nearby Southeast Asian habitats', 3, 4, 'peaceful', 'omnivore', 'beginner', 22, 28, 5.5, 7.5, 40, 'Middle', true, 'Small orange schooling rasbora with a lambchop-shaped marking.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Glowlight Rasbora', 'Trigonostigma hengeli', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia including Sumatra and Borneo region', 3, 4, 'peaceful', 'omnivore', 'beginner', 22, 28, 5.5, 7.5, 40, 'Middle', true, 'Small peaceful rasbora with an orange glow above the dark body mark.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Chili Rasbora', 'Boraras brigittae', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 1.5, 2.5, 'peaceful', 'omnivore', 'beginner', 23, 28, 5.0, 7.0, 30, 'Middle', true, 'Tiny red schooling fish for quiet planted nano aquariums.', 'Prefers soft slightly acidic water and must be kept in groups.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Phoenix Rasbora', 'Boraras merah', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 1.5, 2.5, 'peaceful', 'omnivore', 'beginner', 23, 28, 5.0, 7.0, 30, 'Middle', true, 'Tiny Boraras species for soft-water planted aquariums.', 'Prefers soft slightly acidic water and must be kept in groups.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Dwarf Rasbora', 'Boraras maculatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia including peat swamp habitats', 1.5, 2.5, 'peaceful', 'omnivore', 'beginner', 23, 28, 5.0, 7.0, 30, 'Middle', true, 'Tiny spotted rasbora from soft acidic habitats.', 'Prefers soft slightly acidic water and must be kept in groups.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Strawberry Rasbora', 'Boraras naevus', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 1.5, 2.5, 'peaceful', 'omnivore', 'beginner', 23, 28, 5.0, 7.0, 30, 'Middle', true, 'Small red Boraras species for quiet planted tanks.', 'Prefers soft slightly acidic water and must be kept in groups.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Scissortail Rasbora', 'Rasbora trilineata', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 10, 15, 'peaceful', 'omnivore', 'beginner', 23, 28, 6.0, 7.5, 110, 'Middle', true, 'Larger active schooling rasbora with forked tail markings.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Brilliant Rasbora', 'Rasbora einthovenii', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia including Malaysia', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 75, 'Middle', true, 'Southeast Asian schooling rasbora with limited aquarium detail in this seed.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Clown Rasbora', 'Rasbora kalochroma', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia including peat swamp habitats', NULL, NULL, 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 75, 'Middle', true, 'Colourful Southeast Asian rasbora with limited aquarium detail in this seed.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Red-tailed Rasbora', 'Rasbora borapetensis', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 5, 6, 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Middle', true, 'Hardy schooling rasbora with red tail colour.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Emerald Dwarf Rasbora', 'Microdevario kubotai', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 2, 3, 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 30, 'Middle', true, 'Bright green schooling fish also sold as Neon Green Rasbora or Green Rasbora.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Celestial Pearl Danio', 'Danio margaritatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Myanmar', 2, 3, 'peaceful', 'omnivore', 'beginner', 20, 26, 6.5, 7.5, 40, 'Middle', true, 'Popular small danio also sold as Galaxy Rasbora.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Zebra Danio', 'Danio rerio', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'South Asia', 4, 5, 'peaceful', 'omnivore', 'beginner', 18, 26, 6.5, 8.0, 40, 'Middle to top', true, 'Hardy active schooling danio and classic beginner fish.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Leopard Danio', 'Danio rerio', 'variety', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Selectively bred; base species from South Asia', 4, 5, 'peaceful', 'omnivore', 'beginner', 18, 26, 6.5, 8.0, 40, 'Middle to top', true, 'Spotted line-bred variety of Danio rerio.', 'Parameters inherited from base species Danio rerio.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Pearl Danio', 'Danio albolineatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southeast Asia', 5, 6, 'peaceful', 'omnivore', 'beginner', 20, 26, 6.5, 7.5, 60, 'Middle', true, 'Active pearly schooling danio.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Giant Danio', 'Devario aequipinnatus', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'South Asia', 8, 10, 'peaceful', 'omnivore', 'beginner', 20, 26, 6.5, 7.5, 110, 'Middle to top', true, 'Large fast schooling danio requiring swimming space.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Glowlight Danio', 'Danio choprai', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Myanmar', 3, 4, 'peaceful', 'omnivore', 'beginner', 20, 26, 6.5, 7.5, 40, 'Middle', true, 'Small orange-toned active danio.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Medaka', 'Oryzias latipes', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Adrianichthyidae', 'freshwater', 'East Asia', 3, 4, 'peaceful', 'omnivore', 'beginner', 16, 28, 6.5, 8.0, 30, 'Middle to top', true, 'Japanese ricefish; hardy and increasingly popular in Malaysia.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Platinum Medaka', 'Oryzias latipes', 'variety', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Adrianichthyidae', 'freshwater', 'Selectively bred; base species from East Asia', 3, 4, 'peaceful', 'omnivore', 'beginner', 16, 28, 6.5, 8.0, 30, 'Middle to top', true, 'Platinum ornamental variety of Medaka.', 'Parameters inherited from base species Oryzias latipes.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Black Medaka', 'Oryzias latipes', 'variety', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Adrianichthyidae', 'freshwater', 'Selectively bred; base species from East Asia', 3, 4, 'peaceful', 'omnivore', 'beginner', 16, 28, 6.5, 8.0, 30, 'Middle to top', true, 'Dark ornamental variety of Medaka.', 'Parameters inherited from base species Oryzias latipes.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Gold White Cloud Mountain Minnow', 'Tanichthys albonubes', 'variety', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Selectively bred; base species from southern China', 3, 4, 'peaceful', 'omnivore', 'beginner', 14, 22, 6.0, 8.0, 40, 'Middle', true, 'Gold colour variety of White Cloud Mountain Minnow.', 'Parameters inherited from base species Tanichthys albonubes.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('White Cloud Mountain Minnow', 'Tanichthys albonubes', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Cyprinidae', 'freshwater', 'Southern China', 3, 4, 'peaceful', 'omnivore', 'beginner', 14, 22, 6.0, 8.0, 40, 'Middle', true, 'Cold-tolerant small schooling cyprinid.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Daisy''s Ricefish', 'Oryzias woworae', 'species', (SELECT id FROM fish_categories WHERE slug = 'rasbora'), 'Adrianichthyidae', 'freshwater', 'Sulawesi, Indonesia', 3, 4, 'peaceful', 'omnivore', 'beginner', NULL, NULL, NULL, NULL, 30, 'Middle to top', true, 'Small colourful ricefish with a smaller husbandry data set.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, origin, adult_size_min_cm, adult_size_max_cm,
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
SELECT fs.id, 'FishBase', 'https://www.fishbase.se/summary/' || replace(fs.scientific_name, ' ', '-') || '.html',
'scientific_database', ARRAY['scientific_name','water_type','origin','adult_size_min_cm','adult_size_max_cm'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.common_name IN (
  'Harlequin Rasbora','Lambchop Rasbora','Glowlight Rasbora','Chili Rasbora','Phoenix Rasbora','Dwarf Rasbora',
  'Strawberry Rasbora','Scissortail Rasbora','Brilliant Rasbora','Clown Rasbora','Red-tailed Rasbora',
  'Emerald Dwarf Rasbora','Celestial Pearl Danio','Zebra Danio','Leopard Danio','Pearl Danio','Giant Danio',
  'Glowlight Danio','Medaka','Platinum Medaka','Black Medaka','Gold White Cloud Mountain Minnow',
  'White Cloud Mountain Minnow','Daisy''s Ricefish'
)
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/' || lower(replace(fs.scientific_name, ' ', '-')) || '/',
'care_guide', ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.entry_type = 'species'
  AND fs.common_name IN (
    'Harlequin Rasbora','Lambchop Rasbora','Glowlight Rasbora','Chili Rasbora','Phoenix Rasbora','Dwarf Rasbora',
    'Strawberry Rasbora','Scissortail Rasbora','Red-tailed Rasbora','Emerald Dwarf Rasbora','Celestial Pearl Danio',
    'Zebra Danio','Pearl Danio','Giant Danio','Glowlight Danio','Medaka','White Cloud Mountain Minnow'
  )
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
