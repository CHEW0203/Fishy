# Phase 21D-3 Asset Report

Generated: 2026-05-28

## Starting Audit

| Check | Result |
|---|---:|
| CSV rows | 303 |
| Manifest objects | 303 |
| Final decision objects | 303 |
| Starting licensed_photo | 58 |
| Starting ai_placeholder_needed | 245 |
| Starting needs_review | 0 |
| Duplicate species_key | 0 |
| Licensed rows missing required metadata | 0 |
| AI placeholder rows missing prompt | 0 |

## Additional Real Image Sourcing

Web access was available. Four species-level placeholder rows were upgraded to verified Wikimedia Commons photo rows:

| species_key | Source page | License | Credit |
|---|---|---|---|
| `croaking-gourami_species` | https://commons.wikimedia.org/wiki/File:Trichopsis_vittata_(USGS).jpg | Public Domain | Howard Jelks, U.S. Geological Survey |
| `ember-tetra_species` | https://commons.wikimedia.org/wiki/File:Hyphessobrycon_amandae_(Amber_tetra).jpg | CC BY-SA 3.0 | Pascal Wolterman |
| `celestial-pearl-danio_species` | https://commons.wikimedia.org/wiki/File:Danio_Margaritatus.jpg | CC BY-SA 3.0 | Cisamarc |
| `german-blue-ram_species` | https://commons.wikimedia.org/wiki/File:Mikrogeophagus_ramirezi.jpg | CC BY-SA 3.0 | VivienneHarper |

No strain, morph, variety, or hybrid row was converted to a real photo.

## Final Decision Counts

| Final status | Count |
|---|---:|
| licensed_photo | 62 |
| ai_placeholder_needed | 241 |
| needs_review | 0 |
| total | 303 |

## Final Asset Status Counts

| Asset status | Count |
|---|---:|
| ready_real_image | 9 |
| download_failed | 53 |
| pending_ai_generation | 241 |
| ready_ai_placeholder | 0 |
| total | 303 |

## Download Attempt

Verified real images were downloaded to:

```txt
database/seed/species_images/generated/real/
```

Nine real image files currently exist locally. The remaining verified real rows are kept as `download_failed` in the final asset manifest because Wikimedia returned rate-limit responses during the download pass or the retrying command exceeded the local command window.

No real image metadata was deleted or downgraded.

## AI Placeholder Generation

AI placeholder files were not generated in this phase.

Reason:

- `OPENAI_API_KEY` was not present in the environment.
- The built-in image tool is available for interactive generation, but it is not a scriptable local batch pipeline for saving 241 deterministic project files into this repo.

The 241 AI rows remain `pending_ai_generation`. No fake AI files or URLs were created.

## Upload Readiness

Ready for upload now:

- 9 local real image files

Not ready for upload yet:

- 53 verified real rows still need local file download
- 241 AI placeholder rows still need generated image files

## SQL Import Readiness

`update_species_images.sql` was generated with zero executable UPDATE statements because no asset row has a real Supabase `public_url`.

Do not run SQL yet. Upload files first, then rerun:

```txt
node scripts/species_images/generate_update_species_images_sql.js
```

## Files Created

- `final_species_image_assets.json`
- `final_species_image_assets.csv`
- `update_species_images.sql`
- `SUPABASE_UPLOAD_GUIDE.md`
- `phase21d3_asset_report.md`
- `real_image_download_report.json`
- `generated/real/`
- `generated/ai/`
- `scripts/species_images/download_verified_real_images.js`
- `scripts/species_images/upload_species_images_to_supabase.js`
- `scripts/species_images/generate_update_species_images_sql.js`
- `scripts/species_images/validate_species_image_assets.js`

## Safety Notes

- No app files were intentionally changed.
- No migrations were changed.
- No Supabase data was modified.
- No SQL was run.
- No uploads were attempted.
- No fake public URLs were created.

## Phase 21D-4 Update

Phase 21D-4 stopped slow one-by-one real photo sourcing and completed local assets with generated placeholder PNGs.

| Asset status | Count |
|---|---:|
| ready_real_image | 11 |
| ready_ai_placeholder | 292 |
| pending_ai_generation | 0 |
| download_failed | 0 |
| total | 303 |

The generated placeholder files live under:

```txt
database/seed/species_images/generated/ai/
```

Generated placeholder metadata is intentionally labeled as `Generated Placeholder`, with credit `Fishy generated placeholder`. These files are illustrative MVP assets only and are not verified real species photographs.

No Supabase upload was attempted. No SQL was run.
