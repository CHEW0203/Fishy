BEGIN;

INSERT INTO fish_species (
  common_name, scientific_name, entry_type, category_id, family, water_type, temperament, diet, care_level,
  temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters, tank_level,
  schooling_behavior, description, care_notes, image_url, thumbnail_url, image_license, image_source_url,
  verification_status, confidence_level, last_reviewed_at, local_availability
)
SELECT
  v.common_name, v.scientific_name, v.entry_type, v.category_id, v.family, v.water_type::water_type,
  v.temperament::temperament, v.diet::diet_type, v.care_level::care_level,
  v.temperature_min_c, v.temperature_max_c, v.ph_min, v.ph_max, v.minimum_tank_size_liters, v.tank_level,
  v.schooling_behavior, v.description, v.care_notes, v.image_url, v.thumbnail_url, v.image_license, v.image_source_url,
  v.verification_status::verification_status, v.confidence_level::confidence_level, v.last_reviewed_at::timestamptz,
  v.local_availability
FROM (VALUES
  ('Neon Tetra', 'Paracheirodon innesi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 20, 26, 5.0, 7.5, 40, 'Middle', true, 'Small schooling tetra with blue and red lateral colouration.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Cardinal Tetra', 'Paracheirodon axelrodi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 23, 29, 4.0, 7.0, 40, 'Middle', true, 'Popular schooling tetra with a full-length red stripe.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Green Neon Tetra', 'Paracheirodon simulans', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 40, 'Middle', true, 'Small Paracheirodon tetra suited to soft acidic aquariums.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Black Neon Tetra', 'Hyphessobrycon herbertaxelrodi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 5.5, 7.5, 40, 'Middle', true, 'Hardy black and silver schooling tetra.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Ember Tetra', 'Hyphessobrycon amandae', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 23, 29, 5.5, 7.0, 30, 'Middle', true, 'Tiny orange schooling tetra for peaceful planted tanks.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Glowlight Tetra', 'Hemigrammus erythrozonus', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 24, 28, 5.5, 7.5, 40, 'Middle', true, 'Peaceful tetra with a bright orange-red lateral stripe.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Rummy Nose Tetra', 'Hemigrammus rhodostomus', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'intermediate', 24, 28, 5.0, 7.0, 60, 'Middle', true, 'Schooling tetra with a red head and striped tail.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('Brilliant Rummy Nose Tetra', 'Hemigrammus bleheri', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'intermediate', 24, 28, 5.0, 7.0, 60, 'Middle', true, 'Distinct rummy nose species often confused with Hemigrammus rhodostomus.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Black Widow Tetra', 'Gymnocorymbus ternetzi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 20, 28, 6.0, 8.0, 60, 'Middle', true, 'Hardy deep-bodied tetra also known as Black Skirt Tetra.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'common'),
  ('White Skirt Tetra', 'Gymnocorymbus ternetzi', 'variety', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 20, 28, 6.0, 8.0, 60, 'Middle', true, 'Leucistic or albino line of Black Widow Tetra.', 'Parameters inherited from base species Gymnocorymbus ternetzi.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'common'),
  ('Serpae Tetra', 'Hyphessobrycon eques', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'semi_aggressive', 'omnivore', 'beginner', 22, 28, 5.0, 7.5, 60, 'Middle', true, 'Red tetra known for fin-nipping if kept in small groups.', 'Keep in a proper group to reduce fin-nipping.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Lemon Tetra', 'Hyphessobrycon pulchripinnis', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 5.5, 7.5, 60, 'Middle', true, 'Yellow-toned schooling tetra for community aquariums.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Buenos Aires Tetra', 'Hyphessobrycon anisitsi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'semi_aggressive', 'omnivore', 'beginner', 18, 28, 6.0, 8.0, 75, 'Middle', true, 'Hardy active tetra known to nip fins and eat soft plants.', 'Avoid delicate long-finned tankmates and soft-leaved plants.', NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Red Eye Tetra', 'Moenkhausia sanctaefilomenae', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 8.0, 60, 'Middle', true, 'Hardy silver tetra with a red marking above the eye.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Diamond Tetra', 'Moenkhausia pittieri', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 24, 28, 5.5, 7.5, 60, 'Middle', true, 'Shimmering deep-bodied tetra best kept in groups.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Emperor Tetra', 'Nematobrycon palmeri', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 23, 27, 5.5, 7.5, 60, 'Middle', true, 'Attractive Colombian tetra with elongated fins in males.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Black Emperor Tetra', 'Nematobrycon amphiloxus', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, 60, 'Middle', true, 'Less common emperor tetra relative with limited aquarium data.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'rare'),
  ('Congo Tetra', 'Phenacogrammus interruptus', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'intermediate', 24, 27, 6.0, 7.5, 110, 'Middle', true, 'Large African tetra; males can reach around 8 cm and show flowing fins.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('X-Ray Tetra', 'Pristella maxillaris', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 8.0, 40, 'Middle', true, 'Hardy transparent-bodied tetra with black and yellow fin markings.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Bloodfin Tetra', 'Aphyocharax anisitsi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 18, 28, 6.0, 8.0, 60, 'Middle', true, 'Active silver tetra with red fins.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Silvertip Tetra', 'Hasemania nana', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 40, 'Middle', true, 'Small active tetra with pale fin tips.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Head and Tail Light Tetra', 'Hemigrammus ocellifer', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 24, 28, 6.0, 7.5, 60, 'Middle', true, 'Schooling tetra with reflective marks near the head and tail.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Penguin Tetra', 'Thayeria boehlkei', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Middle', true, 'Obliquely swimming tetra with a bold black lateral stripe.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Black Phantom Tetra', 'Hyphessobrycon megalopterus', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Middle', true, 'Peaceful tetra with dark shoulder markings and display behaviour.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Red Phantom Tetra', 'Hyphessobrycon sweglesi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 5.5, 7.0, 60, 'Middle', true, 'Red-toned phantom tetra for soft-water planted aquariums.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Bleeding Heart Tetra', 'Hyphessobrycon erythrostigma', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'intermediate', 24, 28, 5.5, 7.5, 75, 'Middle', true, 'Larger tetra named for its red shoulder spot.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Rosy Tetra', 'Hyphessobrycon rosaceus', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 24, 28, 5.5, 7.5, 60, 'Middle', true, 'Rosy-coloured schooling tetra for community aquariums.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Flame Tetra', 'Hyphessobrycon flammeus', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 20, 26, 5.5, 7.5, 40, 'Middle', true, 'Small orange-red tetra also known as Von Rio Tetra.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Green Fire Tetra', 'Aphyocharax rathbuni', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, NULL, 'Middle', true, 'Less common tetra with limited aquarium husbandry data.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'low', '2025-01-01', 'rare'),
  ('Gold Tetra', 'Hemigrammus rodwayi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', NULL, NULL, NULL, NULL, 40, 'Middle', true, 'Small tetra often seen with a gold sheen in the aquarium trade.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Ruby Tetra', 'Axelrodia riesei', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'intermediate', NULL, NULL, NULL, NULL, NULL, 'Middle', true, 'Tiny red tetra with limited aquarium husbandry data.', NULL, NULL, NULL, NULL, NULL, 'partially_verified', 'low', '2025-01-01', 'rare'),
  ('Cochu''s Blue Tetra', 'Boehlkea fredcochui', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Middle', true, 'Blue-toned schooling tetra known in trade as Cochu''s Blue Tetra.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate'),
  ('Blue Tetra', 'Boehlkea fredcochui', 'variety', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 22, 28, 6.0, 7.5, 60, 'Middle', true, 'Trade name variant for Cochu''s Blue Tetra; both refer to Boehlkea fredcochui.', 'Parameters inherited from base species Boehlkea fredcochui.', NULL, NULL, NULL, NULL, 'partially_verified', 'medium', '2025-01-01', 'moderate'),
  ('Candy Cane Tetra', 'Hyphessobrycon bentosi', 'species', (SELECT id FROM fish_categories WHERE slug = 'tetra'), 'Characidae', 'freshwater', 'peaceful', 'omnivore', 'beginner', 23, 28, 5.5, 7.5, 60, 'Middle', true, 'Rosy tetra relative with red and white fin markings.', NULL, NULL, NULL, NULL, NULL, 'verified', 'high', '2025-01-01', 'moderate')
) AS v (
  common_name, scientific_name, entry_type, category_id, family, water_type, temperament, diet, care_level,
  temperature_min_c, temperature_max_c, ph_min, ph_max, minimum_tank_size_liters, tank_level,
  schooling_behavior, description, care_notes, image_url, thumbnail_url, image_license, image_source_url,
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
WHERE fs.category_id = (SELECT id FROM fish_categories WHERE slug = 'tetra')
  AND fs.common_name IN (
    'Neon Tetra','Cardinal Tetra','Green Neon Tetra','Black Neon Tetra','Ember Tetra','Glowlight Tetra',
    'Rummy Nose Tetra','Brilliant Rummy Nose Tetra','Black Widow Tetra','White Skirt Tetra','Serpae Tetra',
    'Lemon Tetra','Buenos Aires Tetra','Red Eye Tetra','Diamond Tetra','Emperor Tetra','Black Emperor Tetra',
    'Congo Tetra','X-Ray Tetra','Bloodfin Tetra','Silvertip Tetra','Head and Tail Light Tetra','Penguin Tetra',
    'Black Phantom Tetra','Red Phantom Tetra','Bleeding Heart Tetra','Rosy Tetra','Flame Tetra','Green Fire Tetra',
    'Gold Tetra','Ruby Tetra','Cochu''s Blue Tetra','Blue Tetra','Candy Cane Tetra'
  )
ON CONFLICT (species_id, source_name) DO NOTHING;

INSERT INTO fish_species_sources (species_id, source_name, source_url, source_type, fields_supported, notes, retrieved_at)
SELECT fs.id, 'Seriously Fish', 'https://www.seriouslyfish.com/species/' || lower(replace(fs.scientific_name, ' ', '-')) || '/',
'care_guide', ARRAY['care_level','care_notes','minimum_tank_size_liters','temperament'], NULL, '2025-01-01'
FROM fish_species fs
WHERE fs.category_id = (SELECT id FROM fish_categories WHERE slug = 'tetra')
  AND fs.entry_type = 'species'
  AND fs.confidence_level = 'high'
ON CONFLICT (species_id, source_name) DO NOTHING;

COMMIT;
