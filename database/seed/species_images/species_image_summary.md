# Species Image Summary - Phase 21D-4

> Generated: 2026-05-28  
> Phase: 21D-4 (Fast local image completion with generated placeholder PNGs)

## Overall Status

| | Count | % |
|---|---:|---:|
| Total species rows | 303 | 100% |
| Ready real images | **11** | **3.6%** |
| Ready generated placeholders | **292** | **96.4%** |
| Rows missing local image | **0** | **0%** |
| Needs review | **0** | **0%** |

## Phase 21D-4 Result

All 303 species image rows now have local image files:

- `ready_real_image`: verified real image metadata preserved where a local real file exists.
- `ready_ai_placeholder`: deterministic generated PNG placeholder under `generated/ai/`.

Generated placeholders are illustrative MVP assets only. They are not verified real species photographs and are labeled with `Generated Placeholder` metadata.

## Local Asset Folders

| Folder | Purpose |
|---|---|
| `generated/real/` | Verified real images already downloaded locally |
| `generated/ai/` | Generated placeholder PNGs for rows without a usable local real image |

## Import Warning

Do not run database import SQL yet. No rows have Supabase public URLs. The generated SQL file contains zero executable UPDATE statements until upload happens.

## Next Step

Upload both local folders to the `species-images` bucket, then rerun:

```txt
node scripts/species_images/generate_update_species_images_sql.js
```

Review `database/seed/species_images/update_species_images.sql` manually before running it in Supabase.
