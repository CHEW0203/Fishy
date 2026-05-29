/*
  Fishy manual maintenance script: clear local-user test fish.

  What this script does:
  - Clears development/test collection data for owner_id = 'local-user'.
  - Removes matching user_fish rows and their linked fish_photos/reminders.
  - Breaks the user_fish.current_photo_id -> fish_photos.id circular FK first.

  What this script does NOT touch:
  - fish_species
  - fish_species_sources
  - fish_categories
  - compatibility_rules
  - Any other library/reference data
  - Supabase Storage files

  How to run:
  1. Open Supabase Dashboard -> SQL Editor.
  2. Run the pre-check SELECT queries below first and verify the counts.
  3. Paste/run the transaction block only when the counts are expected.

  Warning:
  Run the pre-checks first. This is intended for manual use before deployment.
*/

/*
  Pre-check queries. Run these before executing the transaction.

  SELECT count(*) FROM user_fish WHERE owner_id = 'local-user';
  SELECT count(*) FROM fish_photos WHERE fish_id IN (SELECT id FROM user_fish WHERE owner_id = 'local-user');
  SELECT count(*) FROM reminders WHERE fish_id IN (SELECT id FROM user_fish WHERE owner_id = 'local-user');
*/

/*
  Supabase Storage manual cleanup:
  - SQL cannot delete Storage files.
  - Fish photos were uploaded to bucket: fish-photos.
  - Path pattern: fish-photos/local-user/<fish_id>/<timestamp>.jpg
  - To clean up, go to Supabase Dashboard -> Storage -> fish-photos and delete the local-user/ folder manually.
*/

BEGIN;

-- Break the circular FK from user_fish.current_photo_id to fish_photos.id before deleting photos.
UPDATE user_fish
SET current_photo_id = NULL
WHERE owner_id = 'local-user';

-- Remove reminders linked to local-user fish before deleting the fish records.
DELETE FROM reminders
WHERE fish_id IN (
  SELECT id
  FROM user_fish
  WHERE owner_id = 'local-user'
);

-- Remove photo database rows linked to local-user fish; this does not delete Storage objects.
DELETE FROM fish_photos
WHERE fish_id IN (
  SELECT id
  FROM user_fish
  WHERE owner_id = 'local-user'
);

-- Remove only local-user fish records, leaving all other owners and reference data intact.
DELETE FROM user_fish
WHERE owner_id = 'local-user';

COMMIT;

/*
  Post-check queries. All should return 0 if the script ran correctly.

  SELECT count(*) FROM user_fish WHERE owner_id = 'local-user';
  SELECT count(*) FROM fish_photos fp JOIN user_fish uf ON fp.fish_id = uf.id WHERE uf.owner_id = 'local-user';
  SELECT count(*) FROM reminders WHERE owner_id = 'local-user';
*/
