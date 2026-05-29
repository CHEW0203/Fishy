import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import {
  formatReminderDueText,
  getReminderTypeTitle,
} from '@/i18n/formatters';
import type { PhotoUpdateReminder, Reminder } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  storedReminders: Reminder[];
  photoReminders: PhotoUpdateReminder[];
  onMarkDone: (reminder: Reminder) => Promise<void>;
  onMarkPhotoDone: (fishId: string) => Promise<void>;
}

export function NotificationCenterModal({
  visible,
  onClose,
  storedReminders,
  photoReminders,
  onMarkDone,
  onMarkPhotoDone,
}: Props) {
  const { t, language } = useI18n();

  const hasItems = storedReminders.length > 0 || photoReminders.length > 0;

  function getReminderMessage(type: string): string {
    if (type === 'feeding') return t('notifications.feedingMessage');
    if (type === 'health_check') return t('notifications.healthCheckMessage');
    return '';
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {!hasItems && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="checkmark-circle-outline" size={32} color={colors.compatSafe} />
                </View>
                <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
              </View>
            )}

            {storedReminders.map((reminder) => (
              <View key={reminder.id} style={styles.notifCard}>
                <View style={styles.notifCardLeft}>
                  <View style={styles.notifIconCircle}>
                    <Ionicons
                      name={reminder.type === 'feeding' ? 'restaurant-outline' : 'medkit-outline'}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.notifCardContent}>
                    <Text style={styles.notifTitle}>
                      {getReminderTypeTitle(reminder.type, t, reminder.title)}
                    </Text>
                    {getReminderMessage(reminder.type) !== '' && (
                      <Text style={styles.notifMessage}>{getReminderMessage(reminder.type)}</Text>
                    )}
                    <Text style={styles.notifMeta}>
                      {formatReminderDueText(reminder.next_due_at, t, language)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => void onMarkDone(reminder)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneBtnText}>{t('common.done')}</Text>
                </TouchableOpacity>
              </View>
            ))}

            {photoReminders.map((reminder) => (
              <View key={reminder.fishId} style={styles.notifCard}>
                <View style={styles.notifCardLeft}>
                  <View style={styles.notifIconCircle}>
                    <Ionicons name="camera-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.notifCardContent}>
                    <Text style={styles.notifTitle}>
                      {t('reminders.photoUpdate')}
                    </Text>
                    <Text style={styles.notifMessage}>
                      {t('notifications.photoUpdateMessage', { fishName: reminder.fishName })}
                    </Text>
                    {reminder.lastPhotoAt ? (
                      <Text style={styles.notifMeta}>
                        {t('dashboard.lastPhotoDaysAgo', { days: reminder.daysSinceLastPhoto })}
                      </Text>
                    ) : (
                      <Text style={styles.notifMeta}>{t('dashboard.noPhotoRecord')}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => void onMarkPhotoDone(reminder.fishId)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneBtnText}>{t('common.done')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(27, 42, 59, 0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.glassSurface,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 18,
    maxHeight: '85%',
    paddingBottom: 28,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.inactive,
    borderRadius: 2,
    height: 4,
    marginBottom: 4,
    marginTop: 12,
    width: 36,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  headerIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.glassBlueLight,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
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
  content: {
    gap: 10,
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  emptyIconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.12)',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  notifCard: {
    alignItems: 'center',
    backgroundColor: colors.glassWhite,
    borderColor: colors.glassBorder,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  notifCardLeft: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  notifIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.glassBlueLight,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  notifCardContent: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  notifMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  notifMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
