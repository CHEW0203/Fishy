import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import { getCompatibilityLevelLabel } from '@/i18n/formatters';
import type { CompatibilityLevel, PairCompatibilityResult } from '@/types';

function getBadgeStyle(level: CompatibilityLevel) {
  if (level === 'danger') {
    return styles.badgeDanger;
  }

  if (level === 'caution' || level === 'unknown') {
    return styles.badgeCaution;
  }

  return styles.badgeSafe;
}

function getBadgeTextStyle(level: CompatibilityLevel) {
  if (level === 'caution' || level === 'unknown') {
    return styles.badgeTextDark;
  }

  return styles.badgeTextLight;
}

function parsePairResults(value: string | string[] | undefined): PairCompatibilityResult[] {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? (parsed as PairCompatibilityResult[]) : [];
  } catch {
    return [];
  }
}

export default function CompatibilityWarningScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{
    newFishName?: string;
    newSpeciesName?: string;
    level?: CompatibilityLevel;
    summary?: string;
    pairResultsJson?: string;
    limitationNote?: string;
  }>();
  const level = params.level ?? 'caution';
  const pairResults = parsePairResults(params.pairResultsJson);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('compat.title')}</Text>
      <View style={[styles.statusBadge, getBadgeStyle(level)]}>
        <Text style={[styles.badgeText, getBadgeTextStyle(level)]}>{getCompatibilityLevelLabel(level, t)}</Text>
      </View>

      <Text style={styles.newFish}>
        {t('compat.newFish', {
          name: params.newFishName || t('compat.unnamedFish'),
          species: params.newSpeciesName || t('compat.unknownSpecies'),
        })}
      </Text>
      <Text style={styles.summary}>
        {params.summary || t('compat.defaultSummary')}
      </Text>

      <View style={styles.cards}>
        {pairResults.map((pairResult) => (
          <View key={pairResult.existingFishId} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>{pairResult.existingFishName}</Text>
                <Text style={styles.cardSubtitle}>{pairResult.existingSpeciesName}</Text>
              </View>
              <View style={[styles.smallBadge, getBadgeStyle(pairResult.level)]}>
                <Text style={[styles.smallBadgeText, getBadgeTextStyle(pairResult.level)]}>
                  {getCompatibilityLevelLabel(pairResult.level, t)}
                </Text>
              </View>
            </View>
            {pairResult.reasons.map((reason) => (
              <Text key={reason} style={styles.reason}>
                - {reason}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.note}>{params.limitationNote || t('compat.limitationNote')}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, level === 'danger' && styles.primaryButtonDanger]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryButtonText, level === 'danger' && styles.primaryButtonTextDanger]}>
            {t('compat.continueAnyway')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>{t('compat.goBackChange')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 22,
  },
  badgeCaution: {
    backgroundColor: colors.compatCaution,
  },
  badgeDanger: {
    backgroundColor: colors.compatDanger,
  },
  badgeSafe: {
    backgroundColor: colors.compatSafe,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgeTextDark: {
    color: colors.text,
  },
  badgeTextLight: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cards: {
    gap: 12,
    marginTop: 18,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    paddingTop: 64,
  },
  newFish: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 18,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
  primaryButtonDanger: {
    backgroundColor: colors.surface,
    borderColor: colors.compatDanger,
    borderWidth: 1.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButtonTextDanger: {
    color: colors.compatDanger,
  },
  reason: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  smallBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
});
