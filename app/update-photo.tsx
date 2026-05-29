import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Modal,
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
import { getUserFishById } from '@/services/fishService';
import {
  createFishPhotoEntry,
  setCurrentFishPhoto,
  uploadFishPhoto,
} from '@/services/photoService';
import { extractErrorMessage } from '@/utils/errors';

type UpdateStep = 'choice' | 'camera' | 'preview' | 'details';
type PhotoSource = 'camera' | 'library';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function UpdatePhotoScreen() {
  const { t } = useI18n();
  const { fishId: rawFishId } = useLocalSearchParams<{ fishId: string | string[] }>();
  const fishId = getParam(rawFishId);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<UpdateStep>('choice');
  const [source, setSource] = useState<PhotoSource | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loadingFish, setLoadingFish] = useState(true);
  const [fishExists, setFishExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const verifyFish = useCallback(async () => {
    if (!fishId) {
      setLoadingFish(false);
      setFishExists(false);
      setError('Fish ID is missing.');
      return;
    }

    setLoadingFish(true);
    setError(null);

    try {
      const fish = await getUserFishById(fishId);

      if (!fish) {
        console.error('[Fishy Update Photo] fish not found');
        setFishExists(false);
        setError('Fish not found.');
        return;
      }

      setFishExists(true);
    } catch (err) {
      console.error('[Fishy Update Photo] fish not found', err);
      setFishExists(false);
      setError(extractErrorMessage(err, 'Could not load fish.'));
    } finally {
      setLoadingFish(false);
    }
  }, [fishId]);

  useFocusEffect(
    useCallback(() => {
      verifyFish();
    }, [verifyFish]),
  );

  const safeNavigateBack = useCallback(() => {
    try {
      if (fishId) {
        router.replace({ pathname: '/(tabs)/collection/[id]', params: { id: fishId } });
        return;
      }

      router.replace('/(tabs)/collection');
    } catch (err) {
      console.warn('[Fishy Update Photo] detail navigation failed, returning to collection:', err);
      router.replace('/(tabs)/collection');
    }
  }, [fishId]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();

    if (photoUri) {
      setShowDiscardConfirm(true);
      return;
    }

    safeNavigateBack();
  }, [photoUri, safeNavigateBack]);

  const handleKeepEditing = useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  const handleDiscardPhoto = useCallback(() => {
    setShowDiscardConfirm(false);
    setPhotoUri(null);
    setNote('');
    setError(null);
    safeNavigateBack();
  }, [safeNavigateBack]);

  const handleTakePhoto = useCallback(async () => {
    const result = permission?.granted ? permission : await requestPermission();

    if (!result.granted) {
      console.error('[Fishy Update Photo] camera permission denied');
      setError('Camera access is required to take a photo.');
      return;
    }

    setSource('camera');
    setError(null);
    setShowDiscardConfirm(false);
    setStep('camera');
  }, [permission, requestPermission]);

  const handleCapture = useCallback(async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });

    if (!photo?.uri) {
      console.error('[Fishy Update Photo] no photo selected');
      setError('No photo was captured.');
      return;
    }

    setPhotoUri(photo.uri);
    setStep('preview');
    setError(null);
    setShowDiscardConfirm(false);
  }, []);

  const handleChooseFromLibrary = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      console.error('[Fishy Update Photo] no photo selected');
      setError('Photo library access is required to choose a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: 'images',
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    if (!result.assets?.[0]?.uri) {
      console.warn('[Fishy Update Photo] picker returned no asset');
      setError('No photo was returned. Please try again.');
      return;
    }

    setSource('library');
    setPhotoUri(result.assets[0].uri);
    setStep('preview');
    setError(null);
    setShowDiscardConfirm(false);
  }, []);

  const handleRetakeOrReselect = useCallback(() => {
    setPhotoUri(null);
    setError(null);
    setShowDiscardConfirm(false);

    if (source === 'camera') {
      setStep('camera');
      return;
    }

    setStep('choice');
  }, [source]);

  const handleSave = useCallback(async () => {
    if (!fishId) {
      setError('Fish ID is missing.');
      return;
    }

    if (!photoUri) {
      console.error('[Fishy Update Photo] no photo selected');
      setError('Choose or take a photo before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const uploadedPhoto = await uploadFishPhoto({
        fishId,
        ownerId: OWNER_ID,
        photoUri,
      });

      const photoRecord = await createFishPhotoEntry({
        fishId,
        isCurrent: false,
        note: note.trim() ? note.trim() : null,
        photoUrl: uploadedPhoto.publicUrl,
        storagePath: uploadedPhoto.storagePath,
      });

      try {
        await setCurrentFishPhoto(fishId, photoRecord.id);
      } catch (currentErr) {
        console.error('[Fishy Update Photo] set current photo failed:', currentErr);
        console.error(
          `[Fishy Update Photo] WARNING: photo record created but current_photo_id not updated for fish ${fishId}`,
        );
        setError('Photo was saved, but it could not be set as the current photo.');
        return;
      }

      router.replace({ pathname: '/(tabs)/collection/[id]', params: { id: fishId } });
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not update photo.');

      if (message.includes('Photo upload failed')) {
        console.error('[Fishy Update Photo] upload failed:', err);
        setError('Photo upload failed. Please check Supabase Storage and try again.');
      } else if (message.includes('Fish photo record insert failed')) {
        console.error('[Fishy Update Photo] create fish_photos failed:', err);
        setError('Photo uploaded, but the photo history record could not be created.');
      } else {
        console.error('[Fishy Update Photo] upload failed:', err);
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }, [fishId, note, photoUri]);

  if (loadingFish) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>{t('updatePhoto.loading')}</Text>
      </View>
    );
  }

  if (!fishId || !fishExists) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>{t('updatePhoto.title')}</Text>
        <Text style={styles.errorText}>{error ?? t('updatePhoto.fishNotFound')}</Text>
        <LiquidGlassButton
          title={t('updatePhoto.goBack')}
          onPress={safeNavigateBack}
          variant="secondary"
          size="md"
          style={{ marginTop: 14 }}
        />
      </View>
    );
  }

  if (step === 'camera') {
    if (!permission?.granted) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.title}>{t('updatePhoto.cameraRequired')}</Text>
          <Text style={styles.bodyText}>{t('updatePhoto.cameraBody')}</Text>
          <LiquidGlassButton
            title={t('updatePhoto.grantCamera')}
            onPress={handleTakePhoto}
            variant="primary"
            size="md"
            style={{ marginTop: 22 }}
          />
          <LiquidGlassButton
            title={t('updatePhoto.openSettings')}
            onPress={Linking.openSettings}
            variant="secondary"
            size="md"
            style={{ marginTop: 14 }}
          />
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraTitle}>{t('updatePhoto.takeNewPhotoPrompt')}</Text>
            <View style={styles.cameraActions}>
              <TouchableOpacity style={styles.smallLightButton} onPress={handleCancel}>
                <Text style={styles.smallLightButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              <View style={styles.cameraSpacer} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === 'preview' && photoUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
        <View style={styles.previewActions}>
          <LiquidGlassButton
            title={source === 'camera' ? t('updatePhoto.retake') : t('updatePhoto.chooseAgain')}
            onPress={handleRetakeOrReselect}
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
          />
          <LiquidGlassButton
            title={t('common.confirm')}
            onPress={() => setStep('details')}
            variant="primary"
            size="md"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }

  if (step === 'details' && photoUri) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('updatePhoto.photoNoteTitle')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <Image source={{ uri: photoUri }} style={styles.notePreview} />
          <Text style={styles.label}>{t('updatePhoto.addNote')}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('updatePhoto.notePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.noteInput}
            multiline
            textAlignVertical="top"
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <LiquidGlassButton
            title={saving ? t('common.saving') : t('updatePhoto.savePhoto')}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            variant="primary"
            size="lg"
            style={{ marginTop: 18 }}
          />
        </View>
        <Modal
          visible={showDiscardConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={handleKeepEditing}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.discardTitle}>{t('updatePhoto.discardTitle')}</Text>
              <Text style={styles.discardMessage}>{t('updatePhoto.discardMessage')}</Text>
              <View style={styles.discardActions}>
                <LiquidGlassButton
                  title={t('updatePhoto.keepEditing')}
                  onPress={handleKeepEditing}
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                />
                <LiquidGlassButton
                  title={t('updatePhoto.discard')}
                  onPress={handleDiscardPhoto}
                  variant="destructive"
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('updatePhoto.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.choiceContent}>
        <Text style={styles.title}>{t('updatePhoto.addNewPhoto')}</Text>
        <Text style={styles.bodyText}>{t('updatePhoto.addNewSubtitle')}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <LiquidGlassButton
          title={t('updatePhoto.takePhoto')}
          onPress={handleTakePhoto}
          variant="primary"
          size="lg"
          style={{ marginTop: 24 }}
        />
        <LiquidGlassButton
          title={t('updatePhoto.chooseFromLibrary')}
          onPress={handleChooseFromLibrary}
          variant="secondary"
          size="lg"
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cameraContainer: {
    backgroundColor: '#000000',
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 46,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  cameraSpacer: {
    width: 78,
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
  cancelText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  captureButton: {
    alignItems: 'center',
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
  centerContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  choiceContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
  },
  discardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  discardMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  discardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
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
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 18,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notePreview: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 220,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
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
  smallLightButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: 78,
  },
  smallLightButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
});
