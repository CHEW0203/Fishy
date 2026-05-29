-- Seed: fish_categories
-- Run AFTER migrations 001-008

INSERT INTO fish_categories (name, slug, description) VALUES
  ('Cichlid', 'cichlid', 'Cichlidae family - includes Oscars, Jack Dempseys, African cichlids, Discus'),
  ('Angelfish', 'angelfish', 'Freshwater angelfish - Pterophyllum species'),
  ('Gourami', 'gourami', 'Labyrinth fish - Pearl, Honey, Dwarf, Three Spot Gourami'),
  ('Betta', 'betta', 'Siamese fighting fish - Betta splendens and relatives'),
  ('Arowana', 'arowana', 'Large surface-dwelling predatory fish'),
  ('Goldfish', 'goldfish', 'Common and fancy goldfish - Carassius auratus varieties'),
  ('Koi', 'koi', 'Nishikigoi - ornamental carp for ponds and large aquariums'),
  ('Tetra', 'tetra', 'Small schooling fish - Neon, Cardinal, Rummy Nose and relatives'),
  ('Barb', 'barb', 'Active schooling fish - Tiger Barb, Cherry Barb, Rosy Barb'),
  ('Rasbora', 'rasbora', 'Small schooling fish - Harlequin, Chili Rasbora'),
  ('Catfish', 'catfish', 'Bottom-dwelling catfish - Corydoras, Synodontis and relatives'),
  ('Pleco', 'pleco', 'Armoured catfish - Common Pleco, Bristlenose Pleco, L-number plecos'),
  ('Loach', 'loach', 'Clown Loach, Kuhli Loach, Yoyo Loach'),
  ('Discus', 'discus', 'South American discus - Symphysodon species'),
  ('Livebearer', 'livebearer', 'Guppies, Platies, Swordtails, Mollies'),
  ('Marine Fish', 'marine-fish', 'Saltwater species - Clownfish, Blue Tang, Damselfish'),
  ('Brackish Fish', 'brackish-fish', 'Brackish water species - Figure 8 Puffer, Archer Fish'),
  ('River Monster Fish', 'river-monster-fish', 'Large predatory freshwater fish - Arapaima, Alligator Gar')
ON CONFLICT (slug) DO NOTHING;
