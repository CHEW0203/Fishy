import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
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

import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { OWNER_ID } from '@/constants/owner';
import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import {
  formatCompatibilityReason,
  getCareLevelLabel,
  getCompatibilityLevelLabel,
  getEntryTypeLabel,
  getWaterTypeLabel,
} from '@/i18n/formatters';
import type { TFunction } from '@/i18n';
import { checkCompatibilityForNewFish } from '@/services/compatibilityService';
import { createUserFish } from '@/services/fishService';
import {
  createFishPhotoEntry,
  setCurrentFishPhoto,
  uploadFishPhoto,
} from '@/services/photoService';
import { getCategories, getSpeciesList } from '@/services/speciesService';
import type {
  CareLevel,
  CompatibilityLevel,
  CompatibilityResult,
  FishCategory,
  FishSpecies,
  UserFish,
  WaterType,
} from '@/types';
import { extractErrorMessage } from '@/utils/errors';

type ScanStep = 'permission' | 'camera' | 'preview' | 'form';

const CONFIG_ERROR =
  'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';
const TAB_BAR_CLEARANCE = 140;

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
  if (result.level === 'danger') {
    return t('compat.dangerSummary');
  }

  if (result.level === 'caution' || result.level === 'unknown') {
    return t('compat.cautionSummary');
  }

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

async function requestWebCameraAccess(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  let stream: MediaStream | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    return true;
  } catch (error) {
    console.error('[Fishy Scan] web camera access failed:', error);
    return false;
  } finally {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }
}

export default function ScanScreen() {
  const { t } = useI18n();
  const cameraRef = useRef<CameraView>(null);
  const pickerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerLoadingRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const permissionRef = useRef(permission);
  permissionRef.current = permission;
  const [scanStep, setScanStep] = useState<ScanStep>('permission');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');
  const [customSpeciesName, setCustomSpeciesName] = useState<string | null>(null);
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
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFish, setSavedFish] = useState<UserFish | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [compatibilityChecking, setCompatibilityChecking] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const hasCameraAccessRef = useRef(false);
  hasCameraAccessRef.current = hasCameraAccess;
  const [cameraReady, setCameraReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [cameraPreviewFailed, setCameraPreviewFailed] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // On web, trust getUserMedia result directly because expo-camera's permission hook
  // may stay stale after the browser grants access.
  const canUseCamera =
    Platform.OS === 'web'
      ? hasCameraAccess || permission?.granted === true
      : permission?.granted === true || hasCameraAccess;

  const resetScanSession = useCallback(() => {
    // Trust both the hook ref and local access ref to avoid stale-hook false-negatives on web.
    const granted = permissionRef.current?.granted === true || hasCameraAccessRef.current === true;
    setHasCameraAccess(granted);
    setScanStep(granted ? 'camera' : 'permission');
    setCapturedPhotoUri(null);
    setName('');
    setSelectedSpecies(null);
    setStartDate(todayIsoDate());
    setNotes('');
    setNameError(null);
    setSaveError(null);
    setSaving(false);
    setSavedFish(null);
    setCompatibilityResult(null);
    setShowCompatibilityModal(false);
    setCompatibilityChecking(false);
    setCustomSpeciesName(null);
    setShowSpeciesPicker(false);
    setCameraReady(false);
    setCaptureError(null);
    setCameraPreviewFailed(false);
    setPermissionError(null);
    resetPickerState();
  }, []);

  // Reset Scan to fresh camera state whenever screen gains focus.
  useFocusEffect(
    useCallback(() => {
      resetScanSession();
    }, [resetScanSession]),
  );

  // Also reset when user taps the Scan tab while already on Scan.
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as never, () => {
      if (navigation.isFocused()) {
        resetScanSession();
      }
    });
    return unsubscribe;
  }, [navigation, resetScanSession]);

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

  // On web, onCameraReady may not fire if the stream can't be established.
  // Show a friendly error after 7s so the user knows to check browser permissions.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (scanStep !== 'camera' || cameraReady) return;
    const timer = setTimeout(() => {
      setCameraPreviewFailed(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, [scanStep, cameraReady]);

  // Safety net: when permission becomes granted while still on the permission step,
  // transition to camera. Handles the race where the hook's permission state updates
  // after setScanStep('camera') was already called (or after resetScanSession ran).
  useEffect(() => {
    if (!permission?.granted || scanStep !== 'permission') return;
    const id = setTimeout(() => {
      setHasCameraAccess(true);
      setCameraReady(false);
      setCameraPreviewFailed(false);
      setCaptureError(null);
      setScanStep('camera');
    }, 0);
    return () => clearTimeout(id);
  }, [permission, scanStep]);

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
          pageSize: 30,
        });
        if (!isCurrent) return;
        if (pickerPage === 0) {
          setPickerSpecies(results);
        } else {
          setPickerSpecies((prev) => [...prev, ...results]);
        }
        setPickerHasMore(results.length === 30);
      } catch {
        // Silently ignore; manual entry remains available.
      } finally {
        if (isCurrent) {
          pickerLoadingRef.current = false;
          setPickerLoading(false);
        }
      }
    }
    void loadPickerSpecies();
    return () => { isCurrent = false; };
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

  const handleGrantPermission = useCallback(async () => {
    setPermissionError(null);
    try {
      if (Platform.OS === 'web') {
        const granted = await requestWebCameraAccess();
        if (granted) {
          setHasCameraAccess(true);
          hasCameraAccessRef.current = true;
          setCameraReady(false);
          setCameraPreviewFailed(false);
          setCaptureError(null);
          setPermissionError(null);
          setScanStep('camera');
          return;
        }

        setHasCameraAccess(false);
        hasCameraAccessRef.current = false;
        setPermissionError(t('scan.cameraPermissionDenied'));
        return;
      }

      const result = await requestPermission();
      if (result?.granted) {
        hasCameraAccessRef.current = true;
        setHasCameraAccess(true);
        setCameraReady(false);
        setCameraPreviewFailed(false);
        setCaptureError(null);
        setPermissionError(null);
        setScanStep('camera');
        return;
      }
      hasCameraAccessRef.current = false;
      setHasCameraAccess(false);
      setPermissionError(t('scan.cameraPermissionDenied'));
    } catch (error) {
      console.error('[Fishy Scan] camera permission request failed:', error);
      setPermissionError(t('scan.cameraPermissionError'));
    }
  }, [requestPermission, t]);

  const handleCapture = useCallback(async () => {
    setCaptureError(null);

    if (!cameraRef.current) {
      setCaptureError(t('scan.captureError'));
      return;
    }

    if (!cameraReady) {
      setCaptureError(t('scan.cameraStarting'));
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
        setScanStep('preview');
        setSaveError(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('HTMLVideoElement') ||
        msg.includes('camera data') ||
        msg.includes('enough data')
      ) {
        setCaptureError(t('scan.cameraStarting'));
      } else {
        setCaptureError(t('scan.captureError'));
      }
    }
  }, [cameraReady, t]);

  const handleRetake = useCallback(() => {
    if (savedFish) {
      Alert.alert(
        'Fish record already created',
        'Note: a fish record was already created but no photo was attached. The fish will appear in your collection without a photo.',
      );
    }

    setCapturedPhotoUri(null);
    setSaveError(null);
    setCameraReady(false);
    setCaptureError(null);
    setScanStep('camera');
  }, [savedFish]);

  const handleConfirmPhoto = useCallback(() => {
    setScanStep('form');
  }, []);

  const saveFishWithPhoto = useCallback(async (
    trimmedName: string,
    speciesId: string | null,
    photoUri: string,
    customSpeciesNameArg: string | null = null,
  ) => {
    setSaving(true);
    let failedStep = 'unknown';

    try {
      failedStep = 'createUserFish';
      const fish =
        savedFish ??
        (await createUserFish({
          name: trimmedName,
          notes: notes.trim() ? notes.trim() : null,
          species_id: speciesId,
          custom_species_name: customSpeciesNameArg,
          start_date: startDate,
          status: 'alive',
        }));

      if (!savedFish) {
        setSavedFish(fish);
      }

      try {
        failedStep = 'uploadPhoto';
        const uploadedPhoto = await uploadFishPhoto({
          fishId: fish.id,
          ownerId: OWNER_ID,
          photoUri,
        });

        failedStep = 'createFishPhoto';
        const photoRecord = await createFishPhotoEntry({
          fishId: fish.id,
          note: null,
          photoUrl: uploadedPhoto.publicUrl,
          storagePath: uploadedPhoto.storagePath,
        });

        failedStep = 'updateCurrentPhoto';
        await setCurrentFishPhoto(fish.id, photoRecord.id);
      } catch (photoErr) {
        console.error(`[Fishy Scan] save failed at step: ${failedStep}`, photoErr);
        Alert.alert(
          'Fish saved without photo',
          'The fish record was saved, but the photo could not be attached. It will appear in your collection without a photo.',
        );
      }

      failedStep = 'navigation';
      router.replace('/(tabs)/collection');
    } catch (err) {
      console.error(`[Fishy Scan] save failed at step: ${failedStep}`, err);
      console.error('[Fishy][ScanScreen] save error:', err);
      const errorMessage = extractErrorMessage(err, 'Could not save fish. Please try again.');

      if (errorMessage === CONFIG_ERROR) {
        setSaveError('Cannot save — Supabase is not configured.');
      } else if (errorMessage.includes('Photo upload failed')) {
        setSaveError('Photo upload failed. Please check your Supabase storage configuration.');
      } else if (errorMessage.includes('Fish photo record insert failed')) {
        setSaveError('Fish saved but photo record could not be created. Please check Supabase.');
      } else {
        setSaveError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  }, [notes, savedFish, startDate]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    setNameError(null);
    setSaveError(null);

    if (!trimmedName) {
      setNameError(t('scan.fishNameRequired'));
      return;
    }

    if (!capturedPhotoUri) {
      setSaveError(t('scan.noPhoto'));
      return;
    }

    if (!selectedSpecies) {
      // No species selected - save directly without compatibility check.
      await saveFishWithPhoto(trimmedName, null, capturedPhotoUri, customSpeciesName);
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
        await saveFishWithPhoto(trimmedName, selectedSpecies.id, capturedPhotoUri);
        return;
      }

      setShowCompatibilityModal(true);
    } catch (err) {
      const checkFailed = t('compat.checkFailed');
      console.error('[Fishy Compatibility] check failed in scan:', extractErrorMessage(err, 'Unknown error'));
      setSaveError(checkFailed);
      setCompatibilityResult({
        level: 'caution',
        pairResults: [],
        reasons: [checkFailed],
        hasIncompleteData: true,
        note: checkFailed,
      });
      setShowCompatibilityModal(true);
    } finally {
      setCompatibilityChecking(false);
    }
  }, [capturedPhotoUri, customSpeciesName, name, saveFishWithPhoto, selectedSpecies, t]);

  if (scanStep === 'permission' && !canUseCamera) {
    const denied = Platform.OS !== 'web' && permission && !permission.granted && permission.canAskAgain === false;

    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionIcon}>{t('scan.camera')}</Text>
          <Text style={styles.title}>{t('scan.permissionTitle')}</Text>
          <Text style={styles.permissionText}>{t('scan.permissionText')}</Text>
          {denied ? (
            <>
              <Text style={styles.errorText}>{t('scan.permissionDenied')}</Text>
              <LiquidGlassButton
                title={t('scan.openSettings')}
                onPress={Linking.openSettings}
                variant="primary"
                size="md"
                fullWidth={false}
                style={styles.permissionButton}
              />
            </>
          ) : (
            <>
              <LiquidGlassButton
                title={t('scan.grantCamera')}
                onPress={handleGrantPermission}
                variant="primary"
                size="md"
                fullWidth={false}
                style={styles.permissionButton}
              />
              {permissionError && (
                <Text style={styles.errorText}>{permissionError}</Text>
              )}
            </>
          )}
        </View>
      </View>
    );
  }

  if (hasCameraAccess && (scanStep === 'camera' || scanStep === 'permission')) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={Platform.OS === 'web' ? 'front' : 'back'}
          onCameraReady={() => setCameraReady(true)}
        >
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraTitle}>{t('scan.takePhotoPrompt')}</Text>
            {cameraPreviewFailed && !cameraReady && Platform.OS === 'web' ? (
              <Text style={styles.cameraErrorText}>{t('scan.cameraPreviewError')}</Text>
            ) : captureError ? (
              <Text style={styles.cameraErrorText}>{captureError}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.captureButton, !cameraReady && styles.captureButtonDisabled]}
              onPress={handleCapture}
              activeOpacity={cameraReady ? 0.85 : 1}
              disabled={!cameraReady}
            >
              <View style={[styles.captureButtonInner, !cameraReady && styles.captureButtonInnerDisabled]} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  if (scanStep === 'preview' && capturedPhotoUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} />
        <View style={styles.previewActions}>
          <LiquidGlassButton
            title={t('scan.retake')}
            onPress={handleRetake}
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
          />
          <LiquidGlassButton
            title={t('common.confirm')}
            onPress={handleConfirmPhoto}
            variant="primary"
            size="md"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeroStrip} />
      <FlatList
        data={[]}
        renderItem={null}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formContent}
        ListHeaderComponent={
          <View>
            {capturedPhotoUri && (
              <View style={styles.formPhotoThumb}>
                <Image source={{ uri: capturedPhotoUri }} style={styles.formPhotoThumbImg} />
              </View>
            )}
            <Text style={styles.title}>{t('scan.addFishDetails')}</Text>
            <Text style={styles.subtitle}>{t('scan.formSubtitle')}</Text>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <View style={styles.labelIconCircle}>
                  <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.label}>{t('scan.fishName')}</Text>
              </View>
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
              <View style={styles.labelRow}>
                <View style={styles.labelIconCircle}>
                  <Ionicons name="fish-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.label}>{t('scan.speciesOptional')}</Text>
              </View>

              {!selectedSpecies && !customSpeciesName && (
                <TouchableOpacity
                  style={styles.speciesSelectRow}
                  onPress={() => setShowSpeciesPicker(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="fish-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                  <Text style={[styles.speciesSelectPlaceholder, { flex: 1 }]}>
                    {t('addFish.tapToSelectSpecies')}
                  </Text>
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
                      <Text style={styles.speciesSelectedSci}>
                        ({selectedSpecies.scientific_name})
                      </Text>
                    ) : null}
                    {selectedSpecies.entry_type && selectedSpecies.entry_type !== 'species' ? (
                      <Text style={styles.speciesEntryTypeBadge}>
                        {getEntryTypeLabel(selectedSpecies.entry_type, t)}
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
              <View style={styles.labelRow}>
                <View style={styles.labelIconCircle}>
                  <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.label}>{t('scan.startedKeeping')}</Text>
              </View>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <View style={styles.labelIconCircle}>
                  <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.label}>{t('scan.notesOptional')}</Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('scan.notesPlaceholder')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.helperRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.helperText, { flex: 1 }]}>{t('scan.helperText')}</Text>
            </View>

            {saveError && <Text style={styles.submitError}>{saveError}</Text>}

            <View style={{ marginTop: 20, marginBottom: 8 }}>
              <LiquidGlassButton
                title={saving ? t('common.saving') : compatibilityChecking ? t('common.checking') : t('scan.saveFish')}
                onPress={handleSave}
                disabled={saving || compatibilityChecking}
                loading={saving || compatibilityChecking}
                variant="primary"
                size="lg"
              />
            </View>
          </View>
        }
      />
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
                  if (!capturedPhotoUri) {
                    return;
                  }

                  setShowCompatibilityModal(false);
                  void saveFishWithPhoto(
                    name.trim(),
                    selectedSpecies?.id ?? null,
                    capturedPhotoUri,
                    customSpeciesName,
                  );
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
              <View style={{ flex: 1 }}>
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
                placeholder={t('scan.searchSpecies')}
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
                    onPress={() => { setPickerCategoryId(null); setPickerPage(0); }}
                  >
                    <Text style={[styles.filterChipText, pickerCategoryId === null && styles.filterChipTextActive]}>
                      {t('common.all')}
                    </Text>
                  </TouchableOpacity>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.filterChip, pickerCategoryId === cat.id && styles.filterChipActive]}
                      onPress={() => { setPickerCategoryId(cat.id); setPickerPage(0); }}
                    >
                      <Text style={[styles.filterChipText, pickerCategoryId === cat.id && styles.filterChipTextActive]}>
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
                  onPress={() => { setPickerWaterType(wt); setPickerPage(0); }}
                >
                  <Text style={[styles.filterChipText, pickerWaterType === wt && styles.filterChipTextActive]}>
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
                  onPress={() => { setPickerCareLevel(cl); setPickerPage(0); }}
                >
                  <Text style={[styles.filterChipText, pickerCareLevel === cl && styles.filterChipTextActive]}>
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
                          {getEntryTypeLabel(item.entry_type, t)}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                    )}
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
                  <Text style={styles.manualEntryToggleText}>{t('scan.cantFindFish')}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  cameraContainer: {
    backgroundColor: '#000000',
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: TAB_BAR_CLEARANCE,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  cameraTitle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  captureButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: '#FFFFFF',
    borderRadius: 38,
    borderWidth: 3,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  captureButtonInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  captureButtonDisabled: {
    opacity: 0.35,
  },
  captureButtonInnerDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  cameraErrorText: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8,
    textAlign: 'center',
  },
  centerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  errorText: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  field: {
    marginBottom: 22,
  },
  formContainer: {
    backgroundColor: colors.aquariumMist,
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: TAB_BAR_CLEARANCE,
    paddingTop: 56,
  },
  formHeroStrip: {
    backgroundColor: colors.aquariumLight,
    height: 180,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  formPhotoThumb: {
    alignSelf: 'center',
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 2,
    elevation: 5,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  formPhotoThumbImg: {
    height: 100,
    width: 100,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  helperRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
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
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  labelIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
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
  permissionIcon: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 14,
  },
  permissionButton: {
    alignSelf: 'center',
    marginTop: 24,
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: TAB_BAR_CLEARANCE,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  previewContainer: {
    backgroundColor: colors.background,
    flex: 1,
  },
  previewImage: {
    backgroundColor: '#000000',
    flex: 1,
    width: '100%',
  },
  saveButtonWrap: {
    marginBottom: 8,
    marginTop: 20,
  },
  speciesSelectRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  speciesSelectPlaceholder: {
    color: colors.textMuted,
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
    marginBottom: 4,
    marginTop: 12,
    width: 36,
  },
  pickerHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
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
    gap: 8,
    marginHorizontal: 14,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickerSearchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
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
  filterRow: {
    flexShrink: 0,
    marginBottom: 2,
  },
  filterRowContent: {
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 2,
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
  submitError: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    marginTop: 0,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'left',
  },
});
