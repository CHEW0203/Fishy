import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ErrorMessage } from '@/components/ErrorMessage';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import { getCareLevelLabel, getDurationText, getStatusLabel, getWaterTypeLabel } from '@/i18n/formatters';
import type { TFunction } from '@/i18n';
import { deleteFishById, getUserFishById, updateUserFish } from '@/services/fishService';
import { getFishPhotos } from '@/services/photoService';
import type { FishPhoto, FishSpecies, FishStatus, UserFish } from '@/types';
import { extractErrorMessage } from '@/utils/errors';

const END_DATE_STATUSES: FishStatus[] = ['sold', 'given_away', 'missing'];
const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.86, 420);

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getKeptDuration(fish: UserFish, t: TFunction): string {
  const start = fish.start_date;

  if (!start) {
    return t('fishDetail.durationUnknown');
  }

  let end: string | null = null;

  if (fish.status === 'dead') {
    end = fish.death_date;
  } else if (END_DATE_STATUSES.includes(fish.status)) {
    end = fish.end_date;
  }

  if (fish.status !== 'alive' && !end) {
    return t('fishDetail.durationUnknown');
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = end ? new Date(`${end.slice(0, 10)}T00:00:00`) : new Date();

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return t('fishDetail.durationUnknown');
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) {
    return t('fishDetail.justAdded');
  }

  return getDurationText(days, t);
}

function getDaysWithUser(startDate: string | null | undefined): number | null {
  if (!startDate) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00`).getTime();

  if (!Number.isFinite(start)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatRange(
  min: number | null,
  max: number | null,
  suffix: string,
): string | null {
  if (min !== null && max !== null) {
    return `${min}-${max}${suffix}`;
  }

  if (max !== null) {
    return `Up to ${max}${suffix}`;
  }

  if (min !== null) {
    return `From ${min}${suffix}`;
  }

  return null;
}

function truncateDescription(value: string | null) {
  if (!value) {
    return null;
  }

  return value.length > 200 ? `${value.slice(0, 200)}...` : value;
}

interface InfoRowProps {
  label: string;
  value: string | null | undefined;
  icon?: keyof typeof Ionicons.glyphMap;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelRow}>
        {icon ? <Ionicons name={icon} size={14} color={colors.primary} /> : null}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SpeciesInfo({ species, t }: { species?: FishSpecies; t: TFunction }) {
  if (!species) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('fishDetail.speciesInfo')}</Text>
        <Text style={styles.mutedText}>{t('fishDetail.noSpeciesLinked')}</Text>
      </View>
    );
  }

  const adultSize = formatRange(
    species.adult_size_min_cm,
    species.adult_size_max_cm,
    ' cm',
  );
  const temperature = formatRange(
    species.temperature_min_c,
    species.temperature_max_c,
    ' C',
  );
  const ph = formatRange(species.ph_min, species.ph_max, '');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('fishDetail.speciesInfo')}</Text>
      <InfoRow label={t('fishDetail.commonName')} value={species.common_name} icon="fish-outline" />
      <InfoRow label={t('fishDetail.scientificName')} value={species.scientific_name} icon="flask-outline" />
      <InfoRow label={t('fishDetail.waterType')} value={getWaterTypeLabel(species.water_type, t)} icon="water-outline" />
      <InfoRow label={t('fishDetail.careLevel')} value={getCareLevelLabel(species.care_level, t)} icon="bar-chart-outline" />
      <InfoRow label={t('fishDetail.temperament')} value={formatLabel(species.temperament)} icon="heart-outline" />
      <InfoRow label={t('fishDetail.adultSize')} value={adultSize} icon="resize-outline" />
      <InfoRow label={t('fishDetail.temperature')} value={temperature} icon="thermometer-outline" />
      <InfoRow label="pH" value={ph} icon="water-outline" />
      <InfoRow label={t('fishDetail.diet')} value={formatLabel(species.diet)} icon="restaurant-outline" />
      <InfoRow label={t('fishDetail.description')} value={truncateDescription(species.description)} />
    </View>
  );
}

export default function FishDetailScreen() {
  const { t, language } = useI18n();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = getParam(rawId);

  function formatMonthYear(value: string | null) {
    if (!value) return null;
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  function formatDetailDate(value: string | null) {
    if (!value) return null;
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const locale = language === 'zh' ? 'zh-CN' : 'en-GB';
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatTimelineDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('common.unknown');
    const locale = language === 'zh' ? 'zh-CN' : 'en-GB';
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatTimelineTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const locale = language === 'zh' ? 'zh-CN' : 'en-GB';
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  const STATUS_OPTIONS: { label: string; value: FishStatus }[] = [
    { label: getStatusLabel('alive', t), value: 'alive' },
    { label: getStatusLabel('dead', t), value: 'dead' },
    { label: getStatusLabel('sold', t), value: 'sold' },
    { label: getStatusLabel('given_away', t), value: 'given_away' },
    { label: getStatusLabel('missing', t), value: 'missing' },
  ];
  const [fish, setFish] = useState<UserFish | null>(null);
  const [photos, setPhotos] = useState<FishPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<FishStatus>('alive');
  const [deathDate, setDeathDate] = useState(todayIsoDate());
  const [endDateInput, setEndDateInput] = useState(todayIsoDate());
  const [statusNotes, setStatusNotes] = useState('');
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<FishPhoto | null>(null);
  const [timelineAnimation] = useState(() => new Animated.Value(0));
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError(t('fishDetail.fishIdMissing'));
      return;
    }

    setLoading(true);
    setPhotosLoading(true);
    setError(null);
    setPhotosError(null);

    try {
      const fishResult = await getUserFishById(id);

      if (!fishResult) {
        setFish(null);
        setPhotos([]);
        setError(t('fishDetail.notFound'));
        return;
      }

      setFish(fishResult);

      try {
        const photoResults = await getFishPhotos(id);
        setPhotos(photoResults);
      } catch (photoErr) {
        console.error('[Fishy][FishDetail] photo history load error:', photoErr);
        setPhotosError(extractErrorMessage(photoErr, 'Could not load photo history.'));
      }
    } catch (err) {
      console.error('[Fishy][FishDetail] load error:', err);
      setError(extractErrorMessage(err, 'Could not load fish details.'));
    } finally {
      setLoading(false);
      setPhotosLoading(false);
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (!timelineOpen) {
      return;
    }

    Animated.timing(timelineAnimation, {
      duration: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [timelineAnimation, timelineOpen]);

  const openTimelineDrawer = useCallback(() => {
    timelineAnimation.setValue(0);
    setTimelineOpen(true);
  }, [timelineAnimation]);

  const closeTimelineDrawer = useCallback(() => {
    Animated.timing(timelineAnimation, {
      duration: 180,
      toValue: 0,
      useNativeDriver: true,
    }).start(() => setTimelineOpen(false));
  }, [timelineAnimation]);

  const resetStatusForm = useCallback((fishToEdit: UserFish) => {
    setSelectedStatus(fishToEdit.status);
    setDeathDate(fishToEdit.death_date ?? todayIsoDate());
    setEndDateInput(fishToEdit.end_date ?? todayIsoDate());
    setStatusNotes(fishToEdit.notes ?? '');
    setStatusUpdateError(null);
  }, []);

  const handleEditStatus = useCallback(() => {
    if (!fish) {
      return;
    }

    resetStatusForm(fish);
    setIsEditingStatus(true);
  }, [fish, resetStatusForm]);

  const handleCancelStatusEdit = useCallback(() => {
    if (fish) {
      resetStatusForm(fish);
    }

    setIsEditingStatus(false);
  }, [fish, resetStatusForm]);

  const handleStatusChange = useCallback((nextStatus: FishStatus) => {
    setSelectedStatus(nextStatus);
    setStatusUpdateError(null);

    if (nextStatus === 'dead' && !deathDate) {
      setDeathDate(todayIsoDate());
    }

    if (END_DATE_STATUSES.includes(nextStatus) && !endDateInput) {
      setEndDateInput(todayIsoDate());
    }
  }, [deathDate, endDateInput]);

  const handleSaveStatus = useCallback(async () => {
    if (!fish || !id) {
      return;
    }

    const payload = {
      death_date: selectedStatus === 'dead' ? deathDate : null,
      end_date: END_DATE_STATUSES.includes(selectedStatus) ? endDateInput : null,
      notes: statusNotes.trim() ? statusNotes.trim() : null,
      status: selectedStatus,
    };

    if (selectedStatus === 'dead' && !payload.death_date) {
      setStatusUpdateError(t('fishDetail.deathDateRequired'));
      return;
    }

    if (END_DATE_STATUSES.includes(selectedStatus) && !payload.end_date) {
      setStatusUpdateError(t('fishDetail.endDateRequired'));
      return;
    }

    setStatusSaving(true);
    setStatusUpdateError(null);

    try {
      await updateUserFish(id, payload);
      await refetch();
      setIsEditingStatus(false);
    } catch (err) {
      console.error('[Fishy Fish Detail] updateUserFish failed:', err);
      console.error('[Fishy Fish Detail] payload:', payload);
      console.error('[Fishy Fish Detail] fish id:', id);
      setStatusUpdateError(t('fishDetail.updateStatusError'));
    } finally {
      setStatusSaving(false);
    }
  }, [deathDate, endDateInput, fish, id, refetch, selectedStatus, statusNotes, t]);

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteFishById(id);
      setDeleteConfirmVisible(false);
      router.back();
    } catch (err) {
      console.error('[Fishy][FishDetail] deleteFishById failed:', err);
      setDeleteError(t('fishDetail.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  }, [id, t]);

  if (loading) {
    return <LoadingSpinner label={t('fishDetail.loading')} />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={id ? refetch : undefined} />
      </View>
    );
  }

  if (!fish) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={t('fishDetail.notFound')} />
      </View>
    );
  }

  const keptSince = formatMonthYear(fish.start_date);
  const deathDateDisplay = formatDetailDate(fish.death_date);
  const endDateDisplay = formatDetailDate(fish.end_date);
  const heroPhotoUrl = fish.current_photo?.photo_url;
  const daysWithUser = getDaysWithUser(fish.start_date);
  const timelineDrawerTranslate = timelineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [DRAWER_WIDTH, 0],
  });

  return (
    <View style={styles.screenWrapper}>
      <ScrollView style={styles.fishDetailScroll} contentContainerStyle={styles.content}>
        <View style={styles.heroArea}>
          <View style={styles.heroBackground} />
          <View style={styles.heroDarkLayer} />
          <View style={styles.heroPlant} />
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />
          <View style={styles.heroBubbleThree} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.heroImageFrame}>
            {heroPhotoUrl ? (
              <Image source={{ uri: heroPhotoUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="fish-outline" size={54} color={colors.primary} />
              </View>
            )}
            <View style={styles.heroStatusBadge}>
              <StatusBadge status={fish.status} />
            </View>
            <View style={styles.updatePhotoButton}>
              <LiquidGlassButton
                title={t('fishDetail.updatePhoto')}
                onPress={() => router.push({ pathname: '/update-photo', params: { fishId: id } })}
                variant="primary"
                size="sm"
                fullWidth={false}
                leftIcon={<Ionicons name="camera-outline" size={16} color="#FFFFFF" />}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{fish.name}</Text>
            <StatusBadge status={fish.status} />
          </View>
          <View style={styles.summaryBody}>
            <View style={styles.summaryInfo}>
              <InfoRow label={t('fishDetail.species')} value={fish.species?.common_name ?? t('fishDetail.unknownSpecies')} />
              <InfoRow label={t('fishDetail.scientificName')} value={fish.species?.scientific_name} />
              <InfoRow label={t('fishDetail.startDate')} value={keptSince ? t('fishDetail.keptSince', { date: keptSince }) : null} />
              <InfoRow label={t('fishDetail.keptFor')} value={getKeptDuration(fish, t)} />
              {fish.status === 'dead' && <InfoRow label={t('fishDetail.deathDate')} value={deathDateDisplay} />}
              {END_DATE_STATUSES.includes(fish.status) && (
                <InfoRow label={t('fishDetail.endDate')} value={endDateDisplay} />
              )}
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeWave}>~</Text>
              <Text style={styles.timeBadgeNumber}>{daysWithUser ?? '—'}</Text>
              <Text style={styles.timeBadgeUnit}>{t('fishDetail.days')}</Text>
              <Text style={styles.timeBadgeLabel}>{t('fishDetail.timeWithYou')}</Text>
            </View>
          </View>
          <InfoRow label="Notes" value={fish.notes} />
        </View>

        <View style={styles.section}>
          <View style={styles.editStatusHeader}>
            <Text style={styles.sectionTitle}>{t('fishDetail.editStatus')}</Text>
            {!isEditingStatus && (
              <LiquidGlassButton
                title={t('common.edit')}
                onPress={handleEditStatus}
                variant="secondary"
                size="sm"
                fullWidth={false}
              />
            )}
          </View>

          {!isEditingStatus ? (
            <Text style={styles.mutedText}>{t('fishDetail.editStatusHint')}</Text>
          ) : (
            <View>
              <Text style={styles.label}>{t('fishDetail.statusLabel')}</Text>
              <View style={styles.statusOptions}>
                {STATUS_OPTIONS.map((option) => {
                  const selected = selectedStatus === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.statusOption, selected && styles.statusOptionSelected]}
                      onPress={() => handleStatusChange(option.value)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          selected && styles.statusOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedStatus === 'dead' && (
                <View style={styles.field}>
                  <Text style={styles.label}>{t('fishDetail.deathDateLabel')}</Text>
                  <TextInput
                    value={deathDate}
                    onChangeText={setDeathDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                </View>
              )}

              {END_DATE_STATUSES.includes(selectedStatus) && (
                <View style={styles.field}>
                  <Text style={styles.label}>{t('fishDetail.endDateLabel')}</Text>
                  <TextInput
                    value={endDateInput}
                    onChangeText={setEndDateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>{t('fishDetail.notesOptional')}</Text>
                <TextInput
                  value={statusNotes}
                  onChangeText={setStatusNotes}
                  placeholder={t('fishDetail.notesPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.notesInput]}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {statusUpdateError && <Text style={styles.errorText}>{statusUpdateError}</Text>}

              <View style={styles.formActions}>
                <LiquidGlassButton
                  title={t('common.cancel')}
                  onPress={handleCancelStatusEdit}
                  disabled={statusSaving}
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                />
                <LiquidGlassButton
                  title={statusSaving ? t('common.saving') : t('common.save')}
                  onPress={handleSaveStatus}
                  disabled={statusSaving}
                  loading={statusSaving}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>

        <SpeciesInfo species={fish.species} t={t} />

        <View style={styles.deleteFishSection}>
          {deleteError && (
            <Text style={styles.deleteErrorText}>{deleteError}</Text>
          )}
          <TouchableOpacity
            style={styles.deleteFishButton}
            onPress={() => {
              setDeleteError(null);
              setDeleteConfirmVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={colors.compatDanger} />
            <Text style={styles.deleteFishButtonText}>{t('fishDetail.deleteFish')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.timelineHandle}
        onPress={openTimelineDrawer}
        activeOpacity={0.85}
        accessibilityLabel={t('fishDetail.openTimeline')}
      >
        <View style={styles.handleLines}>
          <View style={styles.handleLine} />
          <View style={styles.handleLine} />
          <View style={styles.handleLine} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={timelineOpen}
        transparent
        animationType="none"
        onRequestClose={closeTimelineDrawer}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerDismissArea}
            onPress={closeTimelineDrawer}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: timelineDrawerTranslate }],
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{t('fishDetail.photoTimeline')}</Text>
              <TouchableOpacity
                onPress={closeTimelineDrawer}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerScrollContent}>
              {photosLoading && <LoadingSpinner label={t('fishDetail.loadingTimeline')} />}
              {!photosLoading && photosError && (
                <Text style={styles.drawerErrorText}>{photosError}</Text>
              )}
              {!photosLoading && !photosError && photos.length === 0 && (
                <Text style={styles.drawerEmptyText}>{t('fishDetail.noPhotoHistory')}</Text>
              )}
              {!photosLoading && !photosError && photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.drawerEntry}
                  onPress={() => setEnlargedPhoto(photo)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: photo.thumbnail_url ?? photo.photo_url }}
                    style={styles.drawerThumbnail}
                  />
                  <View style={styles.drawerEntryInfo}>
                    <View style={styles.drawerEntryDateRow}>
                      <Text style={styles.drawerEntryDate}>
                        {formatTimelineDate(photo.captured_at)}
                      </Text>
                      {photo.is_current && (
                        <View style={styles.drawerCurrentTag}>
                          <Text style={styles.drawerCurrentTagText}>{t('fishDetail.currentPhotoTag')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.drawerEntryTime}>
                      {formatTimelineTime(photo.captured_at)}
                    </Text>
                    {photo.note ? (
                      <Text style={styles.drawerEntryNote}>{photo.note}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={!!enlargedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setEnlargedPhoto(null)}
      >
        <Pressable style={styles.lightboxOverlay} onPress={() => setEnlargedPhoto(null)}>
          <TouchableOpacity
            style={styles.lightboxCloseButton}
            onPress={() => setEnlargedPhoto(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          {enlargedPhoto && (
            <Pressable onPress={() => {}} style={styles.lightboxContent}>
              <Image
                source={{ uri: enlargedPhoto.photo_url }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
              <View style={styles.lightboxInfo}>
                <Text style={styles.lightboxDate}>
                  {formatTimelineDate(enlargedPhoto.captured_at)}{'  '}
                  {formatTimelineTime(enlargedPhoto.captured_at)}
                </Text>
                {enlargedPhoto.note ? (
                  <Text style={styles.lightboxNote}>{enlargedPhoto.note}</Text>
                ) : null}
                {enlargedPhoto.is_current && (
                  <Text style={styles.lightboxCurrentLabel}>{t('fishDetail.currentPhotoLabel')}</Text>
                )}
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setDeleteConfirmVisible(false);
        }}
      >
        <Pressable
          style={styles.deleteModalOverlay}
          onPress={() => {
            if (!isDeleting) setDeleteConfirmVisible(false);
          }}
        >
          <Pressable onPress={() => {}} style={styles.deleteModalCard}>
            <View style={styles.deleteModalIconRow}>
              <View style={styles.deleteModalIconBg}>
                <Ionicons name="trash-outline" size={28} color={colors.compatDanger} />
              </View>
            </View>
            <Text style={styles.deleteModalTitle}>{t('fishDetail.deleteConfirmTitle')}</Text>
            {fish && (
              <Text style={styles.deleteModalFishName}>{fish.name}</Text>
            )}
            <Text style={styles.deleteModalMessage}>{t('fishDetail.deleteConfirmMessage')}</Text>
            {deleteError && (
              <Text style={styles.deleteModalError}>{deleteError}</Text>
            )}
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalCancelBtn]}
                onPress={() => setDeleteConfirmVisible(false)}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalDeleteBtn, isDeleting && styles.deleteModalDeleteBtnDisabled]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalDeleteText}>
                  {isDeleting ? t('fishDetail.deleting') : t('fishDetail.deleteConfirmDelete')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.aquariumMist,
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.aquariumMist,
  },
  fishDetailScroll: {
    backgroundColor: colors.aquariumMist,
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    paddingTop: 0,
  },
  currentTag: {
    backgroundColor: colors.primaryLighter,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentTagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  editStatusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  errorText: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  field: {
    marginTop: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 20,
    elevation: 3,
    height: 40,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 44,
    width: 40,
    zIndex: 3,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  heroArea: {
    backgroundColor: colors.aquariumLight,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' ? 106 : 98,
    position: 'relative',
  },
  heroBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.aquariumLight,
  },
  heroBubbleOne: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderColor: 'rgba(255,255,255,0.62)',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    position: 'absolute',
    right: 144,
    top: 28,
    width: 28,
  },
  heroBubbleThree: {
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderColor: 'rgba(255,255,255,0.54)',
    borderRadius: 999,
    borderWidth: 1,
    height: 16,
    left: 32,
    position: 'absolute',
    top: 152,
    width: 16,
  },
  heroBubbleTwo: {
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    position: 'absolute',
    right: 92,
    top: 66,
    width: 18,
  },
  heroDarkLayer: {
    backgroundColor: '#00B4D8',
    borderTopLeftRadius: 140,
    height: 160,
    opacity: 0.28,
    position: 'absolute',
    right: -60,
    top: 20,
    transform: [{ rotate: '-12deg' }],
    width: 280,
  },
  heroImageFrame: {
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    backgroundColor: colors.border,
    borderRadius: 16,
    height: 260,
    width: '100%',
  },
  heroPlant: {
    backgroundColor: 'rgba(22, 130, 80, 0.55)',
    borderRadius: 12,
    bottom: 0,
    height: 80,
    position: 'absolute',
    right: 16,
    transform: [{ rotate: '16deg' }],
    width: 22,
  },
  heroPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 16,
    height: 260,
    justifyContent: 'center',
    width: '100%',
  },
  heroStatusBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  updatePhotoButton: {
    bottom: 16,
    position: 'absolute',
    right: 16,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  infoLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  infoRow: {
    marginTop: 12,
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  mutedText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  notesInput: {
    minHeight: 104,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 119, 182, 0.10)',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusOption: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusOptionSelected: {
    backgroundColor: colors.primaryLighter,
    borderColor: colors.primary,
  },
  statusOptionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  statusOptionTextSelected: {
    color: colors.primary,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
  },
  timelineDate: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  timelineHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  timelineImage: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 70,
    width: 82,
  },
  timelineItem: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
  },
  timelineNote: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  title: {
    color: '#0B2D5A',
    flex: 1,
    fontSize: 30,
    fontWeight: '800',
    paddingRight: 10,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineHandle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 12,
    borderTopLeftRadius: 12,
    elevation: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
    position: 'absolute',
    right: 0,
    shadowColor: '#000000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    top: Platform.OS === 'ios' ? '42%' : '40%',
  },
  summaryBody: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  summaryInfo: {
    flex: 1,
    minWidth: 0,
  },
  timeBadge: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderColor: 'rgba(0, 119, 182, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    minWidth: 116,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeBadgeLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  timeBadgeNumber: {
    color: '#0B2D5A',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  timeBadgeUnit: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  timeBadgeWave: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
  },
  handleLines: {
    alignItems: 'center',
    gap: 4,
  },
  handleLine: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 2,
    width: 14,
  },
  drawerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    flex: 1,
    flexDirection: 'row',
  },
  drawerDismissArea: {
    flex: 1,
  },
  drawer: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 16,
    borderTopLeftRadius: 16,
    flex: 1,
    maxWidth: 420,
    width: DRAWER_WIDTH,
  },
  drawerHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  drawerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  drawerEntry: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  drawerThumbnail: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  drawerEntryInfo: {
    flex: 1,
    minWidth: 0,
  },
  drawerEntryDateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  drawerEntryDate: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  drawerEntryTime: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  drawerEntryNote: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  drawerCurrentTag: {
    backgroundColor: colors.primaryLighter,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  drawerCurrentTagText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  drawerErrorText: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  drawerEmptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: 24,
  },
  lightboxOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  lightboxCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  lightboxContent: {
    alignItems: 'center',
    width: '100%',
  },
  lightboxImage: {
    borderRadius: 8,
    height: undefined,
    width: '100%',
    aspectRatio: 1,
    maxHeight: 420,
  },
  lightboxInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  lightboxDate: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  lightboxNote: {
    color: '#CCDDEE',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  lightboxCurrentLabel: {
    backgroundColor: colors.primaryLighter,
    borderRadius: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteFishSection: {
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingBottom: 8,
  },
  deleteFishButton: {
    alignItems: 'center',
    borderColor: 'rgba(231, 76, 60, 0.30)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: '100%',
  },
  deleteFishButtonText: {
    color: colors.compatDanger,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteErrorText: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  deleteModalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  deleteModalCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    width: '100%',
  },
  deleteModalIconRow: {
    marginBottom: 16,
  },
  deleteModalIconBg: {
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.10)',
    borderRadius: 32,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  deleteModalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalFishName: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteModalError: {
    color: colors.compatDanger,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 13,
  },
  deleteModalCancelBtn: {
    backgroundColor: colors.aquariumLight,
    borderColor: colors.border,
    borderWidth: 1,
  },
  deleteModalCancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteModalDeleteBtn: {
    backgroundColor: colors.compatDanger,
  },
  deleteModalDeleteBtnDisabled: {
    opacity: 0.55,
  },
  deleteModalDeleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
