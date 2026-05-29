import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import { getCareLevelLabel, getWaterTypeLabel } from '@/i18n/formatters';
import { getSpeciesList } from '@/services/speciesService';
import type { CareLevel, FishSpecies, WaterType } from '@/types';

const PAGE_SIZE = 25;
const CONFIG_ERROR =
  'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

function getSpeciesStableKey(item: FishSpecies): string {
  return item.id ?? `${item.common_name}-${item.scientific_name}`;
}

function mergeUniqueSpecies(existing: FishSpecies[], incoming: FishSpecies[]): FishSpecies[] {
  const seen = new Set(existing.map(getSpeciesStableKey));
  const merged = [...existing];
  for (const item of incoming) {
    const key = getSpeciesStableKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

const LETTERS = [
  'All',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

function getWaterBadgeColor(waterType: WaterType) {
  if (waterType === 'marine') {
    return '#0EADAD';
  }

  if (waterType === 'brackish') {
    return colors.statusMissing;
  }

  return colors.primary;
}

function getCareBadgeColor(careLevel: CareLevel) {
  if (careLevel === 'advanced') {
    return colors.compatDanger;
  }

  if (careLevel === 'intermediate') {
    return colors.compatCaution;
  }

  return colors.compatSafe;
}

export default function LibraryScreen() {
  const { t } = useI18n();
  const tRef = useRef(t);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    tRef.current = t;
  });

  const waterTypeFilters: { label: string; value: WaterType | null }[] = [
    { label: t('common.all'), value: null },
    { label: getWaterTypeLabel('freshwater', t), value: 'freshwater' },
    { label: getWaterTypeLabel('marine', t), value: 'marine' },
  ];

  const careLevelFilters: { label: string; value: CareLevel | null }[] = [
    { label: t('common.all'), value: null },
    { label: getCareLevelLabel('beginner', t), value: 'beginner' },
    { label: getCareLevelLabel('intermediate', t), value: 'intermediate' },
    { label: getCareLevelLabel('advanced', t), value: 'advanced' },
  ];

  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [waterTypeFilter, setWaterTypeFilter] = useState<WaterType | null>(null);
  const [careLevelFilter, setCareLevelFilter] = useState<CareLevel | null>(null);
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSpecies = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const results = await getSpeciesList({
        careLevel: careLevelFilter ?? undefined,
        letter: letterFilter ?? undefined,
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        waterType: waterTypeFilter ?? undefined,
      });

      setSpecies((current) =>
        page === 0 ? results : mergeUniqueSpecies(current, results),
      );
      setHasMore(results.length >= PAGE_SIZE);
    } catch (err) {
      console.error('[Fishy][Library] load error:', err);
      const message = err instanceof Error ? err.message : '';
      setError(message === CONFIG_ERROR ? CONFIG_ERROR : tRef.current('library.error'));
      if (page === 0) {
        setSpecies([]);
      }
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [careLevelFilter, debouncedSearch, letterFilter, page, waterTypeFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSpecies();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadSpecies]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
    setHasMore(true);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  }, []);

  const handleWaterTypeFilter = useCallback((value: WaterType | null) => {
    setWaterTypeFilter(value);
    setPage(0);
    setHasMore(true);
  }, []);

  const handleCareLevelFilter = useCallback((value: CareLevel | null) => {
    setCareLevelFilter(value);
    setPage(0);
    setHasMore(true);
  }, []);

  const handleLetterFilter = useCallback((value: string) => {
    setLetterFilter(value === 'All' ? null : value);
    setPage(0);
    setHasMore(true);
  }, []);

  const handleRetry = useCallback(() => {
    setPage(0);
    setHasMore(true);
    loadSpecies();
  }, [loadSpecies]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && !error) {
      setPage((current) => current + 1);
    }
  }, [error, hasMore, loading]);

  const renderFilterChip = useCallback(
    <T extends string | null>(
      option: { label: string; value: T },
      selectedValue: T,
      onSelect: (value: T) => void,
    ) => {
      const selected = option.value === selectedValue;
      const isLetterChip = typeof option.value === 'string' && LETTERS.includes(option.value);

      return (
        <TouchableOpacity
          key={`${String(option.value ?? 'all')}`}
          style={[
            styles.filterChip,
            isLetterChip && styles.letterChip,
            option.value === 'All' && isLetterChip && styles.letterAllChip,
            selected && styles.filterChipSelected,
          ]}
          onPress={() => onSelect(option.value)}
          activeOpacity={0.85}
        >
          <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [],
  );

  const renderSpeciesCard = useCallback(({ item }: { item: FishSpecies }) => {
    return (
      <TouchableOpacity
        style={styles.speciesCard}
        onPress={() => router.push({ pathname: '/(tabs)/library/[id]', params: { id: item.id } })}
        activeOpacity={0.85}
      >
        {item.thumbnail_url ? (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.cardThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardThumbnailPlaceholder}>
            <Ionicons name="fish-outline" size={28} color={colors.primary} />
          </View>
        )}
        <View style={styles.speciesInfo}>
          <Text style={styles.commonName} numberOfLines={1}>
            {item.common_name}
          </Text>
          <Text style={styles.scientificName} numberOfLines={1}>
            {item.scientific_name}
          </Text>
          <View style={styles.verificationRow}>
            {item.verification_status === 'verified' && (
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.compatSafe} />
            )}
            <Text
              style={[
                styles.verificationText,
                item.verification_status === 'verified'
                  ? styles.verificationTextVerified
                  : styles.verificationTextReview,
              ]}
            >
              {item.verification_status === 'verified' ? t('library.researchVerified') : t('library.dataInReview')}
            </Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: getWaterBadgeColor(item.water_type) }]}>
              <Text style={styles.badgeText}>{getWaterTypeLabel(item.water_type, t)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getCareBadgeColor(item.care_level) }]}>
              <Text style={styles.badgeText}>{getCareLevelLabel(item.care_level, t)}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  }, [t]);

  const showInitialLoading = loading && species.length === 0;
  const showError = !!error && species.length === 0;
  const showEmpty = !loading && !error && species.length === 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('library.title')} subtitle={t('library.subtitle')} />
      <FlatList
        data={showInitialLoading || showError ? [] : species}
        renderItem={renderSpeciesCard}
        keyExtractor={(item) => getSpeciesStableKey(item)}
        keyboardShouldPersistTaps="handled"
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.searchSection}>
            <TextInput
              value={search}
              onChangeText={handleSearchChange}
              placeholder={t('library.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />

            <Text style={styles.filterLabel}>{t('library.waterType')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {waterTypeFilters.map((option) =>
                renderFilterChip(option, waterTypeFilter, handleWaterTypeFilter),
              )}
            </ScrollView>

            <Text style={styles.filterLabel}>{t('library.careLevel')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {careLevelFilters.map((option) =>
                renderFilterChip(option, careLevelFilter, handleCareLevelFilter),
              )}
            </ScrollView>

            <Text style={styles.filterLabel}>{t('library.alphabetical')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {LETTERS.map((letter) =>
                renderFilterChip(
                  { label: letter === 'All' ? t('common.all') : letter, value: letter },
                  letterFilter ?? 'All',
                  handleLetterFilter,
                ),
              )}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.stateContainer}>
            {showInitialLoading && (
              <>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.stateText}>{t('library.loading')}</Text>
              </>
            )}
            {showError && (
              <>
                <Text style={styles.errorText}>{error}</Text>
                {error !== CONFIG_ERROR && (
                  <LiquidGlassButton
                    title={t('common.retry')}
                    onPress={handleRetry}
                    variant="primary"
                    size="md"
                    fullWidth={false}
                    style={{ marginTop: 14 }}
                  />
                )}
              </>
            )}
            {showEmpty && (
              <>
                <Ionicons name="fish-outline" size={44} color={colors.primary} style={{ marginBottom: 14 }} />
                <Text style={styles.emptyTitle}>{t('library.emptyTitle')}</Text>
                <Text style={styles.emptySubtitle}>{t('library.emptySubtitle')}</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          loading && species.length > 0 ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardThumbnailPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 12,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  commonName: {
    color: '#0B2D5A',
    fontSize: 16,
    fontWeight: '700',
  },
  cardThumbnail: {
    borderRadius: 12,
    height: 76,
    width: 76,
  },
  container: {
    backgroundColor: colors.aquariumMist,
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderColor: 'rgba(0,119,182,0.22)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  filterRow: {
    gap: 8,
    paddingRight: 20,
    paddingTop: 8,
  },
  filterLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
  },
  footerLoading: {
    paddingVertical: 16,
  },
  letterAllChip: {
    width: 48,
  },
  letterChip: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: 36,
  },
  scientificName: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderColor: 'rgba(0, 119, 182, 0.20)',
    borderRadius: 14,
    borderWidth: 1.5,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  searchSection: {
    marginBottom: 14,
  },
  speciesInfo: {
    flex: 1,
    minWidth: 0,
  },
  speciesCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 119, 182, 0.10)',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 12,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  stateContainer: {
    alignItems: 'center',
    minHeight: 240,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  verificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 6,
  },
  verificationText: {
    fontSize: 12,
  },
  verificationTextReview: {
    color: colors.textMuted,
  },
  verificationTextVerified: {
    color: colors.compatSafe,
  },
});
