import { OWNER_ID } from '@/constants/owner';
import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import type { DashboardSummary, FishStatus, UserFish } from '@/types';

const SUPABASE_CONFIG_ERROR =
  'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

export interface CreateUserFishInput {
  name: string;
  species_id: string | null;
  status: FishStatus;
  start_date: string;
  notes: string | null;
  custom_species_name?: string | null;
}

export interface UpdateUserFishInput {
  name: string;
  species_id: string | null;
  status: FishStatus;
  start_date: string;
  death_date: string | null;
  end_date: string | null;
  notes: string | null;
  custom_species_name?: string | null;
}

const USER_FISH_SELECT = `
  *,
  species:fish_species (*),
  current_photo:fish_photos!fk_current_photo (*)
`;

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  return supabase;
}

export async function getUserFish(): Promise<UserFish[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('user_fish')
    .select(USER_FISH_SELECT)
    .eq('owner_id', OWNER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as UserFish[];
}

export async function getUserFishById(id: string): Promise<UserFish | null> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('user_fish')
    .select(USER_FISH_SELECT)
    .eq('id', id)
    .eq('owner_id', OWNER_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserFish | null) ?? null;
}

export async function createUserFish(input: CreateUserFishInput): Promise<UserFish> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('user_fish')
    .insert({
      current_photo_id: null,
      custom_species_name: input.custom_species_name ?? null,
      name: input.name,
      notes: input.notes,
      owner_id: OWNER_ID,
      species_id: input.species_id,
      start_date: input.start_date,
      status: input.status,
    })
    .select(USER_FISH_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as UserFish;
}

export async function updateUserFish(
  id: string,
  updates: Partial<UpdateUserFishInput>,
): Promise<UserFish> {
  const client = requireSupabase();
  const { custom_species_name, ...restUpdates } = updates;

  const { data, error } = await client
    .from('user_fish')
    .update({
      ...restUpdates,
      ...(custom_species_name !== undefined && {
        custom_species_name,
      }),
    })
    .eq('id', id)
    .eq('owner_id', OWNER_ID)
    .select(USER_FISH_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as UserFish;
}

export async function getDashboardSummary(ownerId: string): Promise<DashboardSummary> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('user_fish')
    .select(`
      id,
      name,
      status,
      species_id,
      start_date,
      death_date,
      end_date,
      created_at,
      current_photo_id,
      species:fish_species(id, common_name, scientific_name),
      current_photo:fish_photos!fk_current_photo(id, photo_url, is_current)
    `)
    .eq('owner_id', ownerId);

  if (error) {
    throw error;
  }

  const fish = (data ?? []) as unknown as UserFish[];
  const activeFish = fish.filter((item) => item.status === 'alive');
  const recentlyAddedFish = [...fish]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  const validActiveFish = activeFish.filter((item) => {
    const startTime = new Date(item.start_date).getTime();
    return Number.isFinite(startTime);
  });
  const longestKeptFish =
    validActiveFish.length === 0
      ? null
      : validActiveFish.reduce((oldest, item) => {
          const oldestTime = new Date(oldest.start_date).getTime();
          const itemTime = new Date(item.start_date).getTime();
          return itemTime < oldestTime ? item : oldest;
        });

  return {
    activeFishCount: activeFish.length,
    totalFishCount: fish.length,
    uniqueSpeciesCount: new Set(fish.map((item) => item.species_id).filter(Boolean)).size,
    recentlyAddedFish,
    longestKeptFish,
    dueReminders: [],
    stalePhotoFish: [],
  };
}
