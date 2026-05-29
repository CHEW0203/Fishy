import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import type { FishPhoto } from '@/types';

const SUPABASE_CONFIG_ERROR =
  'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

/*
Required Supabase setup:
- Create storage bucket: fish-photos
- Set bucket to public, or replace public URLs with signed URLs later
- Run all database migrations 001 through 008
*/

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  return supabase;
}

export async function uploadFishPhoto(params: {
  fishId: string;
  ownerId: string;
  photoUri: string;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const client = requireSupabase();
  const storagePath = `${params.ownerId}/${params.fishId}/${Date.now()}.jpg`;
  const response = await fetch(params.photoUri);
  const blob = await response.blob();

  const { error } = await client.storage
    .from('fish-photos')
    .upload(storagePath, blob, { contentType: 'image/jpeg' });

  if (error) {
    console.error('[Fishy][photoService] uploadFishPhoto error:', error);
    throw new Error(`Photo upload failed: ${error.message ?? JSON.stringify(error)}`);
  }

  const { data } = client.storage.from('fish-photos').getPublicUrl(storagePath);

  if (!data.publicUrl) {
    throw new Error('Photo upload succeeded, but no public URL was returned.');
  }

  return {
    publicUrl: data.publicUrl,
    storagePath,
  };
}

export async function createFishPhotoEntry(input: {
  fishId: string;
  storagePath: string;
  photoUrl: string;
  note: string | null;
  isCurrent?: boolean;
}): Promise<FishPhoto> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('fish_photos')
    .insert({
      captured_at: new Date().toISOString(),
      fish_id: input.fishId,
      is_current: input.isCurrent ?? true,
      note: input.note,
      photo_url: input.photoUrl,
      storage_path: input.storagePath,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[Fishy][photoService] createFishPhotoEntry error:', error);
    throw new Error(`Fish photo record insert failed: ${error.message ?? JSON.stringify(error)}`);
  }

  return data as FishPhoto;
}

export async function setCurrentFishPhoto(fishId: string, photoId: string): Promise<void> {
  const client = requireSupabase();

  const { error: clearError } = await client
    .from('fish_photos')
    .update({ is_current: false })
    .eq('fish_id', fishId);

  if (clearError) {
    console.error('[Fishy Photo Service] step 1 failed:', clearError);
    throw new Error(
      `Could not clear old current photos: ${clearError.message ?? JSON.stringify(clearError)}`,
    );
  }

  const { error: photoError } = await client
    .from('fish_photos')
    .update({ is_current: true })
    .eq('id', photoId)
    .eq('fish_id', fishId);

  if (photoError) {
    console.error('[Fishy Photo Service] step 2 failed:', photoError);
    throw new Error(
      `Could not set new current photo: ${photoError.message ?? JSON.stringify(photoError)}`,
    );
  }

  const { error: fishError } = await client
    .from('user_fish')
    .update({ current_photo_id: photoId })
    .eq('id', fishId);

  if (fishError) {
    console.error('[Fishy Photo Service] step 3 failed:', fishError);
    throw new Error(
      `Could not update fish current photo: ${fishError.message ?? JSON.stringify(fishError)}`,
    );
  }
}

export async function getFishPhotos(fishId: string): Promise<FishPhoto[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('fish_photos')
    .select('*')
    .eq('fish_id', fishId)
    .order('captured_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as FishPhoto[];
}
