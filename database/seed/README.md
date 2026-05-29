# Fishy Database Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com and create a new project.
2. Copy your Project URL and anon key from Project Settings > API.
3. Open `.env.local` in the project root and replace the placeholder values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-real-anon-key-here
```

## Step 2: Run Migrations in Order

Open the Supabase SQL Editor (project dashboard > SQL Editor > New Query).

Run each migration file in order. Copy/paste the SQL content and click Run.

1. `database/migrations/001_create_fish_categories.sql`
2. `database/migrations/002_create_fish_species.sql`
3. `database/migrations/003_create_fish_species_sources.sql`
4. `database/migrations/004_create_user_fish.sql`
5. `database/migrations/005_create_fish_photos.sql`
6. `database/migrations/006_create_reminders.sql`
7. `database/migrations/007_create_compatibility_rules.sql`
8. `database/migrations/008_create_indexes.sql`

## Step 3: Run Seed Data

After all migrations complete, run in order:

1. `database/seed/categories.sql`
2. `database/seed/species_seed.sql`

## Step 4: Create Storage Buckets

In the Supabase dashboard, go to Storage > New Bucket:

1. Bucket name: `fish-photos` - Toggle ON "Public bucket" for MVP
2. Bucket name: `species-images` - Toggle ON "Public bucket"

For MVP photo upload with the anon key, also run these storage policies in
Supabase SQL Editor if `npm run test:supabase` reports that upload is blocked:

```sql
DROP POLICY IF EXISTS "fish_photos_public_read" ON storage.objects;
CREATE POLICY "fish_photos_public_read"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'fish-photos');

DROP POLICY IF EXISTS "fish_photos_anon_upload" ON storage.objects;
CREATE POLICY "fish_photos_anon_upload"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'fish-photos');

DROP POLICY IF EXISTS "fish_photos_anon_update" ON storage.objects;
CREATE POLICY "fish_photos_anon_update"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'fish-photos')
WITH CHECK (bucket_id = 'fish-photos');

DROP POLICY IF EXISTS "fish_photos_anon_delete" ON storage.objects;
CREATE POLICY "fish_photos_anon_delete"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'fish-photos');
```

## Step 5: Test Connection

From the project root, run:

```bash
npm run test:supabase
```

A success message means your credentials are correct and Supabase is reachable.

## Adding More Species

All species data must come from verified sources:

- Primary: FishBase (fishbase.se) and Seriously Fish (seriouslyfish.com)
- Secondary (confirmation only): AquariumCoop, LiveAquaria

Rules:

- Every field value must have a real source.
- Unknown fields must be set to `NULL` - never invent values.
- Every species must have at least one entry in `fish_species_sources`.
- Do not mark as verified unless all minimum fields are sourced.
- AI-generated data must be marked `draft` and reviewed before use.

Minimum fields for verified status:

`common_name`, `scientific_name`, `water_type`, `adult_size_max_cm`,
`temperature_min_c`, `temperature_max_c`, `ph_min`, `ph_max`,
`diet`, `temperament`, `care_level`, `care_notes`,
at least one source entry with `source_type = 'scientific_database'` or `source_type = 'care_guide'`.

See [SPECIES_DATA_GUIDE.md](SPECIES_DATA_GUIDE.md) for the full data workflow,
trusted sources list, image licensing rules, and batch import instructions.

## Large Species Library Import Workflow

### Overview

This app is designed to scale to thousands of verified fish species. Do NOT manually type species data or use AI to generate facts. All species data must come from verified, reputable sources.

### Trusted Sources

- Primary: FishBase (fishbase.se) - scientific names, sizes, temperature, pH, ecology
- Primary: Seriously Fish (seriouslyfish.com) - aquarium care, husbandry, tank parameters
- Secondary (confirmation only): AquariumCoop, LiveAquaria

### Step-by-Step Import Process

1. **Research** each species from the trusted sources above.
2. **Fill the import template** (`database/seed/species_import_template.csv`) with verified data.
   - Include source URLs for every factual group.
   - Use `null` or leave blank for any unknown fields - never guess.
   - Set `verification_status`:
     - `verified` - all minimum fields are sourced from a reputable source
     - `partially_verified` - some fields sourced, others still unknown
     - `draft` - data not yet reviewed (do not use for compatibility checks)
     - `needs_review` - flagged for re-check
   - Set `confidence_level`: `high`, `medium`, `low`, or `unknown`.
3. **Fill the sources template** (`database/seed/species_sources_import_template.csv`) with one row per source per species.
4. **Add `image_url` only** if the image license is CC BY, CC BY-SA, CC0, or Public Domain. Include `image_license` and `image_source_url`.
5. **Convert CSV to JSON** (or prepare a JSON file directly) matching the `fish_species` field names.
6. **Run dry-run** to validate:

```bash
node scripts/import-species-data.mjs path/to/species.json --dry-run
```

7. Review the dry-run output. Fix any skipped rows.
8. Run actual import:

```bash
node scripts/import-species-data.mjs path/to/species.json
```

9. Verify in the Supabase dashboard that the records are correct.

The app will load new species automatically via pagination and infinite scroll - no app code changes needed.

### Important Rules

- Do NOT use AI to generate species facts. AI data must be marked draft and reviewed manually.
- Do NOT invent pH, temperature, size, or compatibility data.
- Do NOT use copyrighted images without license verification.
- Unknown fields must be null - never left as a guess.
