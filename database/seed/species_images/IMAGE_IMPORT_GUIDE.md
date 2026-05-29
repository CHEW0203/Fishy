# IMAGE_IMPORT_GUIDE.md

## Fishy Species Image Import Guide
### Phase 21C → Phase 21D

---

## 1. Purpose of This Checklist

This folder contains a complete image checklist and manifest for all ~303 fish species entries in the Fishy Library seed data.

The purpose is to:

- Track which species have a safe, verified, licensable image.
- Record where each image comes from and what license covers it.
- Flag which species need human review before an image URL is added.
- Mark which species (especially selectively bred strains, varieties, and morphs) are best represented by an AI-generated placeholder rather than a real photo.

---

## 2. Why Phase 21C Does NOT Directly Import Images

Phase 21C is a **checklist and planning phase only**.

No image URLs are written to the `fish_species` database table in this phase.

Reasons:

- Image licensing must be verified before storing any URL.
- Randomly hotlinking shop, blog, forum, or unknown images would create legal and copyright risks.
- Strain/variety/morph photos are almost always copyrighted breeder or shop photos that cannot be reused without permission.
- AI-generated placeholders must be labeled and stored correctly, not confused with real species photos.
- All image decisions should be reviewed by a human before committing to the database.

---

## 3. Safe Image Source Rules

Only use images from these categories:

### Acceptable Sources

1. **Wikimedia Commons** — images with explicit CC BY, CC BY-SA, CC0, or Public Domain licenses.
2. **iNaturalist** — images with CC-licensed observations (check each image individually).
3. **Other clearly licensed open repositories** — only if the license is explicitly stated on the source page.

### Not Acceptable Sources

- Google Image Search results (no license verification).
- Aquarium shop product photos (copyrighted by the shop).
- Aquarium forum user photos (usually copyrighted by the poster unless stated otherwise).
- Blog articles or care guides (usually copyrighted).
- FishBase and Seriously Fish images (these sites use copyrighted photos; their data is citable but images are NOT freely licensed for reuse).
- Pinterest, Instagram, or social media images (almost always copyrighted).
- AI-generated images labeled as real species photos.
- Randomly found `.jpg` URLs with no provenance.

---

## 4. License Requirements

Every image used must have:

| Field | Required |
|---|---|
| `candidate_image_url` | Direct URL to the image file |
| `source_page_url` | URL to the page where the license is verified |
| `image_source_name` | Name of the repository (e.g., Wikimedia Commons) |
| `license` | Exact license string (e.g., CC BY-SA 4.0) |
| `credit` | Author / photographer name if required by the license |
| `confidence` | high / medium / low |

All CC BY and CC BY-SA licenses require proper attribution in the app UI.

---

## 5. How to Mark a Licensed Photo

If you have found and verified a safe, licensed image:

1. Set `image_status = licensed_photo`
2. Fill in `candidate_image_url` with the direct image URL
3. Fill in `source_page_url` with the Wikimedia Commons page URL (not the image URL)
4. Set `image_source_name = Wikimedia Commons` (or relevant source)
5. Set `license` to the exact license text from the source page
6. Set `credit` to the photographer/author name
7. Set `needs_ai_generated = false`
8. Set `confidence = high`
9. Update `notes` to describe the license source

---

## 6. How to Mark `needs_review`

Use `needs_review` when:

- You have not yet found a safe licensed image for a species-level entry.
- The species is a true species (not a strain/variety/morph) and a Wikimedia Commons photo probably exists but has not been checked.
- The source or license of a candidate image is unclear.

Steps:

1. Set `image_status = needs_review`
2. Leave `candidate_image_url` blank
3. Leave `source_page_url` blank
4. Set `license = Needs Review`
5. Set `needs_ai_generated = false` (pending review)
6. Set `confidence = low`

---

## 7. How to Mark `ai_placeholder_needed`

Use `ai_placeholder_needed` when:

- The entry is a selectively bred strain, variety, morph, or hybrid.
- No strain-specific licensed image can reasonably be found.
- The typical photos of this strain/variety are copyrighted shop or breeder photos.

Steps:

1. Set `image_status = ai_placeholder_needed`
2. Leave `candidate_image_url` blank
3. Leave `source_page_url` blank
4. Set `license = AI Placeholder Required`
5. Set `needs_ai_generated = true`
6. Set `confidence = low`

---

## 8. What AI-Generated Placeholder Means

An AI-generated placeholder:

- Is a synthetic image created by an AI model (e.g., Stable Diffusion, DALL-E, Midjourney).
- Is intended as a temporary visual reference only.
- **Must NOT be labeled as a verified real species photo**.
- Must be clearly marked in the database with `image_license = AI Generated Placeholder` or similar.
- Must be stored in a Supabase `species-images` bucket sub-folder (e.g., `ai-placeholders/`) so it is clearly separated from real licensed photos.

AI placeholders are useful for:

- Selectively bred strains and varieties that have no openly licensed species-specific photo.
- Showing a rough visual impression in the Library until a real licensed photo is sourced.

AI placeholders are NOT appropriate for:

- Species-level entries where a Wikimedia Commons licensed photo exists.
- Any context where the image will be presented as a verified photograph of the real fish.

---

## 9. Why AI Placeholders Must Not Be Presented as Verified Real Species Photos

**Critical rule:**

If a user sees a species photo in the Library, they trust it shows the actual fish.

An AI-generated image of, say, a "Full Red Guppy" may not match the true visual standard expected by breeders and enthusiasts.

Using an AI placeholder without labeling it could:

- Mislead users about the fish's appearance.
- Damage the app's credibility as a research-backed fish library.
- Cause misidentification when users are selecting species for their collection.

Therefore:

- All AI placeholder images must be labeled in the UI or metadata as "Illustrative placeholder — not a verified species photo."
- In the database, `image_license` should be set to `AI Generated Placeholder` for these images.
- In Phase 21D, a separate import flag should be used to distinguish real licensed photos from AI placeholders.

---

## 10. How Phase 21D Should Import Approved Image URLs

Phase 21D should:

1. Review this `species_image_checklist.csv` manually or programmatically.
2. For rows with `image_status = licensed_photo` and verified `candidate_image_url`:
   - Optionally download and re-host in Supabase `species-images` bucket for reliability.
   - Run an UPDATE SQL statement setting `image_url`, `thumbnail_url`, `image_license`, `image_source_url`.
3. For rows with `image_status = ai_placeholder_needed`:
   - Generate the AI image in a separate tool.
   - Upload to Supabase `species-images/ai-placeholders/` subfolder.
   - Set `image_url` to the Supabase storage URL.
   - Set `image_license = AI Generated Placeholder`.
   - Set `image_source_url` to empty or a note.
4. Do NOT bulk-update all rows without individual review.
5. Do NOT import any URL that was fabricated or unverified.

---

## 11. Example SQL Update Strategy (for Phase 21D Reference Only — Do NOT Run Now)

```sql
-- Example: update a single verified species image
-- Do NOT run this in Phase 21C.
UPDATE fish_species
SET
  image_url = 'https://upload.wikimedia.org/wikipedia/commons/example.jpg',
  thumbnail_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/example.jpg/300px-example.jpg',
  image_license = 'CC BY-SA 4.0',
  image_source_url = 'https://commons.wikimedia.org/wiki/File:Example.jpg'
WHERE common_name = 'Betta' AND entry_type = 'species';
```

Note: In production, prefer uploading images to Supabase Storage and using the resulting storage URL rather than hotlinking Wikimedia Commons directly.

---

## 12. Warnings

### DO NOT:
- Use random Google Image URLs.
- Hotlink aquarium shop, blog, or forum photos.
- Fabricate license or credit information.
- Modify scientific names.
- Assume FishBase or Seriously Fish images are freely reusable (they are NOT).
- Mark a row as `licensed_photo` without verifying the actual license on the source page.
- Upload AI-generated images to the `species-images/real/` or equivalent folder.
- Mix AI placeholders with real licensed photos without clear separation.

### DO:
- Verify every license on the actual source page before marking `licensed_photo`.
- Include proper attribution for CC BY and CC BY-SA images.
- Store AI placeholders in a clearly named separate folder.
- Label AI placeholder images clearly in the app UI.
- Maintain this checklist as a living document — update rows as images are found and verified.
- Document any special notes (CITES status, captive-bred preference, etc.) in the `notes` column.

---

*Guide created: Phase 21C — 2026-05-28*
*This file must not be deleted. It is the governance document for all species image imports.*
