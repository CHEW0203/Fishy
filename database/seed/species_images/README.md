# Species Image Checklist - Phase 21D-4

> **Fishy App** | Database seed folder for species image tracking  
> Created: Phase 21C - 2026-05-28 | Updated: Phase 21D-4 - 2026-05-28  
> Status: All 303 species rows have local image assets. No database import has been run.

## Files in This Folder

| File | Purpose |
|---|---|
| `species_image_checklist.csv` | Master checklist of all 303 Library species with current image status and metadata |
| `species_image_manifest.json` | Same data as array of JSON objects, suitable for programmatic review |
| `ai_placeholder_prompts.json` | Prompt metadata from the earlier placeholder planning phase |
| `ai_placeholder_generation_plan.csv` | Earlier batch-friendly placeholder generation plan |
| `final_species_image_decisions.json` | Final action list for all 303 species |
| `final_species_image_assets.json` | Final asset readiness manifest for all 303 species |
| `final_species_image_assets.csv` | CSV copy of final asset readiness manifest |
| `generated_placeholder_report.json` | Phase 21D-4 placeholder generation report |
| `final_asset_readiness_report.md` | Final local asset readiness report |
| `update_species_images.sql` | Generated SQL import file; zero UPDATE statements until public URLs exist |
| `SUPABASE_UPLOAD_GUIDE.md` | Manual Supabase Storage upload workflow |
| `phase21d3_asset_report.md` | Phase 21D-3 asset preparation report, with Phase 21D-4 update notes |
| `phase21d2_sourcing_report.md` | Phase 21D-2 audit, sourcing, and conversion report |
| `IMAGE_IMPORT_GUIDE.md` | Governance guide: safe source rules, license requirements, import strategy |
| `species_image_summary.md` | Current coverage summary |

## Current Coverage Numbers

| Metric | Count |
|---|---:|
| Total species rows | 303 |
| Ready real image rows | **11** |
| Ready generated placeholder rows | **292** |
| Rows missing local image | **0** |
| Needs review | **0** |

## What Each Asset Status Means

| Status | Meaning | Next Action |
|---|---|---|
| `ready_real_image` | Verified reusable real image with source, license, credit, and local file | Upload to `species-images/real/` |
| `ready_ai_placeholder` | Local generated PNG placeholder, clearly labeled as not a real species photograph | Upload to `species-images/ai/` |

## Critical Warnings

- Do not use Google Image URLs.
- Do not use aquarium shop product photos.
- Do not use blog/forum/social media photos without an explicit reusable license.
- FishBase and Seriously Fish images are not accepted as reusable image sources here.
- Generated placeholders must be labeled as illustrative only, never as verified species photos.
- Do not run database import SQL until uploaded Supabase public URLs exist.

## Next Step

Upload the local files, write real Supabase public URLs through the upload workflow, then rerun:

```txt
node scripts/species_images/generate_update_species_images_sql.js
```

Review the generated SQL manually before running it in Supabase.
