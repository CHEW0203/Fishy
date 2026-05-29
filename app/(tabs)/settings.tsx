import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import type { Language } from '@/i18n/types';

const REMINDER_ROW_DEFS: {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  valueKey: string;
}[] = [
  { icon: 'camera-outline', labelKey: 'settings.photoUpdateReminder', valueKey: 'settings.every30Days' },
  { icon: 'fish-outline', labelKey: 'settings.feedingReminder', valueKey: 'settings.daily' },
  { icon: 'shield-checkmark-outline', labelKey: 'settings.healthCheckReminder', valueKey: 'settings.weekly' },
  { icon: 'notifications-off-outline', labelKey: 'settings.pushNotifications', valueKey: 'settings.notEnabledMvp' },
];

const LANGUAGE_OPTIONS: { value: Language; labelKey: string }[] = [
  { value: 'en', labelKey: 'common.english' },
  { value: 'zh', labelKey: 'common.chinese' },
];

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>{t('settings.reminderPreferences')}</Text>
          {REMINDER_ROW_DEFS.map((row) => (
            <View key={row.icon} style={styles.row}>
              <View style={styles.iconBox}>
                <Ionicons name={row.icon} size={21} color={colors.primary} />
              </View>
              <Text style={styles.rowLabel}>{t(row.labelKey)}</Text>
              <Text style={styles.rowValue}>{t(row.valueKey)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          ))}
          <View style={styles.noticeRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.noticeText}>{t('settings.inAppOnlyNote')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>{t('settings.language')}</Text>
          <Text style={styles.languageSubtitle}>{t('settings.languageSubtitle')}</Text>
          <View style={styles.languageRow}>
            {LANGUAGE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.langOption, language === opt.value && styles.langOptionActive]}
                onPress={() => setLanguage(opt.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    language === opt.value && styles.langOptionTextActive,
                  ]}
                >
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>Fishy v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 119, 182, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    marginHorizontal: 16,
    marginTop: 8,
    paddingBottom: 8,
    paddingTop: 16,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  cardSectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  container: {
    backgroundColor: colors.aquariumMist,
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    paddingTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    marginRight: 12,
    width: 38,
  },
  langOption: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderColor: 'rgba(0, 119, 182, 0.18)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  langOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langOptionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  langOptionTextActive: {
    color: '#FFFFFF',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  languageSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  noticeRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  noticeText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    alignItems: 'center',
    borderTopColor: 'rgba(0, 119, 182, 0.08)',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.primary,
    fontSize: 14,
    marginRight: 6,
  },
  scroll: {
    flex: 1,
  },
  version: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
