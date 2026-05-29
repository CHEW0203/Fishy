# Phase 21D-5 Upload Report

Generated: 2026-05-28

## Upload Result

Upload tooling has been updated again to avoid the Node upload path on Windows. The upload step should now use `scripts/species_images/upload_species_images_to_supabase.py`, a sequential Python standard-library REST uploader.

The previous Node uploader still crashed on Windows with a Node/libuv assertion even after concurrency was reduced to 1, so the upload path has been moved out of Node entirely.

Required:

- `EXPO_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional `SPECIES_UPLOAD_DELAY_MS=250`
- optional `SPECIES_UPLOAD_LIMIT=3` for a small test batch

The upload script now writes durable progress after each successful row:

- `final_species_image_assets_uploaded.json`
- `python_upload_report.json`
- `python_upload_progress.json`

## Counts

- Local asset rows: 303
- Ready real images: 11
- Ready AI placeholders: 292
- Successful uploads: 0
- Failed uploads: 0
- SQL update count: 0

## Validation

Pre-upload local asset validation passed:

- 303 final asset rows
- no duplicate `species_key`
- every row has `local_file_path`
- every local file exists and is non-empty
- ready image counts total 303

## Next Manual SQL Step

After credentials are set locally, rerun the upload script, then generate SQL:

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
$env:SPECIES_UPLOAD_DELAY_MS="250"
py scripts/species_images/upload_species_images_to_supabase.py
node scripts/species_images/generate_update_species_images_sql.js
node scripts/species_images/validate_species_image_assets.js
```

If using the app's existing public URL variable instead:

```powershell
$env:EXPO_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
$env:SPECIES_UPLOAD_DELAY_MS="250"
```

For a small test batch:

```powershell
$env:SPECIES_UPLOAD_LIMIT="3"
py scripts/species_images/upload_species_images_to_supabase.py
```

Remove `SPECIES_UPLOAD_LIMIT` for the full upload.

If the upload is interrupted or crashes, run the same upload command again. It resumes from `python_upload_progress.json` and `final_species_image_assets_uploaded.json`.

WARNING: Do not run `database/seed/species_images/update_species_images.sql` before manually reviewing all generated `UPDATE` statements.
