import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { colors } from '@/constants/colors';
import { OWNER_ID } from '@/constants/owner';
import { useI18n } from '@/i18n/I18nProvider';
import {
  formatCompatibilityReason,
  getCareLevelLabel,
  getCompatibilityLevelLabel,
  getWaterTypeLabel,
} from '@/i18n/formatters';
import type { TFunction } from '@/i18n';
import { checkCompatibilityForNewFish } from '@/services/compatibilityService';
import { createUserFish } from '@/services/fishService';
import { getCategories, getSpeciesList } from '@/services/speciesService';
import type {
  CareLevel,
  CompatibilityLevel,
  CompatibilityResult,
  FishCategory,
  FishSpecies,
  WaterType,
} from '@/types';
import { extractErrorMessage } from '@/utils/errors';

const CONFIG_ERROR =
  'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';
const PICKER_PAGE_SIZE = 30;

function getSpeciesImageUri(species: FishSpecies) {
  return species.thumbnail_url || species.image_url;
}

function SpeciesThumb({
  species,
  size = 'row',
}: {
  species: FishSpecies;
  size?: 'row' | 'selected';
}) {
  const imageUri = getSpeciesImageUri(species);
  const imageStyle = size === 'selected' ? styles.speciesSelectedThumb : styles.pickerItemImage;
  const placeholderStyle =
    size === 'selected' ? styles.speciesSelectedThumbPlaceholder : styles.pickerItemPlaceholder;
  const iconSize = size === 'selected' ? 26 : 24;

  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={imageStyle} resizeMode="cover" />;
  }

  return (
    <View style={placeholderStyle}>
      <Ionicons name="fish-outline" size={iconSize} color={colors.primary} />
    </View>
  );
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCompatibilitySummary(result: CompatibilityResult, t: TFunction) {
  if (result.level === 'danger') return t('compat.dangerSummary');
  if (result.level === 'caution' || result.level === 'unknown') return t('compat.cautionSummary');
  return result.note || t('compat.safeSummary');
}

function getBadgeStyle(level: CompatibilityLevel) {
  if (level === 'danger') {
    return styles.compatBadgeDanger;
  }

  if (level === 'caution' || level === 'unknown') {
    return styles.compatBadgeCaution;
  }

  return styles.compatBadgeSafe;
}

function getBadgeTextStyle(level: CompatibilityLevel) {
  if (level === 'caution' || level === 'unknown') {
    return styles.compatBadgeTextDark;
  }

  return styles.compatBadgeTextLight;
}

function FieldLabel({
  children,
  iconName,
}: {
  children: React.ReactNode;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.label}>
      <View style={styles.labelIcon}>
        <Ionicons name={iconName} size={14} color={colors.primary} />
      </View>
      <Text style={styles.labelText}>{children}</Text>
    </View>
  );
}

export default function AddFishScreen() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [compatibilityChecking, setCompatibilityChecking] = useState(false);
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [debouncedPickerSearch, setDebouncedPickerSearch] = useState('');
  const [pickerCategoryId, setPickerCategoryId] = useState<string | null>(null);
  const [pickerWaterType, setPickerWaterType] = useState<WaterType | null>(null);
  const [pickerCareLevel, setPickerCareLevel] = useState<CareLevel | null>(null);
  const [pickerSpecies, setPickerSpecies] = useState<FishSpecies[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerPage, setPickerPage] = useState(0);
  const [pickerHasMore, setPickerHasMore] = useState(true);
  const [categories, setCategories] = useState<FishCategory[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualText, setManualText] = useState('');
  const [customSpeciesName, setCustomSpeciesName] = useState<string | null>(null);
  const pickerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerLoadingRef = useRef(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pickerSearchTimer.current) clearTimeout(pickerSearchTimer.current);
    pickerSearchTimer.current = setTimeout(() => {
      setDebouncedPickerSearch(pickerSearch);
      setPickerPage(0);
    }, 400);
    return () => {
      if (pickerSearchTimer.current) clearTimeout(pickerSearchTimer.current);
    };
  }, [pickerSearch]);

  useEffect(() => {
    if (!showSpeciesPicker) return;

    let isCurrent = true;

    async function loadPickerSpecies() {
      pickerLoadingRef.current = true;
      setPickerLoading(true);
      try {
        const results = await getSpeciesList({
          search: debouncedPickerSearch || undefined,
          categoryId: pickerCategoryId ?? undefined,
          waterType: pickerWaterType ?? undefined,
          careLevel: pickerCareLevel ?? undefined,
          page: pickerPage,
          pageSize: PICKER_PAGE_SIZE,
        });

        if (!isCurrent) return;

        if (pickerPage === 0) {
          setPickerSpecies(results);
        } else {
          setPickerSpecies((prev) => [...prev, ...results]);
        }
        setPickerHasMore(results.length === PICKER_PAGE_SIZE);
      } catch {
        // Silently ignore picker load errors; manual entry remains available.
      } finally {
        if (isCurrent) {
          pickerLoadingRef.current = false;
          setPickerLoading(false);
        }
      }
    }

    void loadPickerSpecies();

    return () => {
      isCurrent = false;
    };
  }, [
    debouncedPickerSearch,
    pickerCareLevel,
    pickerCategoryId,
    pickerPage,
    pickerWaterType,
    showSpeciesPicker,
  ]);

  function resetPickerState() {
    pickerLoadingRef.current = false;
    setPickerSearch('');
    setDebouncedPickerSearch('');
    setPickerCategoryId(null);
    setPickerWaterType(null);
    setPickerCareLevel(null);
    setPickerPage(0);
    setPickerSpecies([]);
    setPickerHasMore(true);
    setShowManualEntry(false);
    setManualText('');
  }

  const saveFish = useCallback(async (trimmedName: string) => {
    setSaving(true);

    try {
      await createUserFish({
        name: trimmedName,
        notes: notes.trim() ? notes.trim() : null,
        species_id: selectedSpecies?.id ?? null,
        custom_species_name: customSpeciesName ?? null,
        start_date: startDate,
        status: 'alive',
      });
      router.push('/(tabs)/collection');
    } catch (err) {
      console.error('[Fishy][AddFish] save error:', err);
      const errorMessage = extractErrorMessage(err, 'Could not save fish. Please try again.');

      if (errorMessage === CONFIG_ERROR) {
        setSubmitError('Cannot save — Supabase is not configured.');
      } else {
        setSubmitError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  }, [customSpeciesName, notes, selectedSpecies, startDate]);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    setNameError(null);
    setSubmitError(null);

    if (!trimmedName) {
      setNameError(t('addFish.fishNameRequired'));
      return;
    }

    if (!selectedSpecies) {
      await saveFish(trimmedName);
      return;
    }

    setCompatibilityChecking(true);

    try {
      const result = await checkCompatibilityForNewFish({
        newSpeciesId: selectedSpecies.id,
        ownerId: OWNER_ID,
      });
      setCompatibilityResult(result);

      if (result.level === 'safe') {
        await saveFish(trimmedName);
        return;
      }

      setShowCompatibilityModal(true);
    } catch (err) {
      const checkFailedMsg = t('compat.checkFailed');
      console.error('[Fishy Compatibility] check failed in add-fish:', extractErrorMessage(err, 'Unknown error'));
      setSubmitError(checkFailedMsg);
      setCompatibilityResult({
        level: 'caution',
        pairResults: [],
        reasons: [checkFailedMsg],
        hasIncompleteData: true,
        note: checkFailedMsg,
      });
      setShowCompatibilityModal(true);
    } finally {
      setCompatibilityChecking(false);
    }
  }, [name, saveFish, selectedSpecies, t]);

  return (
    <View style={styles.container}>
      <View style={styles.heroStrip} />
      <View style={styles.screenContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('addFish.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
        data={[]}
        renderItem={null}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <Ionicons name="fish-outline" size={32} color={colors.primary} />
              </View>
              <View style={styles.introTextWrap}>
                <Text style={styles.subtitle}>{t('addFish.subtitle')}</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/scan')}
                  activeOpacity={0.85}
                  style={styles.photoHintButton}
                >
                  <Text style={styles.photoHintLink}>{t('addFish.useScanInstead')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <FieldLabel iconName="chatbubble-outline">{t('addFish.fishName')}</FieldLabel>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('addFish.fishNamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, nameError && styles.inputError]}
              />
              {nameError && <Text style={styles.errorText}>{nameError}</Text>}
            </View>

            <View style={styles.field}>
              <FieldLabel iconName="fish-outline">{t('addFish.speciesOptional')}</FieldLabel>
              {!selectedSpecies && !customSpeciesName && (
                <TouchableOpacity
                  style={styles.speciesSelectRow}
                  onPress={() => setShowSpeciesPicker(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="fish-outline"
                    size={18}
                    color={colors.textMuted}
                    style={styles.speciesSelectIcon}
                  />
                  <Text style={styles.speciesSelectPlaceholder}>{t('addFish.tapToSelectSpecies')}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {selectedSpecies && (
                <TouchableOpacity
                  style={styles.speciesSelectedRow}
                  onPress={() => setShowSpeciesPicker(true)}
                  activeOpacity={0.85}
                >
                  <SpeciesThumb species={selectedSpecies} size="selected" />
                  <View style={styles.speciesSelectedContent}>
                    <Text style={styles.speciesSelectedName}>{selectedSpecies.common_name}</Text>
                    {selectedSpecies.scientific_name ? (
                      <Text style={styles.speciesSelectedSci}>({selectedSpecies.scientific_name})</Text>
                    ) : null}
                    {selectedSpecies.entry_type && selectedSpecies.entry_type !== 'species' ? (
                      <Text style={styles.speciesEntryTypeBadge}>
                        {selectedSpecies.entry_type.charAt(0).toUpperCase() +
                          selectedSpecies.entry_type.slice(1)}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {customSpeciesName && !selectedSpecies && (
                <TouchableOpacity
                  style={styles.speciesSelectedRow}
                  onPress={() => {
                    setShowSpeciesPicker(true);
                    setShowManualEntry(true);
                    setManualText(customSpeciesName);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.speciesSelectedThumbPlaceholder}>
                    <Ionicons name="create-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.speciesSelectedContent}>
                    <Text style={styles.speciesCustomTitle}>{t('addFish.customSpecies')}</Text>
                    <Text style={styles.speciesCustomLabel}>{customSpeciesName}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListFooterComponent={
          <View>
            <View style={styles.field}>
              <FieldLabel iconName="calendar-outline">{t('addFish.startedKeeping')}</FieldLabel>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel iconName="document-text-outline">{t('addFish.notesOptional')}</FieldLabel>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('addFish.notesPlaceholder')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.helperRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.helperText}>{t('addFish.helperText')}</Text>
            </View>

            {submitError && <Text style={styles.submitError}>{submitError}</Text>}

            <View style={styles.saveButtonWrap}>
              <LiquidGlassButton
                title={saving ? t('common.saving') : compatibilityChecking ? t('common.checking') : t('addFish.saveFish')}
                onPress={handleSubmit}
                disabled={saving || compatibilityChecking}
                loading={saving || compatibilityChecking}
                variant="primary"
                size="lg"
              />
            </View>
          </View>
        }
        />
      </View>
      <Modal
        animationType="slide"
        transparent
        visible={showSpeciesPicker}
        onRequestClose={() => {
          setShowSpeciesPicker(false);
          resetPickerState();
        }}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => {
            setShowSpeciesPicker(false);
            resetPickerState();
          }}
        >
          <Pressable onPress={() => {}} style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeader}>
              <View style={styles.pickerHeaderText}>
                <Text style={styles.pickerTitle}>{t('addFish.selectSpecies')}</Text>
                <Text style={styles.pickerSubtitle}>{t('addFish.pickerSubtitle')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowSpeciesPicker(false);
                  resetPickerState();
                }}
                style={styles.pickerCloseBtn}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSearchRow}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder={t('addFish.searchFish')}
                placeholderTextColor={colors.textMuted}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoCorrect={false}
              />
              {pickerSearch.length > 0 && (
                <TouchableOpacity onPress={() => setPickerSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {categories.length > 0 && (
              <>
                <View style={styles.filterSectionLabel}>
                  <Ionicons name="grid-outline" size={13} color={colors.primary} />
                  <Text style={styles.filterSectionLabelText}>{t('addFish.category')}</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterRow}
                  contentContainerStyle={styles.filterRowContent}
                >
                  <TouchableOpacity
                    style={[styles.filterChip, pickerCategoryId === null && styles.filterChipActive]}
                    onPress={() => {
                      setPickerCategoryId(null);
                      setPickerPage(0);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        pickerCategoryId === null && styles.filterChipTextActive,
                      ]}
                    >
                      {t('common.all')}
                    </Text>
                  </TouchableOpacity>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.filterChip, pickerCategoryId === cat.id && styles.filterChipActive]}
                      onPress={() => {
                        setPickerCategoryId(cat.id);
                        setPickerPage(0);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          pickerCategoryId === cat.id && styles.filterChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.filterSectionLabel}>
              <Ionicons name="water-outline" size={13} color={colors.primary} />
              <Text style={styles.filterSectionLabelText}>{t('addFish.waterType')}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filterRowContent}
            >
              {([null, 'freshwater', 'marine'] as const).map((wt) => (
                <TouchableOpacity
                  key={wt ?? 'all'}
                  style={[styles.filterChip, pickerWaterType === wt && styles.filterChipActive]}
                  onPress={() => {
                    setPickerWaterType(wt);
                    setPickerPage(0);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      pickerWaterType === wt && styles.filterChipTextActive,
                    ]}
                  >
                    {wt === null ? t('addFish.allWater') : getWaterTypeLabel(wt, t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.filterSectionLabel}>
              <Ionicons name="bar-chart-outline" size={13} color={colors.primary} />
              <Text style={styles.filterSectionLabelText}>{t('addFish.careLevel')}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filterRowContent}
            >
              {([null, 'beginner', 'intermediate', 'advanced'] as const).map((cl) => (
                <TouchableOpacity
                  key={cl ?? 'all'}
                  style={[styles.filterChip, pickerCareLevel === cl && styles.filterChipActive]}
                  onPress={() => {
                    setPickerCareLevel(cl);
                    setPickerPage(0);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      pickerCareLevel === cl && styles.filterChipTextActive,
                    ]}
                  >
                    {cl === null ? t('addFish.allLevels') : getCareLevelLabel(cl, t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={pickerSpecies}
              keyExtractor={(item) => item.id}
              style={styles.pickerList}
              keyboardShouldPersistTaps="handled"
              onEndReached={() => {
                if (pickerHasMore && !pickerLoadingRef.current) {
                  setPickerPage((prev) => prev + 1);
                }
              }}
              onEndReachedThreshold={0.3}
              ListEmptyComponent={
                !pickerLoading ? (
                  <Text style={styles.pickerEmptyText}>{t('addFish.noFishFound')}</Text>
                ) : null
              }
              ListFooterComponent={
                pickerLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
                ) : null
              }
              renderItem={({ item }) => {
                const isSelected = selectedSpecies?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => {
                      setSelectedSpecies(item);
                      setCustomSpeciesName(null);
                      setShowSpeciesPicker(false);
                      resetPickerState();
                    }}
                    activeOpacity={0.85}
                  >
                    <SpeciesThumb species={item} />
                    <View style={styles.pickerItemTextWrap}>
                      <Text style={[styles.pickerItemName, isSelected && styles.pickerItemNameSelected]}>
                        {item.common_name}
                      </Text>
                      {item.scientific_name ? (
                        <Text style={styles.pickerItemSci}>({item.scientific_name})</Text>
                      ) : null}
                      {item.entry_type && item.entry_type !== 'species' ? (
                        <Text style={styles.pickerItemType}>
                          {item.entry_type.charAt(0).toUpperCase() + item.entry_type.slice(1)}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                      size={isSelected ? 18 : 14}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.manualSection}>
              {!showManualEntry ? (
                <TouchableOpacity
                  onPress={() => setShowManualEntry(true)}
                  style={styles.manualEntryToggle}
                >
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                  <Text style={styles.manualEntryToggleText}>{t('addFish.cantFindFish')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.manualEntryForm}>
                  <TextInput
                    style={styles.manualEntryInput}
                    placeholder={t('addFish.manualInputPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={manualText}
                    onChangeText={setManualText}
                    autoFocus
                  />
                  <View style={styles.manualEntryActions}>
                    <TouchableOpacity
                      style={styles.manualConfirmBtn}
                      onPress={() => {
                        const trimmed = manualText.trim();
                        if (!trimmed) return;
                        setCustomSpeciesName(trimmed);
                        setSelectedSpecies(null);
                        setShowSpeciesPicker(false);
                        resetPickerState();
                      }}
                    >
                      <Text style={styles.manualConfirmText}>{t('common.confirm')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowManualEntry(false);
                        setManualText('');
                      }}
                    >
                      <Text style={styles.manualCancelText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal animationType="slide" transparent visible={showCompatibilityModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {compatibilityResult && (
                <>
                  <Text style={styles.modalTitle}>{t('compat.title')}</Text>
                  <View style={[styles.compatBadge, getBadgeStyle(compatibilityResult.level)]}>
                    <Text style={[styles.compatBadgeText, getBadgeTextStyle(compatibilityResult.level)]}>
                      {getCompatibilityLevelLabel(compatibilityResult.level, t)}
                    </Text>
                  </View>
                  <Text style={styles.compatNewFish}>
                    {t('compat.newFish', {
                      name: name.trim() || t('compat.unnamedFish'),
                      species: selectedSpecies?.common_name ?? t('compat.unknownSpecies'),
                    })}
                  </Text>
                  <Text style={styles.compatSummary}>{getCompatibilitySummary(compatibilityResult, t)}</Text>

                  {compatibilityResult.pairResults.map((pairResult) => (
                    <View key={pairResult.existingFishId} style={styles.compatCard}>
                      <View style={styles.compatCardHeader}>
                        <View style={styles.compatCardTitleWrap}>
                          <Text style={styles.compatCardTitle}>{pairResult.existingFishName}</Text>
                          <Text style={styles.compatCardSubtitle}>{pairResult.existingSpeciesName}</Text>
                        </View>
                        <View style={[styles.compatSmallBadge, getBadgeStyle(pairResult.level)]}>
                          <Text style={[styles.compatSmallBadgeText, getBadgeTextStyle(pairResult.level)]}>
                            {getCompatibilityLevelLabel(pairResult.level, t)}
                          </Text>
                        </View>
                      </View>
                      {pairResult.reasons.map((reason) => (
                        <Text key={reason} style={styles.compatReason}>
                          - {formatCompatibilityReason(reason, t)}
                        </Text>
                      ))}
                    </View>
                  ))}

                  <Text style={styles.compatNote}>
                    {compatibilityResult.note ? formatCompatibilityReason(compatibilityResult.note, t) : null}
                  </Text>
                </>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <LiquidGlassButton
                title={t('compat.continueAnyway')}
                onPress={() => {
                  setShowCompatibilityModal(false);
                  void saveFish(name.trim());
                }}
                variant={compatibilityResult?.level === 'danger' ? 'destructive' : 'primary'}
                size="md"
              />
              <LiquidGlassButton
                title={t('compat.goBackChange')}
                onPress={() => setShowCompatibilityModal(false)}
                variant="secondary"
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>
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
  container: {
    backgroundColor: colors.aquariumMist,
    flex: 1,
  },
  compatBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  compatBadgeCaution: {
    backgroundColor: colors.compatCaution,
  },
  compatBadgeDanger: {
    backgroundColor: colors.compatDanger,
  },
  compatBadgeSafe: {
    backgroundColor: colors.compatSafe,
  },
  compatBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  compatBadgeTextDark: {
    color: colors.text,
  },
  compatBadgeTextLight: {
    color: '#FFFFFF',
  },
  compatCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  compatCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compatCardSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  compatCardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  compatCardTitleWrap: {
    flex: 1,
  },
  compatNewFish: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 16,
  },
  compatNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
  },
  compatReason: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  compatSmallBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compatSmallBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  compatSummary: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  errorText: {
    color: colors.compatDanger,
    fontSize: 13,
    marginTop: 6,
  },
  field: {
    marginBottom: 22,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerSpacer: {
    width: 52,
  },
  helperText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  helperRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
  },
  heroStrip: {
    backgroundColor: colors.aquariumLight,
    height: 180,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  inlineMessage: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  inlineMessageText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  intro: {
    alignItems: 'flex-start',
    backgroundColor: colors.glassSurface,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 22,
    padding: 16,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  introIcon: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  introTextWrap: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    elevation: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: colors.compatDanger,
  },
  label: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  labelIcon: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  labelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  notesInput: {
    minHeight: 108,
  },
  modalActions: {
    gap: 12,
    padding: 16,
    paddingTop: 8,
  },
  modalContent: {
    padding: 18,
    paddingBottom: 10,
  },
  modalOverlay: {
    backgroundColor: 'rgba(27, 42, 59, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  photoHintButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  photoHintLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  speciesSelectRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  speciesSelectIcon: {
    marginRight: 10,
  },
  speciesSelectPlaceholder: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 16,
  },
  speciesSelectedRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderRadius: 14,
    borderWidth: 1.5,
    elevation: 2,
    flexDirection: 'row',
    padding: 12,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
  },
  speciesSelectedContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  speciesSelectedName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  speciesSelectedSci: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  speciesEntryTypeBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  speciesCustomLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  speciesCustomTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  speciesSelectedThumb: {
    borderRadius: 12,
    height: 58,
    marginRight: 12,
    width: 58,
  },
  speciesSelectedThumbPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 12,
    height: 58,
    justifyContent: 'center',
    marginRight: 12,
    width: 58,
  },
  pickerOverlay: {
    backgroundColor: 'rgba(27, 42, 59, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  pickerHandle: {
    alignSelf: 'center',
    backgroundColor: colors.inactive,
    borderRadius: 2,
    height: 4,
    marginBottom: 2,
    marginTop: 12,
    width: 36,
  },
  pickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  pickerHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  pickerSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  pickerCloseBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    height: 36,
    justifyContent: 'center',
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    width: 36,
  },
  pickerSearchRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 14,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerSearchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
  },
  filterRow: {
    flexShrink: 0,
    marginBottom: 4,
  },
  filterRowContent: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  filterSectionLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginBottom: 1,
    marginTop: 6,
    paddingHorizontal: 16,
  },
  filterSectionLabelText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  pickerList: {
    flex: 1,
    marginTop: 4,
  },
  pickerItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 1,
    flexDirection: 'row',
    marginBottom: 6,
    marginHorizontal: 14,
    padding: 10,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  pickerItemSelected: {
    backgroundColor: colors.aquariumLight,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  pickerItemTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  pickerItemImage: {
    borderRadius: 12,
    height: 56,
    marginRight: 12,
    width: 56,
  },
  pickerItemPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    marginRight: 12,
    width: 56,
  },
  pickerItemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  pickerItemNameSelected: {
    color: colors.primary,
  },
  pickerItemSci: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  pickerItemType: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  pickerEmptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 24,
    textAlign: 'center',
  },
  manualSection: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: 16,
  },
  manualEntryToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  manualEntryToggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  manualEntryForm: {
    gap: 10,
  },
  manualEntryInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  manualEntryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  manualConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  manualConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  manualCancelText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  scientificName: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  selectedSpecies: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  speciesName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  speciesNameSelected: {
    color: colors.primary,
  },
  speciesOption: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  speciesOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  submitError: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  saveButtonWrap: {
    marginBottom: 8,
    marginTop: 20,
    paddingHorizontal: 0,
  },
  screenContent: {
    flex: 1,
    zIndex: 1,
  },
});
