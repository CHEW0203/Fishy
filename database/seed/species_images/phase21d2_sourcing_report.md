# Phase 21D-2 Species Image Sourcing Report

> Date: 2026-05-28
> Scope: Data-only species image decision finalization. No app code, migrations, seed SQL, or database rows changed.

## Starting Audit

| Check | Result |
|---|---:|
| CSV rows | 303 |
| Manifest objects | 303 |
| Duplicate `species_key` values | 0 |
| Existing licensed rows missing required fields | 0 |

## Starting Status Counts

| Status | Count |
|---|---:|
| licensed_photo | 37 |
| safe_public_source | 0 |
| needs_review | 180 |
| ai_placeholder_needed | 86 |
| not_found | 0 |

## Final Status Counts

| Status | Count |
|---|---:|
| licensed_photo | 58 |
| safe_public_source | 0 |
| needs_review | 0 |
| ai_placeholder_needed | 245 |
| not_found | 0 |

## Rows Upgraded to Licensed Photo

- `peaceful-betta_species`
- `snakehead-betta_species`
- `endlers-livebearer_species`
- `giant-sailfin-molly_species`
- `variatus-platy_species`
- `freshwater-halfbeak_species`
- `wrestling-halfbeak_species`
- `honey-gourami_species`
- `moonlight-gourami_species`
- `three-spot-gourami_species`
- `snakeskin-gourami_species`
- `silver-datnoid_species`
- `peacock-bass_species`
- `motoro-stingray_species`
- `freshwater-archerfish_species`
- `banded-archerfish_species`
- `percula-clownfish_species`
- `tomato-clownfish_species`
- `maroon-clownfish_species`
- `clarkii-clownfish_species`
- `blue-green-chromis_species`

## Rows Converted to AI Placeholder Needed

159 previously unresolved `needs_review` rows were converted to `ai_placeholder_needed` because no safe reusable real photo was verified in this phase. Existing placeholder rows remained placeholder rows.

## License Verification Summary

- New verified rows use Wikimedia Commons file metadata/API data and accepted reusable licenses only: CC BY 4.0, CC BY-SA 4.0, CC BY 3.0, CC BY-SA 3.0, CC BY 2.0, CC BY-SA 2.0, CC0, or Public Domain.
- Existing 37 verified rows were preserved and not overwritten.
- Every `licensed_photo` row has `candidate_image_url`, `source_page_url`, `image_source_name`, `license`, `credit`, `confidence = high`, and verification notes.

## Unsafe Sources Avoided

No Google Images, shop, breeder, seller, blog, forum, social media, FishBase image, Seriously Fish image, or unverified direct image URL was used.

## Phase 21D-3 Dependency

AI placeholder image files have not been generated or uploaded yet. Generate/upload the placeholder images and only then create database import SQL.
