BEGIN;

INSERT INTO fish_categories (name, slug, description) VALUES
  ('Snakehead', 'snakehead',
   'Channa species - Giant Snakehead (Toman), Striped Snakehead (Haruan), ornamental snakeheads')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
