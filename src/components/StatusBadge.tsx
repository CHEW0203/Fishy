import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/i18n/I18nProvider';
import { getStatusLabel } from '@/i18n/formatters';
import { colors } from '@/constants/colors';
import type { FishStatus } from '@/types';

const STATUS_BG: Record<FishStatus, { color: string; bg: string }> = {
  alive: { color: colors.statusAlive, bg: '#E8F8EF' },
  dead: { color: colors.statusDead, bg: '#F0F0F0' },
  given_away: { color: colors.statusGivenAway, bg: '#F3ECF8' },
  missing: { color: colors.statusMissing, bg: '#FEF3E8' },
  sold: { color: colors.statusSold, bg: '#E8F4FD' },
};

interface StatusBadgeProps {
  status: FishStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useI18n();
  const config = STATUS_BG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{getStatusLabel(status, t)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
  },
});
