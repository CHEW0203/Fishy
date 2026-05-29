import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { CompatibilityLevel } from '@/types';

const COMPAT_CONFIG: Record<CompatibilityLevel, { label: string; color: string; bg: string }> = {
  caution: { label: 'Caution', color: colors.compatCaution, bg: '#FEF8E8' },
  danger: { label: 'Danger', color: colors.compatDanger, bg: '#FDECEA' },
  safe: { label: 'Safe', color: colors.compatSafe, bg: '#E8F8EF' },
  unknown: { label: 'Unknown', color: colors.textMuted, bg: '#F0F0F0' },
};

interface CompatibilityBadgeProps {
  level: CompatibilityLevel;
  size?: 'small' | 'large';
}

export function CompatibilityBadge({ level, size = 'small' }: CompatibilityBadgeProps) {
  const config = COMPAT_CONFIG[level];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'large' && styles.large]}>
      <Text style={[styles.label, { color: config.color }, size === 'large' && styles.largeLabel]}>
        {config.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  large: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  largeLabel: {
    fontSize: 15,
    letterSpacing: 1,
  },
});
