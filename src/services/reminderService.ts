import { REMINDER_DEFAULTS } from '@/constants/reminders';
import { supabase } from '@/lib/supabase/client';
import type { CreateReminderInput, PhotoUpdateReminder, Reminder } from '@/types';

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return supabase;
}

export async function getReminders(ownerId: string): Promise<Reminder[]> {
  const client = requireSupabase();
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await client
    .from('reminders')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .lte('next_due_at', oneDayFromNow.toISOString())
    .order('next_due_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load reminders: ${error.message}`);
  }

  return (data ?? []) as Reminder[];
}

export async function completeReminder(reminderId: string, frequency: string): Promise<void> {
  const client = requireSupabase();
  const now = new Date();
  const nextDue = new Date(now);

  switch (frequency) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case 'every_30_days':
      nextDue.setDate(nextDue.getDate() + 30);
      break;
    default:
      nextDue.setDate(nextDue.getDate() + 1);
  }

  const { error } = await client
    .from('reminders')
    .update({
      last_completed_at: now.toISOString(),
      next_due_at: nextDue.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', reminderId);

  if (error) {
    throw new Error(`Failed to complete reminder: ${error.message}`);
  }
}

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const client = requireSupabase();
  const { data, error } = await client.from('reminders').insert(input).select().single();

  if (error || !data) {
    throw new Error(`Failed to create reminder: ${error?.message ?? 'unknown error'}`);
  }

  return data as Reminder;
}

export async function generatePhotoUpdateReminders(
  ownerId: string,
): Promise<PhotoUpdateReminder[]> {
  const client = requireSupabase();

  const { data: aliveFish, error: fishError } = await client
    .from('user_fish')
    .select('id, name, current_photo_id')
    .eq('owner_id', ownerId)
    .eq('status', 'alive');

  if (fishError) {
    throw new Error(`Failed to load fish for photo reminders: ${fishError.message}`);
  }

  if (!aliveFish || aliveFish.length === 0) {
    return [];
  }

  const fishIds = aliveFish.map((fish) => fish.id);

  const { data: currentPhotos, error: photoError } = await client
    .from('fish_photos')
    .select('fish_id, captured_at')
    .in('fish_id', fishIds)
    .eq('is_current', true);

  if (photoError) {
    throw new Error(`Failed to load photos for reminder check: ${photoError.message}`);
  }

  // Look up recent completions — non-fatal if table doesn't exist yet before migration is run
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - REMINDER_DEFAULTS.PHOTO_UPDATE_DAYS);
  const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const dismissedFishIds = new Set<string>();

  try {
    const { data: completions, error: completionError } = await client
      .from('reminder_completions')
      .select('fish_id')
      .eq('owner_id', ownerId)
      .eq('reminder_type', 'photo_update')
      .gte('completed_for_date', thirtyDaysAgoDate);

    if (!completionError && completions) {
      for (const c of completions) {
        if (c.fish_id) dismissedFishIds.add(c.fish_id as string);
      }
    }
  } catch {
    // Non-fatal: table may not exist yet before migration 010 is run
  }

  const photoByFishId: Record<string, string> = {};
  (currentPhotos ?? []).forEach((photo) => {
    photoByFishId[photo.fish_id] = photo.captured_at;
  });

  const thresholdMs = REMINDER_DEFAULTS.PHOTO_UPDATE_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const results: PhotoUpdateReminder[] = [];

  for (const fish of aliveFish) {
    if (dismissedFishIds.has(fish.id as string)) continue;

    const lastPhotoAt = photoByFishId[fish.id] ?? null;

    if (!lastPhotoAt) {
      results.push({
        fishId: fish.id,
        fishName: fish.name,
        lastPhotoAt: null,
        daysSinceLastPhoto: 999,
      });
      continue;
    }

    const ageMs = now - new Date(lastPhotoAt).getTime();

    if (ageMs >= thresholdMs) {
      const daysSince = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      results.push({
        fishId: fish.id,
        fishName: fish.name,
        lastPhotoAt,
        daysSinceLastPhoto: daysSince,
      });
    }
  }

  return results;
}

export async function ensureGlobalReminders(ownerId: string): Promise<void> {
  const client = requireSupabase();
  const now = new Date();

  // Global reminders only apply when the user has at least one alive fish.
  // Dead, sold, given_away, and missing fish do not count.
  const { data: aliveFish, error: fishCheckError } = await client
    .from('user_fish')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('status', 'alive')
    .limit(1);

  if (!fishCheckError && (!aliveFish || aliveFish.length === 0)) {
    // No alive fish — deactivate any existing global reminders so they stop appearing.
    await client
      .from('reminders')
      .update({ is_active: false, updated_at: now.toISOString() })
      .eq('owner_id', ownerId)
      .is('fish_id', null)
      .in('type', ['feeding', 'health_check'])
      .eq('is_active', true);
    return;
  }

  const { data: existing, error } = await client
    .from('reminders')
    .select('type')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .is('fish_id', null)
    .in('type', ['feeding', 'health_check']);

  if (error) {
    return;
  }

  const existingTypes = new Set((existing ?? []).map((r: { type: string }) => r.type));

  const toCreate: CreateReminderInput[] = [];

  if (!existingTypes.has('feeding')) {
    toCreate.push({
      owner_id: ownerId,
      fish_id: null,
      type: 'feeding',
      title: 'Feeding reminder',
      description: 'Feed your fish today.',
      frequency: 'daily',
      next_due_at: now.toISOString(),
      is_active: true,
    });
  }

  if (!existingTypes.has('health_check')) {
    toCreate.push({
      owner_id: ownerId,
      fish_id: null,
      type: 'health_check',
      title: 'Health check',
      description: 'Check fish behavior, appetite, and water clarity.',
      frequency: 'weekly',
      next_due_at: now.toISOString(),
      is_active: true,
    });
  }

  if (toCreate.length === 0) return;

  await client.from('reminders').insert(toCreate);
}

export async function markPhotoReminderDone(ownerId: string, fishId: string): Promise<void> {
  const client = requireSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await client
    .from('reminder_completions')
    .upsert(
      {
        owner_id: ownerId,
        reminder_type: 'photo_update',
        fish_id: fishId,
        completed_for_date: today,
      },
      {
        onConflict: 'owner_id,reminder_type,fish_id,completed_for_date',
        ignoreDuplicates: true,
      },
    );

  if (error) {
    throw new Error(`Failed to mark photo reminder done: ${error.message}`);
  }
}
