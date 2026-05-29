import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import type { FishCategory, FishSpecies, FishSpeciesSource, SpeciesListParams } from '@/types';

const SUPABASE_CONFIG_ERROR =
  'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  return supabase;
}

export async function getSpeciesList(options: SpeciesListParams = {}): Promise<FishSpecies[]> {
  const client = requireSupabase();
  const pageSize = options.pageSize ?? 50;
  const page = options.page ?? 0;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from('fish_species')
    .select('id, common_name, scientific_name, thumbnail_url, water_type, care_level, temperament, verification_status, category_id, entry_type')
    .order('common_name', { ascending: true })
    .range(from, to);

  if (options.search?.trim()) {
    const search = options.search.trim().replaceAll('%', '\\%').replaceAll(',', '\\,');
    query = query.or(`common_name.ilike.%${search}%,scientific_name.ilike.%${search}%`);
  }

  const letter = options.letter?.trim();

  if (letter && /^[A-Za-z]$/.test(letter)) {
    query = query.ilike('common_name', `${letter}%`);
  }

  if (options.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options.waterType) {
    query = query.eq('water_type', options.waterType);
  }

  if (options.careLevel) {
    query = query.eq('care_level', options.careLevel);
  }

  if (options.temperament) {
    query = query.eq('temperament', options.temperament);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // List cards only need a narrow field set; detail screens still fetch full species rows.
  return (data ?? []) as FishSpecies[];
}

export async function getSpeciesById(id: string): Promise<FishSpecies | null> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('fish_species')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as FishSpecies | null) ?? null;
}

export async function getSpeciesSources(speciesId: string): Promise<FishSpeciesSource[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('fish_species_sources')
    .select('*')
    .eq('species_id', speciesId)
    .order('created_at', { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []) as FishSpeciesSource[];
}

export async function getCategories(): Promise<FishCategory[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('fish_categories')
    .select('id, name, slug, description')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as FishCategory[];
}
