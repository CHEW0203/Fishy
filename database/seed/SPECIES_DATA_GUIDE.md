# Fishy Species Data Guide

## Goal

Build toward a real, source-backed species encyclopedia, targeting up to 10,000 verified fish species over time. Quality is more important than quantity. Every record must have a real source.

## Core Rules

- No AI-generated facts. AI may assist with formatting only.
- No fake species. Scientific names must be real.
- No fake sources. Every source URL must be real and verifiable.
- Unknown fields: use `null`. Never use `N/A`, empty string, or invented values.
- Images only with license: CC BY, CC BY-SA, CC0, or Public Domain.

## Trusted Sources

### Primary Sources

- FishBase (fishbase.se): scientific names, max size, temperature, pH, ecology, distribution, diet, taxonomy.
- Seriously Fish (seriouslyfish.com): aquarium care profiles, tank parameters, husbandry, feeding, compatibility.

### Secondary Sources (confirmation only)

- AquariumCoop, LiveAquaria, Fishkeeping World. Use these to confirm primary sources, not as sole citations.

### Sources to Avoid as Primary

- Random forum threads.
- AI-generated care sheets without citation.
- Wikipedia fish articles without traceable primary source.

## Required Fields

- `common_name`
- `scientific_name` (must be unique)
- `water_type` (`freshwater` / `brackish` / `marine` / `unknown`)
- `verification_status` (`verified` / `partially_verified` / `draft` / `needs_review`)
- `confidence_level` (`high` / `medium` / `low` / `unknown`)
- `sources[]` (at least one source with `source_url` for verified records)

## Recommended Aquarist Fields

- `temperament`, `diet`, `care_level`
- `temperature_min_c`, `temperature_max_c`
- `ph_min`, `ph_max`
- `hardness_min_dgh`, `hardness_max_dgh`
- `adult_size_min_cm`, `adult_size_max_cm`
- `lifespan_min_years`, `lifespan_max_years`
- `minimum_tank_size_liters`
- `tank_level`, `schooling_behavior`
- `description`, `care_notes`, `feeding_notes`
- `compatibility_notes`, `avoid_with_notes`

## Image Licensing Rules

Only use images with CC BY, CC BY-SA, CC0, or Public Domain license.

Good starting sources: Wikimedia Commons, iNaturalist (CC-licensed photos).

Store: `image_url`, `image_license`, `image_source_url`, `image_credit` if attribution text is required by the license.

If no licensed image is available: leave `image_url` null. Do not use unlicensed images.

## Verification Status Rules

| Status | Meaning |
| --- | --- |
| `verified` | Key fields confirmed by at least one reputable source. At least one source URL provided. |
| `partially_verified` | Some fields sourced, others still unknown or missing. |
| `draft` | Data not yet reviewed. Do not use for compatibility checks. |
| `needs_review` | Previously verified but flagged for re-check. |

Minimum fields required for verified status:

`common_name`, `scientific_name`, `water_type`, `adult_size_max_cm`, `temperature_min_c`, `temperature_max_c`, `ph_min`, `ph_max`, `diet`, `temperament`, `care_level`, `care_notes`, at least one source entry with `source_type = 'scientific_database'` or `source_type = 'care_guide'` and a real `source_url`.

## Batch Import Workflow

1. Research each species from FishBase and Seriously Fish.
2. Fill a JSON file matching `species_dataset_schema.json`.
3. Run validator: `node scripts/validate-species-dataset.mjs your-species-file.json`
4. Fix all validation errors.
5. Run dry-run: `node scripts/import-species-batch.mjs your-species-file.json --dry-run`
6. Review dry-run output.
7. Run actual import: `node scripts/import-species-batch.mjs your-species-file.json --apply`
8. Verify records in Supabase dashboard.
9. Test in app. Library loads new species automatically via pagination. No app code changes needed.

## Scaling Toward 10,000 Species

- Import 100-500 records at a time.
- Verify quality of each batch before the next.
- Do not rush. 200 verified records are better than 10,000 draft records.
- The app is already built for large-scale pagination. No UI changes needed for more records.

## Future Schema Enhancements (Not Yet in Schema)

These fields are useful but not currently in the `fish_species` table. Add them in a future migration when data is available:

- `breeding_notes TEXT`
- `disease_sensitivity TEXT`
- `image_credit TEXT` (currently expressed via `image_license` + `image_source_url`)

## App Behavior

- Library loads via server-side pagination, 25 records per page.
- A-Z alphabet filter allows browsing by first letter.
- Search and filters run as Supabase queries. No local filtering of full dataset.
- New species appear in the app as soon as they are imported to Supabase. No app release needed.

## Sample Dataset

`sample_species_dataset.json` contains three sample records copied from existing seed data only. It is for testing `validate-species-dataset.mjs` and `import-species-batch.mjs` format behavior. Do not use it as a real import source.
