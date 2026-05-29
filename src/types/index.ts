export type FishStatus = 'alive' | 'dead' | 'sold' | 'given_away' | 'missing';
export type WaterType = 'freshwater' | 'brackish' | 'marine' | 'unknown';
export type Temperament = 'peaceful' | 'semi_aggressive' | 'aggressive' | 'unknown';
export type DietType = 'carnivore' | 'herbivore' | 'omnivore' | 'unknown';
export type CareLevel = 'beginner' | 'intermediate' | 'advanced' | 'unknown';
export type VerificationStatus = 'verified' | 'partially_verified' | 'draft' | 'needs_review';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';
export type CompatibilityLevel = 'safe' | 'caution' | 'danger' | 'unknown';
export type ReminderType = 'feeding' | 'photo_update' | 'health_check' | 'water_change' | 'custom';
export type SourceType = 'scientific_database' | 'care_guide' | 'organization' | 'breeder' | 'forum_secondary' | 'other';

export interface FishCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FishSpecies {
  id: string;
  common_name: string;
  scientific_name: string;
  category_id: string | null;
  family: string | null;
  water_type: WaterType;
  origin: string | null;
  adult_size_min_cm: number | null;
  adult_size_max_cm: number | null;
  lifespan_min_years: number | null;
  lifespan_max_years: number | null;
  temperament: Temperament;
  diet: DietType;
  care_level: CareLevel;
  temperature_min_c: number | null;
  temperature_max_c: number | null;
  ph_min: number | null;
  ph_max: number | null;
  hardness_min_dgh: number | null;
  hardness_max_dgh: number | null;
  minimum_tank_size_liters: number | null;
  tank_level: string | null;
  schooling_behavior: boolean | null;
  description: string | null;
  care_notes: string | null;
  feeding_notes: string | null;
  compatibility_notes: string | null;
  avoid_with_notes: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  image_license: string | null;
  image_source_url: string | null;
  verification_status: VerificationStatus;
  confidence_level: ConfidenceLevel;
  entry_type: string;
  local_availability: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  category?: FishCategory;
}

export interface FishSpeciesSource {
  id: string;
  species_id: string;
  source_name: string;
  source_url: string | null;
  source_type: SourceType;
  fields_supported: string[] | null;
  notes: string | null;
  retrieved_at: string | null;
  created_at: string;
}

export interface UserFish {
  id: string;
  owner_id: string;
  species_id: string | null;
  name: string;
  status: FishStatus;
  start_date: string;
  death_date: string | null;
  end_date: string | null;
  current_photo_id: string | null;
  notes: string | null;
  custom_species_name: string | null;
  created_at: string;
  updated_at: string;
  species?: FishSpecies;
  current_photo?: FishPhoto;
}

export interface FishPhoto {
  id: string;
  fish_id: string;
  storage_path: string;
  photo_url: string;
  thumbnail_url: string | null;
  captured_at: string;
  note: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  owner_id: string;
  fish_id: string | null;
  species_id: string | null;
  type: ReminderType;
  title: string;
  description: string | null;
  frequency: string;
  next_due_at: string;
  last_completed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fish?: UserFish;
}

export interface CreateReminderInput {
  owner_id: string;
  fish_id?: string | null;
  species_id?: string | null;
  type: ReminderType;
  title: string;
  description?: string | null;
  frequency: string;
  next_due_at: string;
  is_active?: boolean;
}

export interface CompatibilityRule {
  id: string;
  species_a_id: string;
  species_b_id: string;
  level: CompatibilityLevel;
  reason: string;
  source_id: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface PairCompatibilityResult {
  existingFishId: string;
  existingFishName: string;
  existingSpeciesName: string;
  level: CompatibilityLevel;
  reasons: string[];
}

export interface CompatibilityResult {
  level: CompatibilityLevel;
  pairResults: PairCompatibilityResult[];
  reasons: string[];
  hasIncompleteData: boolean;
  note?: string;
}

export interface DashboardSummary {
  activeFishCount: number;
  totalFishCount: number;
  uniqueSpeciesCount: number;
  recentlyAddedFish: UserFish[];
  longestKeptFish: UserFish | null;
  dueReminders: Reminder[];
  stalePhotoFish: PhotoUpdateReminder[];
}

export interface PhotoUpdateReminder {
  fishId: string;
  fishName: string;
  lastPhotoAt: string | null;
  daysSinceLastPhoto: number;
}

export interface SpeciesListParams {
  search?: string;
  categoryId?: string;
  waterType?: WaterType;
  careLevel?: CareLevel;
  temperament?: Temperament;
  letter?: string;
  page?: number;
  pageSize?: number;
}

export interface CollectionParams {
  search?: string;
  status?: FishStatus | 'inactive';
  sortBy?: 'recent' | 'oldest' | 'name_asc' | 'name_desc' | 'longest_kept' | 'status';
  page?: number;
}

export interface ReminderCompletion {
  id: string;
  owner_id: string;
  reminder_type: string;
  fish_id: string | null;
  completed_for_date: string;
  completed_at: string;
}
