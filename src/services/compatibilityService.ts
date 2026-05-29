import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import type {
  CompatibilityLevel,
  CompatibilityResult,
  CompatibilityRule,
  FishSpecies,
  PairCompatibilityResult,
  UserFish,
} from '@/types';
import { extractErrorMessage } from '@/utils/errors';

const LIMITATION_NOTE =
  'Compatibility guidance is based on available species data and simple rules. Always verify with trusted aquarium sources.';

const SUPABASE_CONFIG_ERROR =
  'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

type ExistingFishForCompatibility = Pick<UserFish, 'id' | 'name' | 'species_id'> & {
  species: FishSpecies | null;
};

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  return supabase;
}

function normalizeErrorMessage(err: unknown, fallback: string) {
  return extractErrorMessage(err, fallback);
}

function rangesOverlap(min1: number, max1: number, min2: number, max2: number): boolean {
  return min1 <= max2 && min2 <= max1;
}

function partialOverlap(min1: number, max1: number, min2: number, max2: number): boolean {
  return (
    rangesOverlap(min1, max1, min2, max2) &&
    !(min1 >= min2 && max1 <= max2) &&
    !(min2 >= min1 && max2 <= max1)
  );
}

function hasCompleteTemperatureRange(species: FishSpecies) {
  return species.temperature_min_c !== null && species.temperature_max_c !== null;
}

function hasCompletePhRange(species: FishSpecies) {
  return species.ph_min !== null && species.ph_max !== null;
}

function hasIncompleteCriticalData(species: FishSpecies) {
  return (
    species.water_type === null ||
    species.water_type === 'unknown' ||
    species.temperature_min_c === null ||
    species.temperature_max_c === null ||
    species.ph_min === null ||
    species.ph_max === null ||
    species.temperament === null ||
    species.temperament === 'unknown' ||
    species.verification_status === 'draft' ||
    species.verification_status === 'needs_review'
  );
}

function aggressivePredatorVsSmallPeaceful(a: FishSpecies, b: FishSpecies): boolean {
  const smallMaxCm = 5;
  const aIsLargerAggressive = a.temperament === 'aggressive' && (a.adult_size_max_cm ?? 0) > (b.adult_size_max_cm ?? 999);
  const bIsLargerAggressive = b.temperament === 'aggressive' && (b.adult_size_max_cm ?? 0) > (a.adult_size_max_cm ?? 999);

  return (
    (aIsLargerAggressive && b.temperament === 'peaceful' && (b.adult_size_max_cm ?? 999) < smallMaxCm) ||
    (bIsLargerAggressive && a.temperament === 'peaceful' && (a.adult_size_max_cm ?? 999) < smallMaxCm)
  );
}

function semiAggressiveWithPeaceful(a: FishSpecies, b: FishSpecies): boolean {
  return (
    (a.temperament === 'semi_aggressive' && b.temperament === 'peaceful') ||
    (b.temperament === 'semi_aggressive' && a.temperament === 'peaceful')
  );
}

function largeSizeGapNotPredatory(a: FishSpecies, b: FishSpecies): boolean {
  if (a.adult_size_max_cm === null || b.adult_size_max_cm === null) {
    return false;
  }

  return Math.abs(a.adult_size_max_cm - b.adult_size_max_cm) > 20;
}

function pushUnique(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function worstLevel(levels: CompatibilityLevel[]): CompatibilityLevel {
  if (levels.includes('danger')) {
    return 'danger';
  }

  if (levels.includes('caution') || levels.includes('unknown')) {
    return 'caution';
  }

  return 'safe';
}

export function evaluatePair(
  newSpecies: FishSpecies,
  existingSpecies: FishSpecies,
): PairCompatibilityResult {
  const reasons: string[] = [];
  let level: CompatibilityLevel = 'safe';

  if (
    newSpecies.water_type !== 'unknown' &&
    existingSpecies.water_type !== 'unknown' &&
    newSpecies.water_type !== existingSpecies.water_type
  ) {
    level = 'danger';
    reasons.push(`Water type mismatch: ${newSpecies.water_type} vs ${existingSpecies.water_type}.`);
  }

  if (hasCompleteTemperatureRange(newSpecies) && hasCompleteTemperatureRange(existingSpecies)) {
    const newTempMin = newSpecies.temperature_min_c!;
    const newTempMax = newSpecies.temperature_max_c!;
    const existingTempMin = existingSpecies.temperature_min_c!;
    const existingTempMax = existingSpecies.temperature_max_c!;
    const overlaps = rangesOverlap(
      newTempMin,
      newTempMax,
      existingTempMin,
      existingTempMax,
    );

    if (!overlaps) {
      level = 'danger';
      reasons.push(
        `No temperature range overlap: ${newTempMin}-${newTempMax}C vs ${existingTempMin}-${existingTempMax}C.`,
      );
    }
  }

  if (hasCompletePhRange(newSpecies) && hasCompletePhRange(existingSpecies)) {
    const newPhMin = newSpecies.ph_min!;
    const newPhMax = newSpecies.ph_max!;
    const existingPhMin = existingSpecies.ph_min!;
    const existingPhMax = existingSpecies.ph_max!;
    const overlaps = rangesOverlap(
      newPhMin,
      newPhMax,
      existingPhMin,
      existingPhMax,
    );

    if (!overlaps) {
      level = 'danger';
      reasons.push(`No pH range overlap: ${newPhMin}-${newPhMax} vs ${existingPhMin}-${existingPhMax}.`);
    }
  }

  if (aggressivePredatorVsSmallPeaceful(newSpecies, existingSpecies)) {
    level = 'danger';
    reasons.push('Size and temperament mismatch: aggressive larger fish may prey on a small peaceful fish.');
  }

  if (level !== 'danger') {
    if (hasCompleteTemperatureRange(newSpecies) && hasCompleteTemperatureRange(existingSpecies)) {
      const newTempMin = newSpecies.temperature_min_c!;
      const newTempMax = newSpecies.temperature_max_c!;
      const existingTempMin = existingSpecies.temperature_min_c!;
      const existingTempMax = existingSpecies.temperature_max_c!;
      if (
        partialOverlap(
          newTempMin,
          newTempMax,
          existingTempMin,
          existingTempMax,
        )
      ) {
        level = 'caution';
        reasons.push('Limited temperature range overlap.');
      }
    }

    if (hasCompletePhRange(newSpecies) && hasCompletePhRange(existingSpecies)) {
      const newPhMin = newSpecies.ph_min!;
      const newPhMax = newSpecies.ph_max!;
      const existingPhMin = existingSpecies.ph_min!;
      const existingPhMax = existingSpecies.ph_max!;
      if (
        partialOverlap(
          newPhMin,
          newPhMax,
          existingPhMin,
          existingPhMax,
        )
      ) {
        level = 'caution';
        reasons.push('Limited pH range overlap.');
      }
    }

    if (semiAggressiveWithPeaceful(newSpecies, existingSpecies)) {
      level = 'caution';
      reasons.push('Semi-aggressive species with peaceful fish. Monitor carefully.');
    }

    if (largeSizeGapNotPredatory(newSpecies, existingSpecies)) {
      level = 'caution';
      reasons.push('Large adult size difference. This may cause stress even without a clear predator flag.');
    }
  }

  if (hasIncompleteCriticalData(newSpecies) || hasIncompleteCriticalData(existingSpecies)) {
    if (level === 'safe') {
      level = 'caution';
    }
    reasons.push('Species data is incomplete or not fully verified. Treat result as cautious.');
  }

  if (level === 'safe') {
    reasons.push('Available species data shows no major compatibility warning for this pair.');
  }

  return {
    existingFishId: '',
    existingFishName: '',
    existingSpeciesName: existingSpecies.common_name,
    level,
    reasons,
  };
}

async function loadNewSpecies(newSpeciesId: string): Promise<FishSpecies | null> {
  const client = requireSupabase();

  try {
    const { data, error } = await client
      .from('fish_species')
      .select('*')
      .eq('id', newSpeciesId)
      .maybeSingle();

    if (error) {
      console.error('[Fishy Compatibility] load species failed:', error.message);
      throw new Error('Species data could not be loaded. Treating as Caution.');
    }

    return (data as FishSpecies | null) ?? null;
  } catch (err) {
    if (err instanceof Error && err.message === 'Species data could not be loaded. Treating as Caution.') {
      throw err;
    }

    console.error('[Fishy Compatibility] load species failed:', normalizeErrorMessage(err, 'Unknown error'));
    throw new Error('Species data could not be loaded. Treating as Caution.');
  }
}

async function loadExistingAliveFish(ownerId: string): Promise<ExistingFishForCompatibility[]> {
  const client = requireSupabase();

  try {
    const { data, error } = await client
      .from('user_fish')
      .select(
        `
          id,
          name,
          species_id,
          species:fish_species (*)
        `,
      )
      .eq('owner_id', ownerId)
      .eq('status', 'alive');

    if (error) {
      console.error('[Fishy Compatibility] load existing fish failed:', error.message);
      throw new Error('Could not load your fish collection. Treating result as Caution.');
    }

    return (data ?? []) as unknown as ExistingFishForCompatibility[];
  } catch (err) {
    if (err instanceof Error && err.message === 'Could not load your fish collection. Treating result as Caution.') {
      throw err;
    }

    console.error('[Fishy Compatibility] load existing fish failed:', normalizeErrorMessage(err, 'Unknown error'));
    throw new Error('Could not load your fish collection. Treating result as Caution.');
  }
}

async function loadExplicitRules(
  newSpeciesId: string,
  existingSpeciesIds: string[],
): Promise<Map<string, CompatibilityRule>> {
  const client = requireSupabase();
  const rules = new Map<string, CompatibilityRule>();

  try {
    await Promise.all(
      existingSpeciesIds.map(async (existingSpeciesId) => {
        const [speciesAId, speciesBId] = [newSpeciesId, existingSpeciesId].sort();
        const { data, error } = await client
          .from('compatibility_rules')
          .select('*')
          .eq('species_a_id', speciesAId)
          .eq('species_b_id', speciesBId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          rules.set(`${speciesAId}:${speciesBId}`, data as CompatibilityRule);
        }
      }),
    );
  } catch (err) {
    console.error('[Fishy Compatibility] explicit rules query failed:', normalizeErrorMessage(err, 'Unknown error'));
    throw new Error('Compatibility check could not be completed. You can still save, but please verify compatibility manually.');
  }

  return rules;
}

export async function checkCompatibilityForNewFish(input: {
  newSpeciesId: string;
  ownerId: string;
}): Promise<CompatibilityResult> {
  const newSpecies = await loadNewSpecies(input.newSpeciesId);

  if (!newSpecies) {
    return {
      level: 'caution',
      pairResults: [],
      reasons: ['New species data could not be loaded. Please verify compatibility manually.'],
      hasIncompleteData: true,
      note: `Species data unavailable. ${LIMITATION_NOTE}`,
    };
  }

  const existingAliveFish = await loadExistingAliveFish(input.ownerId);

  if (existingAliveFish.length === 0) {
    return {
      level: 'safe',
      pairResults: [],
      reasons: [],
      hasIncompleteData: false,
      note: `No active fish to compare with yet. ${LIMITATION_NOTE}`,
    };
  }

  const comparableFish = existingAliveFish.filter((fish) => fish.species_id && fish.species);
  const existingSpeciesIds = comparableFish
    .map((fish) => fish.species_id)
    .filter((speciesId): speciesId is string => Boolean(speciesId));
  const explicitRules = await loadExplicitRules(input.newSpeciesId, existingSpeciesIds);
  const sameSpeciesCount = existingAliveFish.filter((fish) => fish.species_id === input.newSpeciesId).length;

  const pairResults: PairCompatibilityResult[] = existingAliveFish.map((fish) => {
    if (!fish.species || !fish.species_id) {
      return {
        existingFishId: fish.id,
        existingFishName: fish.name,
        existingSpeciesName: 'Unknown species',
        level: 'caution',
        reasons: [`${fish.name} has no linked species data. Please verify compatibility manually.`],
      };
    }

    const heuristicResult = evaluatePair(newSpecies, fish.species);
    const [speciesAId, speciesBId] = [input.newSpeciesId, fish.species_id].sort();
    const explicitRule = explicitRules.get(`${speciesAId}:${speciesBId}`);
    const reasons = [...heuristicResult.reasons];
    let level = heuristicResult.level;

    if (explicitRule?.verification_status === 'verified') {
      level = explicitRule.level === 'unknown' ? 'caution' : explicitRule.level;
      reasons.length = 0;
      reasons.push(explicitRule.reason);
    } else if (explicitRule) {
      pushUnique(reasons, `Unverified rule hint: ${explicitRule.reason}`);
      if (level === 'safe' && !hasIncompleteCriticalData(newSpecies) && !hasIncompleteCriticalData(fish.species)) {
        level = explicitRule.level === 'unknown' ? 'caution' : explicitRule.level;
      }
    }

    if (newSpecies.schooling_behavior === true && sameSpeciesCount === 0 && level !== 'danger') {
      level = 'caution';
      pushUnique(reasons, 'Schooling fish may need same-species companions already in the collection.');
    }

    return {
      existingFishId: fish.id,
      existingFishName: fish.name,
      existingSpeciesName: fish.species.common_name,
      level,
      reasons,
    };
  });

  const summaryReasons = pairResults.reduce<string[]>((allReasons, pairResult) => {
    pairResult.reasons.forEach((reason) => pushUnique(allReasons, reason));
    return allReasons;
  }, []);
  const overallLevel = worstLevel(pairResults.map((result) => result.level));
  const hasIncompleteData =
    hasIncompleteCriticalData(newSpecies) ||
    pairResults.some((result) =>
      result.reasons.some((reason) => reason.toLowerCase().includes('incomplete') || reason.toLowerCase().includes('no linked species')),
    );

  return {
    level: overallLevel,
    pairResults,
    reasons: summaryReasons,
    hasIncompleteData,
    note: LIMITATION_NOTE,
  };
}
