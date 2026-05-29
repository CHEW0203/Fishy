# Malaysia Ornamental Fish Library V1 - Import Guide

## Prerequisites

- Migration 009 must be applied in Supabase SQL Editor first.
- Apply once only. File: `database/migrations/009_extend_species_and_user_fish.sql`

## Run Order

Batch 1:

1. `01_categories_update.sql`
2. `batch1_guppy_livebearer.sql`
3. `batch1_betta.sql`

Batch 2:

4. `batch2_gourami.sql`
5. `batch2_tetra.sql`

Batch 3:

6. `batch3_rasbora_danio_ricefish.sql`
7. `batch3_barb_shark_river.sql`

Batch 4:

8. `batch4_cory_pleco.sql`
9. `batch4_loach.sql`
10. `batch4_cichlid_discus.sql`

Batch 5:

11. `batch5_goldfish_koi.sql`
12. `batch5_arowana_predator.sql`
13. `batch5_snakehead.sql`
14. `batch5_marine.sql`

## How to run

- Open Supabase SQL Editor.
- Paste each file contents and run.
- Each file is wrapped in `BEGIN`/`COMMIT` and is safe to re-run.

## Verify after import

```sql
SELECT COUNT(*) FROM fish_species; -- should be ~303 after all V1 batches
SELECT entry_type, COUNT(*) FROM fish_species GROUP BY entry_type;
SELECT COUNT(*) FROM fish_species_sources;
```

## Batch Status

- Batch 1: Guppy/Livebearer + Betta - complete
- Batch 2: Gourami + Tetra - complete
- Batch 3: Rasbora/Danio/Ricefish + Barb/Shark/Malaysia River - complete
- Batch 4: Catfish/Corydoras + Pleco + Loach + Cichlid/Discus - complete
- Batch 5: Goldfish/Koi + Arowana/Predator + Snakehead + Marine - complete
- Total target from listed files: ~303 entries across all batches

## Rollback

To remove only V1 data, first remove related source rows by joining through `fish_species`, then remove species rows. Adjust the import date as needed:

```sql
DELETE FROM fish_species_sources src
USING fish_species sp
WHERE src.species_id = sp.id
  AND sp.created_at >= '[date batch was imported]';

DELETE FROM fish_species
WHERE created_at >= '[date batch was imported]';
```

Species rows added by batch for rollback reference:

Batch 1 species:
`Common Guppy`, `Endler''s Livebearer`, `Sailfin Molly`, `Giant Sailfin Molly`, `Platy`, `Variatus Platy`, `Swordtail`, `Betta`, `Peaceful Betta`, `Slender Betta`, `Akar Betta`, `Iban Betta`, `Snakehead Betta`, `Brown''s Betta`, `Spotfin Betta`, `Apollo Betta`.

Batch 2 species:
`Dwarf Gourami`, `Honey Gourami`, `Pearl Gourami`, `Moonlight Gourami`, `Three Spot Gourami`, `Snakeskin Gourami`, `Croaking Gourami`, `Sparkling Gourami`, `Giant Gourami`, `Chocolate Gourami`, `Licorice Gourami`, `Neon Tetra`, `Cardinal Tetra`, `Ember Tetra`, `Rummy Nose Tetra`, `Congo Tetra`.

Batch 3 species:
`Harlequin Rasbora`, `Chili Rasbora`, `Celestial Pearl Danio`, `Zebra Danio`, `Medaka`, `White Cloud Mountain Minnow`, `Tiger Barb`, `Cherry Barb`, `Denison Barb`, `Bala Shark`, `Rainbow Shark`, `Lampam`, `Kelah / Malaysian Mahseer`, `Sebarau / Hampala Barb`.

Batch 4 species:
`Bronze Corydoras`, `Panda Corydoras`, `Sterbai Corydoras`, `Glass Catfish`, `Redtail Catfish`, `Bristlenose Pleco`, `Common Pleco`, `Zebra Pleco`, `Clown Loach`, `Kuhli Loach`, `Dwarf Chain Loach`, `Reticulated Hillstream Loach`, `Angelfish`, `Discus`, `German Blue Ram`, `Oscar`, `Frontosa`.

Batch 5 species:
`Common Goldfish`, `Koi`, `Asian Arowana`, `Silver Arowana`, `Jardini Arowana`, `Senegal Bichir`, `Clown Knifefish`, `Motoro Stingray`, `Giant Snakehead / Toman`, `Striped Snakehead / Haruan`, `Climbing Perch / Puyu`, `Freshwater Halfbeak`, `Ocellaris Clownfish`, `Blue Green Chromis`, `Banggai Cardinalfish`, `Yellow Tang`, `Blue Tang`, `Mandarin Dragonet`.
