import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import type { FishStatus, UserFish } from '@/types';

interface FishCardProps {
  fish: UserFish;
  onPress: () => void;
}

const INACTIVE_STATUSES: FishStatus[] = ['dead', 'sold', 'given_away', 'missing'];

export function FishCard({ fish, onPress }: FishCardProps) {
  const { t, language } = useI18n();
  const isInactive = INACTIVE_STATUSES.includes(fish.status);
  const speciesName = fish.species?.common_name ?? t('fishCard.unknownSpecies');
  const photoUrl = fish.current_photo?.photo_url;

  function formatStartDate(startDate: string) {
    const date = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return t('fishCard.keptSinceUnknown');
    }
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return t('fishCard.keptSince', {
      date: date.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    });
  }

  return (
    <TouchableOpacity
      style={[styles.card, isInactive && styles.inactiveCard]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="fish-outline" size={28} color={colors.primary} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.nameGroup}>
            <Text style={styles.name} numberOfLines={1}>
              {fish.name}
            </Text>
            <Text style={styles.species} numberOfLines={1}>
              {speciesName}
            </Text>
          </View>
          <StatusBadge status={fish.status} />
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.date}>{formatStartDate(fish.start_date)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 119, 182, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 8,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  name: {
    color: '#0B2D5A',
    fontSize: 17,
    fontWeight: '700',
  },
  nameGroup: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    borderRadius: 12,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  photo: {
    borderRadius: 12,
    height: 86,
    width: 86,
  },
  species: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
