import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import {
  getCareLevelLabel,
  getConfidenceLevelLabel,
  getDietLabel,
  getTankLevelLabel,
  getTemperamentLabel,
  getWaterTypeLabel,
  localizeSpeciesText,
} from '@/i18n/formatters';
import type { TFunction } from '@/i18n';
import { getSpeciesById, getSpeciesSources } from '@/services/speciesService';
import type { CareLevel, FishSpecies, FishSpeciesSource, VerificationStatus } from '@/types';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatRange(
  min: number | null,
  max: number | null,
  unit: string,
  precision: number | null = null,
) {
  const formatValue = (value: number) => (precision === null ? `${value}` : value.toFixed(precision));

  if (min !== null && max !== null) {
    return `${formatValue(min)} - ${formatValue(max)} ${unit}`;
  }

  if (min !== null) {
    return `${formatValue(min)} ${unit}`;
  }

  if (max !== null) {
    return `${formatValue(max)} ${unit}`;
  }

  return null;
}


function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function openSourceUrl(url: string) {
  Linking.openURL(url).catch((error) => {
    console.warn('[Fishy][SpeciesDetail] Could not open source URL:', error);
  });
}

function DetailLinkRow({ label, url, t }: { label: string; url: string | null; t: TFunction }) {
  const cleanUrl = url?.trim();

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {cleanUrl ? (
        <TouchableOpacity
          onPress={() => openSourceUrl(cleanUrl)}
          style={styles.sourceLinkButton}
          activeOpacity={0.7}
        >
          <Text style={styles.sourceLinkText}>{t('speciesDetail.openSource')}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.detailValue}>{t('speciesDetail.noLink')}</Text>
      )}
    </View>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SourceCard({ source, t, formatDate }: { source: FishSpeciesSource; t: TFunction; formatDate: (v: string | null) => string | null }) {
  return (
    <View style={styles.sourceCard}>
      <Text style={styles.sourceName}>{source.source_name}</Text>
      <DetailRow label={t('speciesDetail.sourceType')} value={source.source_type} />
      <DetailLinkRow label="URL" url={source.source_url} t={t} />
      <DetailRow label={t('speciesDetail.sourceFields')} value={source.fields_supported?.join(', ') ?? null} />
      <DetailRow label={t('speciesDetail.sourceRetrieved')} value={formatDate(source.retrieved_at)} />
      <DetailRow label={t('speciesDetail.sourceNotes')} value={source.notes} />
    </View>
  );
}

export default function SpeciesDetailScreen() {
  const { t, language } = useI18n();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = getParam(rawId);
  const [species, setSpecies] = useState<FishSpecies | null>(null);
  const [sources, setSources] = useState<FishSpeciesSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function formatDate(value: string | null): string | null {
    if (!value) return null;
    const locale = language === 'zh' ? 'zh-CN' : 'en-GB';
    return new Date(value).toLocaleDateString(locale);
  }

  function formatSchooling(value: boolean | null): string {
    if (value === true) return t('speciesDetail.schoolingYes');
    if (value === false) return t('speciesDetail.schoolingNo');
    return t('speciesDetail.schoolingUnknown');
  }

  function getVerificationBadge(status: VerificationStatus) {
    if (status === 'verified') return { color: colors.compatSafe, label: t('fish.verification.verified') };
    if (status === 'partially_verified') return { color: colors.compatCaution, label: t('fish.verification.partiallyVerified') };
    if (status === 'needs_review') return { color: colors.compatDanger, label: t('fish.verification.needsReview') };
    return { color: colors.statusDead, label: t('fish.verification.draft') };
  }

  function getCareLevelBadge(level: CareLevel | undefined | null) {
    if (!level || level === 'unknown') return null;
    if (level === 'beginner') return { color: colors.compatSafe, label: getCareLevelLabel('beginner', t) };
    if (level === 'intermediate') return { color: colors.compatCaution, label: getCareLevelLabel('intermediate', t) };
    if (level === 'advanced') return { color: colors.compatDanger, label: getCareLevelLabel('advanced', t) };
    return null;
  }

  const loadSpecies = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError(t('speciesDetail.notFound'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [speciesResult, sourceResults] = await Promise.all([
        getSpeciesById(id),
        getSpeciesSources(id),
      ]);

      setSpecies(speciesResult);
      setSources(sourceResults);
    } catch (err) {
      console.error('[Fishy][SpeciesDetail] load error:', err);
      setError(t('speciesDetail.error'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSpecies();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadSpecies]);

  const verification = species ? getVerificationBadge(species.verification_status) : null;
  const careLevelBadge = species ? getCareLevelBadge(species.care_level) : null;
  const title = species?.common_name ?? t('speciesDetail.loading');
  const cmUnit = t('species.units.cm');
  const yearsUnit = t('species.units.years');
  const sizeRange = species
    ? formatRange(species.adult_size_min_cm, species.adult_size_max_cm, cmUnit)
    : null;
  const lifespanRange = species
    ? formatRange(species.lifespan_min_years, species.lifespan_max_years, yearsUnit)
    : null;
  const temperatureRange = species
    ? formatRange(species.temperature_min_c, species.temperature_max_c, '°C')
    : null;
  const phRange = species ? formatRange(species.ph_min, species.ph_max, '', 1)?.trim() ?? null : null;
  const hardnessRange = species
    ? formatRange(species.hardness_min_dgh, species.hardness_max_dgh, 'dGH')
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>{t('speciesDetail.loading')}</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSpecies}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && !species && (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>{t('speciesDetail.notFound')}</Text>
        </View>
      )}

      {!loading && !error && species && verification && (
        <ScrollView contentContainerStyle={styles.content}>
          {species.image_url && (
            <Image
              source={{ uri: species.image_url }}
              style={styles.speciesImage}
              resizeMode="cover"
            />
          )}

          {species.image_url && (species.image_license || species.image_source_url) && (
            <View style={styles.imageCreditRow}>
              {species.image_license && (
                <Text style={styles.imageCredit}>{species.image_license}</Text>
              )}
              {species.image_license && species.image_source_url && (
                <Text style={styles.imageCredit}> · </Text>
              )}
              {species.image_source_url && (
                <TouchableOpacity
                  onPress={() => openSourceUrl(species.image_source_url!)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.imageCreditLink}>{t('speciesDetail.imageSource')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Section title={t('speciesDetail.identitySection')}>
            <Text style={styles.commonName}>{species.common_name}</Text>
            <Text style={styles.scientificName}>{species.scientific_name}</Text>
            {species.category?.name && <Text style={styles.categoryBadge}>{species.category.name}</Text>}
            <View style={styles.badgeRow}>
              <Text style={[styles.badge, styles.waterBadge]}>{getWaterTypeLabel(species.water_type, t)}</Text>
              {careLevelBadge && (
                <Text style={[styles.badge, { backgroundColor: careLevelBadge.color }]}>
                  {careLevelBadge.label}
                </Text>
              )}
              <Text style={[styles.badge, { backgroundColor: verification.color }]}>
                {verification.label}
              </Text>
            </View>
            {species.confidence_level && species.confidence_level !== 'unknown' && (
              <DetailRow label={t('speciesDetail.confidence')} value={getConfidenceLevelLabel(species.confidence_level, t)} />
            )}
            <DetailRow label={t('speciesDetail.lastReviewed')} value={formatDate(species.last_reviewed_at)} />
          </Section>

          <Section title={t('speciesDetail.basicFactsSection')}>
            <DetailRow label={t('speciesDetail.waterType')} value={getWaterTypeLabel(species.water_type, t)} />
            <DetailRow label={t('speciesDetail.careLevel')} value={getCareLevelLabel(species.care_level, t)} />
            <DetailRow label={t('speciesDetail.temperament')} value={getTemperamentLabel(species.temperament, t)} />
            <DetailRow label={t('speciesDetail.diet')} value={getDietLabel(species.diet, t)} />
            <DetailRow label={t('speciesDetail.origin')} value={localizeSpeciesText(species.origin, t, language)} />
            <DetailRow label={t('speciesDetail.family')} value={species.family} />
          </Section>

          {(sizeRange || lifespanRange) && (
            <Section title={t('speciesDetail.sizeLifespanSection')}>
              <DetailRow label={t('speciesDetail.adultSize')} value={sizeRange} />
              <DetailRow label={t('speciesDetail.lifespan')} value={lifespanRange} />
            </Section>
          )}

          <Section title={t('speciesDetail.waterParamsSection')}>
            <DetailRow label={t('speciesDetail.temperature')} value={temperatureRange} />
            <DetailRow label={t('speciesDetail.pH')} value={phRange} />
            <DetailRow label={t('speciesDetail.hardness')} value={hardnessRange} />
            <DetailRow
              label={t('speciesDetail.minimumTankSize')}
              value={
                species.minimum_tank_size_liters !== null
                  ? t('speciesDetail.litersUnit', { liters: species.minimum_tank_size_liters })
                  : null
              }
            />
            <DetailRow label={t('speciesDetail.tankLevel')} value={getTankLevelLabel(species.tank_level, t)} />
            <DetailRow label={t('speciesDetail.schooling')} value={formatSchooling(species.schooling_behavior)} />
          </Section>

          {(species.description || species.care_notes || species.feeding_notes) && (
            <Section title={t('speciesDetail.careNotesSection')}>
              <DetailRow label={t('speciesDetail.description')} value={localizeSpeciesText(species.description, t, language)} />
              <DetailRow label={t('speciesDetail.careNotes')} value={localizeSpeciesText(species.care_notes, t, language)} />
              <DetailRow label={t('speciesDetail.feedingNotes')} value={localizeSpeciesText(species.feeding_notes, t, language)} />
            </Section>
          )}

          {(species.compatibility_notes || species.avoid_with_notes) && (
            <Section title={t('speciesDetail.compatibilitySection')}>
              <DetailRow label={t('speciesDetail.compatibilityNotes')} value={localizeSpeciesText(species.compatibility_notes, t, language)} />
              <DetailRow label={t('speciesDetail.avoidWithNotes')} value={localizeSpeciesText(species.avoid_with_notes, t, language)} />
            </Section>
          )}

          {(species.image_url || species.thumbnail_url || species.image_license || species.image_source_url) && (
            <Section title={t('speciesDetail.imageAttributionSection')}>
              <DetailRow label={t('speciesDetail.imageUrl')} value={species.image_url} />
              <DetailRow label={t('speciesDetail.thumbnailUrl')} value={species.thumbnail_url} />
              <DetailRow label={t('speciesDetail.license')} value={species.image_license} />
              <DetailLinkRow label={t('speciesDetail.sourceUrl')} url={species.image_source_url} t={t} />
            </Section>
          )}

          <Section title={t('speciesDetail.sourcesSection')}>
            {sources.length > 0 ? (
              sources.map((source) => <SourceCard key={source.id} source={source} t={t} formatDate={formatDate} />)
            ) : (
              <Text style={styles.emptySubtitle}>{t('speciesDetail.noSources')}</Text>
            )}
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 20,
    elevation: 3,
    height: 40,
    justifyContent: 'center',
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    width: 40,
  },
  badge: {
    borderRadius: 999,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    marginTop: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLighter,
    borderRadius: 999,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  commonName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  detailLabel: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
  },
  detailRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  detailValue: {
    color: colors.text,
    flex: 1.35,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerSpacer: {
    width: 52,
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  imageCredit: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  imageCreditLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  imageCreditRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scientificName: {
    color: colors.textSecondary,
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  sourceLinkButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 119, 182, 0.08)',
    borderColor: 'rgba(0, 119, 182, 0.25)',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1.35,
    marginBottom: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  sourceCard: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  sourceName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  speciesImage: {
    borderRadius: 10,
    height: 200,
    marginBottom: 8,
    width: '100%',
  },
  waterBadge: {
    backgroundColor: colors.primary,
  },
});
