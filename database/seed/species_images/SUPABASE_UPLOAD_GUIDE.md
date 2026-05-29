# Supabase Species Image Upload Guide

Phase 21D-4 completes local files for all 303 species image rows. Do not upload or run SQL until you have reviewed the assets and confirmed the Supabase project settings.

## Recommended Bucket

Use a public Supabase Storage bucket named:

```txt
species-images
```

Recommended paths:

```txt
real/<species_key>.<ext>
ai/<species_key>.png
```

Examples:

```txt
real/betta_species.jpg
ai/halfmoon-betta_strain.png
```

## Why Re-host Wikimedia Images

Re-hosting verified Wikimedia images in Supabase is preferred because:

- the app controls image availability and caching behavior
- direct hotlinking can be rate-limited or break if source paths change
- Supabase paths stay stable for the Fishy Library
- license, credit, and source-page metadata can still be preserved in database fields

Do not remove attribution. Keep:

- `image_license`
- `image_source_url`
- `credit`
- notes in the manifest/report

## Manual Bucket Setup

In Supabase:

1. Open Storage.
2. Create a bucket named `species-images`.
3. Make the bucket public for read access.
4. Keep write access restricted to service-role/admin tooling only.

## Manual Upload Flow

Upload local files from:

```txt
database/seed/species_images/generated/real/
database/seed/species_images/generated/ai/
```

Use these destination folders:

```txt
species-images/real/
species-images/ai/
```

After upload, each public URL should look like:

```txt
https://<project-ref>.supabase.co/storage/v1/object/public/species-images/real/<species_key>.<ext>
https://<project-ref>.supabase.co/storage/v1/object/public/species-images/ai/<species_key>.png
```

Do not write example URLs into `final_species_image_assets.json`. Only add real public URLs after upload.

Upload order:

1. Upload verified real image files from `generated/real/` to `species-images/real/`.
2. Upload generated placeholder PNG files from `generated/ai/` to `species-images/ai/`.
3. Confirm public URLs resolve in the browser.
4. Rerun the SQL generator after the manifest has real `public_url` values.

Generated placeholder PNGs are illustrative MVP assets only. Keep their metadata as:

```txt
image_license = Generated Placeholder
image_source_url = Generated Placeholder
credit = Fishy generated placeholder
```

## Windows-Safe Python Upload Script

Use the Python REST uploader on Windows. It avoids the Node upload path that can crash in Node/libuv on Windows during this workload.

```txt
py scripts/species_images/upload_species_images_to_supabase.py
```

It requires:

```txt
EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

The service role key must stay local and must never be committed or pasted into source files.

Windows-safe PowerShell setup example:

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
$env:SPECIES_UPLOAD_DELAY_MS="250"
py scripts/species_images/upload_species_images_to_supabase.py
```

If you prefer the Expo public URL variable already used by the app:

```powershell
$env:EXPO_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
$env:SPECIES_UPLOAD_DELAY_MS="250"
py scripts/species_images/upload_species_images_to_supabase.py
```

For a small test batch:

```powershell
$env:SPECIES_UPLOAD_LIMIT="3"
py scripts/species_images/upload_species_images_to_supabase.py
```

The script:

- reads `database/seed/species_images/final_species_image_assets.json`
- checks for the `species-images` bucket and creates it as public if it is missing and the service role key permits it
- uploads sequentially only
- supports `SPECIES_UPLOAD_DELAY_MS`, defaulting to `250`
- supports optional `SPECIES_UPLOAD_LIMIT` for a test batch
- resumes from `database/seed/species_images/python_upload_progress.json` and `database/seed/species_images/final_species_image_assets_uploaded.json`
- skips rows that already have a real `public_url`
- writes progress immediately after each successful upload
- uploads local real files under `generated/real/`
- uploads local placeholder PNG files under `generated/ai/`
- uses each row's `storage_path`, such as `real/<species_key>.<ext>` or `ai/<species_key>.png`
- uses `upsert: true`
- continues after per-file upload failures
- writes `database/seed/species_images/python_upload_report.json`
- writes `database/seed/species_images/final_species_image_assets_uploaded.json`
- writes `database/seed/species_images/python_upload_progress.json`

If interrupted or crashed, run the same command again. The script resumes from saved progress and uploads only rows still missing `public_url`.

Recommended validation before and after upload:

```txt
node scripts/species_images/validate_species_image_assets.js
```

The older Node helper remains in the repo for reference, but Windows upload should use the Python REST uploader.

## SQL Generation After Upload

After real public URLs exist, run:

```txt
node scripts/species_images/generate_update_species_images_sql.js
```

The generator writes:

```txt
database/seed/species_images/update_species_images.sql
```

Review the SQL manually before running it in Supabase. Do not run it automatically.
