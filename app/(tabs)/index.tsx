import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { colors } from '@/constants/colors';
import { OWNER_ID } from '@/constants/owner';
import { useI18n } from '@/i18n/I18nProvider';
import { formatReminderDueText, getDurationText, getReminderTypeTitle, getStatusLabel } from '@/i18n/formatters';
import { getDashboardSummary } from '@/services/fishService';
import {
  completeReminder,
  ensureGlobalReminders,
  generatePhotoUpdateReminders,
  getReminders,
  markPhotoReminderDone,
} from '@/services/reminderService';
import type { DashboardSummary, PhotoUpdateReminder, Reminder } from '@/types';

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return -1;
  const start = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(days) && days >= 0 ? days : -1;
}

type ReminderPriority = 'overdue' | 'due_today' | 'upcoming';

function getReminderPriority(nextDueAt: string): ReminderPriority {
  const now = new Date();
  const due = new Date(nextDueAt);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  if (due < now) return 'overdue';
  if (due <= todayEnd) return 'due_today';
  return 'upcoming';
}

const PRIORITY_ORDER: Record<ReminderPriority, number> = {
  overdue: 0,
  due_today: 1,
  upcoming: 2,
};

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconCircle}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.statWave}>~~~</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { t, language } = useI18n();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [storedReminders, setStoredReminders] = useState<Reminder[]>([]);
  const [photoReminders, setPhotoReminders] = useState<PhotoUpdateReminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const sortedStoredReminders = [...storedReminders].sort((a, b) => {
    const pa = PRIORITY_ORDER[getReminderPriority(a.next_due_at)];
    const pb = PRIORITY_ORDER[getReminderPriority(b.next_due_at)];
    if (pa !== pb) return pa - pb;
    return new Date(a.next_due_at).getTime() - new Date(b.next_due_at).getTime();
  });

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const data = await getDashboardSummary(OWNER_ID);
      setSummary(data);
    } catch (err) {
      console.error('[Fishy Dashboard] summary load failed:', err);
      setSummaryError(t('dashboard.errorCollection'));
    } finally {
      setSummaryLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSummary();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadSummary]);

  const loadReminders = useCallback(async () => {
    setLoadingReminders(true);
    setReminderError(null);

    try {
      await ensureGlobalReminders(OWNER_ID);

      const [stored, computed] = await Promise.all([
        getReminders(OWNER_ID),
        generatePhotoUpdateReminders(OWNER_ID),
      ]);

      setStoredReminders(stored);
      setPhotoReminders(computed);
    } catch (err) {
      console.error('[Fishy Dashboard] reminder load failed:', err);
      setReminderError(t('dashboard.errorReminders'));
    } finally {
      setLoadingReminders(false);
    }
  }, [t]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReminders();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadReminders]);

  const handleMarkDone = useCallback(
    async (reminder: Reminder) => {
      try {
        await completeReminder(reminder.id, reminder.frequency);
        await loadReminders();
      } catch {
        // Refresh after successful completion is the source of truth for this small dashboard widget.
      }
    },
    [loadReminders],
  );

  const handleMarkPhotoDone = useCallback(
    async (fishId: string) => {
      try {
        await markPhotoReminderDone(OWNER_ID, fishId);
        await loadReminders();
      } catch (err) {
        console.error('[Fishy Dashboard] photo reminder completion failed:', err);
        await loadReminders();
      }
    },
    [loadReminders],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.dashboardFrame}>
      <View style={styles.heroContainer}>
        <View style={styles.heroBackground} />
        <View style={styles.heroLightWash} />
        <View style={styles.heroGlow} />
        <View style={styles.heroDarkLayer} />
        <View style={styles.heroRock1} />
        <View style={styles.heroRock2} />
        <View style={styles.heroPlant1} />
        <View style={styles.heroPlant2} />
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />
        <View style={styles.bubble3} />
        <View style={styles.bubble4} />
        <View style={styles.bubble5} />
        <Ionicons
          name="fish-outline"
          size={124}
          color="rgba(0, 84, 128, 0.20)"
          style={styles.heroFishIcon}
        />
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>Fishy</Text>
          <Text style={styles.heroSubtitle}>{t('dashboard.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          activeOpacity={0.8}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          {!loadingReminders && (sortedStoredReminders.length > 0 || photoReminders.length > 0) && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {Math.min(sortedStoredReminders.length + photoReminders.length, 9)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.summarySection}>
        {summaryLoading && (
          <View style={styles.summaryLoading}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.summaryLoadingText}>{t('dashboard.loadingCollection')}</Text>
          </View>
        )}

        {!summaryLoading && summaryError && (
          <View style={styles.summaryErrorBox}>
            <Text style={styles.summaryErrorText}>{summaryError}</Text>
            <LiquidGlassButton
              title={t('common.retry')}
              onPress={loadSummary}
              variant="primary"
              size="md"
              fullWidth={false}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {!summaryLoading && !summaryError && summary && summary.totalFishCount === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="fish-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('dashboard.welcomeTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('dashboard.welcomeSubtitle')}</Text>
            <View style={styles.emptyActions}>
              <LiquidGlassButton
                title={t('dashboard.goToCollection')}
                onPress={() => router.push('/(tabs)/collection')}
                variant="primary"
                size="md"
              />
              <LiquidGlassButton
                title={t('dashboard.scanFish')}
                onPress={() => router.push('/(tabs)/scan')}
                variant="secondary"
                size="md"
              />
            </View>
          </View>
        )}

        {!summaryLoading && !summaryError && summary && summary.totalFishCount > 0 && (
          <>
            <View style={styles.statRow}>
              <StatCard icon="fish" label={t('dashboard.activeFish')} value={summary.activeFishCount} />
              <StatCard icon="fish-outline" label={t('dashboard.totalFish')} value={summary.totalFishCount} />
              <StatCard icon="leaf-outline" label={t('dashboard.species')} value={summary.uniqueSpeciesCount} />
            </View>

            <View style={styles.dashboardSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="camera-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>{t('dashboard.recentlyAdded')}</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/collection')}
                  style={styles.viewAllButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewAllText}>{t('dashboard.viewAll')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {summary.recentlyAddedFish.length === 0 ? (
                <View style={styles.recentlyAddedEmpty}>
                  <Ionicons name="fish-outline" size={28} color={colors.textMuted} />
                  <Text style={styles.recentlyAddedEmptyText}>{t('dashboard.noFishYet')}</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {summary.recentlyAddedFish.map((fish) => {
                    const isAlive = String(fish.status).toLowerCase() === 'alive';

                    return (
                      <TouchableOpacity
                        key={fish.id}
                        style={styles.fishCard}
                        activeOpacity={0.85}
                        onPress={() => router.push(`/(tabs)/collection/${fish.id}`)}
                      >
                        {fish.current_photo?.photo_url ? (
                          <Image
                            source={{ uri: fish.current_photo.photo_url }}
                            style={styles.fishCardImage}
                          />
                        ) : (
                          <View style={styles.fishCardImagePlaceholder}>
                            <Ionicons name="fish-outline" size={32} color="rgba(0, 119, 182, 0.35)" />
                          </View>
                        )}
                        <View
                          style={[
                            styles.statusPill,
                            isAlive ? styles.statusPillAlive : styles.statusPillInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              isAlive ? styles.statusPillTextAlive : styles.statusPillTextInactive,
                            ]}
                          >
                            {getStatusLabel(fish.status, t)}
                          </Text>
                        </View>
                        <View style={styles.fishCardInfo}>
                          <Text style={styles.fishCardName} numberOfLines={1}>
                            {fish.name}
                          </Text>
                          <Text style={styles.fishCardSpecies} numberOfLines={1}>
                            {fish.species?.common_name ?? t('dashboard.noSpeciesLinked')}
                          </Text>
                          {fish.created_at && daysSince(fish.created_at) >= 0 && (
                            <View style={styles.fishCardDateRow}>
                              <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
                              <Text style={styles.fishCardDate}>
                                {t('dashboard.addedAgo', { duration: getDurationText(daysSince(fish.created_at), t) })}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {summary.longestKeptFish ? (
              <TouchableOpacity
                style={styles.longestKeptBanner}
                activeOpacity={0.85}
                onPress={() => router.push(`/(tabs)/collection/${summary.longestKeptFish!.id}`)}
              >
                <View style={styles.longestBubble1} />
                <View style={styles.longestBubble2} />
                <View style={styles.longestPlant} />
                <View style={styles.longestKeptLeft}>
                  <Ionicons name="trophy-outline" size={18} color="#FFFFFF" style={{ marginBottom: 8 }} />
                  <Text style={styles.longestKeptHeader}>{t('dashboard.longestKept')}</Text>
                </View>
                <View style={styles.longestKeptContent}>
                  <View style={styles.longestKeptAvatarCircle}>
                    {summary.longestKeptFish.current_photo?.photo_url ? (
                      <Image
                        source={{ uri: summary.longestKeptFish.current_photo.photo_url }}
                        style={styles.longestKeptAvatarImage}
                      />
                    ) : (
                      <Ionicons name="fish" size={28} color={colors.primaryLighter} />
                    )}
                  </View>
                  <View style={styles.longestKeptInfo}>
                    <Text style={styles.longestKeptFishName} numberOfLines={1}>
                      {summary.longestKeptFish.name}
                    </Text>
                    <Text style={styles.longestKeptSpecies} numberOfLines={1}>
                      {summary.longestKeptFish.species?.common_name ?? t('dashboard.noSpeciesLinked')}
                    </Text>
                  </View>
                  <View style={styles.longestKeptDurationBadge}>
                    <Text style={styles.longestKeptDurationText}>
                      {daysSince(summary.longestKeptFish.start_date) >= 0
                        ? getDurationText(daysSince(summary.longestKeptFish.start_date), t)
                        : t('fishDetail.durationUnavailable')}
                    </Text>
                    <Text style={styles.longestKeptDurationLabel}>{t('dashboard.sinceAdded')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.longestKeptBanner}>
                <View style={styles.longestBubble1} />
                <View style={styles.longestBubble2} />
                <View style={styles.longestPlant} />
                <View style={styles.longestKeptLeft}>
                  <Ionicons name="trophy-outline" size={18} color="#FFFFFF" style={{ marginBottom: 8 }} />
                  <Text style={styles.longestKeptHeader}>{t('dashboard.longestKept')}</Text>
                </View>
                <Text style={styles.longestKeptEmptyText}>{t('dashboard.noActiveFish')}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.reminderSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconCircle}>
            <Ionicons name="notifications-outline" size={14} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>{t('dashboard.careReminders')}</Text>
        </View>

        {loadingReminders && (
          <View style={styles.reminderLoading}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.reminderLoadingText}>{t('dashboard.loadingReminders')}</Text>
          </View>
        )}

        {!loadingReminders && reminderError && (
          <View style={styles.reminderErrorBox}>
            <Text style={styles.reminderErrorText}>{reminderError}</Text>
            <TouchableOpacity onPress={loadReminders}>
              <Text style={styles.reminderRetryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loadingReminders &&
          !reminderError &&
          sortedStoredReminders.length === 0 &&
          photoReminders.length === 0 && (
            <View style={styles.remindersAllClearCard}>
              <View style={styles.reminderIconCircle}>
                <Ionicons name="water-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.remindersAllClearText}>
                <Text style={styles.remindersAllClearTitle}>{t('dashboard.allClear')}</Text>
                <Text style={styles.remindersAllClearSub}>{t('dashboard.noRemindersDue')}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={26} color={colors.compatSafe} />
            </View>
          )}

        {!loadingReminders && !reminderError && !bannerDismissed &&
          (sortedStoredReminders.length > 0 || photoReminders.length > 0) && (
            <View style={styles.reminderBanner}>
              <Ionicons name="notifications-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.reminderBannerText}>
                {t('notifications.careReminderCount', {
                  count: sortedStoredReminders.length + photoReminders.length,
                })}
              </Text>
              <TouchableOpacity onPress={() => setBannerDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

        {!loadingReminders && !reminderError && (
          <>
            {sortedStoredReminders.slice(0, 5).map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderCardIcon}>
                  <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.reminderCardLeft}>
                  <Text style={styles.reminderCardTitle}>
                    {getReminderTypeTitle(reminder.type, t, reminder.title)}
                  </Text>
                  <Text style={styles.reminderCardMeta}>
                    {formatReminderDueText(reminder.next_due_at, t, language)}
                  </Text>
                </View>
                <LiquidGlassButton
                  title={t('common.done')}
                  onPress={() => handleMarkDone(reminder)}
                  variant="primary"
                  size="sm"
                  fullWidth={false}
                />
              </View>
            ))}

            {photoReminders.slice(0, Math.max(0, 5 - sortedStoredReminders.length)).map((reminder) => (
              <View key={reminder.fishId} style={styles.reminderCard}>
                <View style={styles.reminderCardIcon}>
                  <Ionicons name="camera-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.reminderCardLeft}>
                  <Text style={styles.reminderCardTitle}>
                    {t('dashboard.photoReminderTitle', { fishName: reminder.fishName })}
                  </Text>
                  <Text style={styles.reminderCardMeta}>
                    {reminder.lastPhotoAt
                      ? t('dashboard.lastPhotoDaysAgo', { days: reminder.daysSinceLastPhoto })
                      : t('dashboard.noPhotoRecord')}
                  </Text>
                </View>
                <LiquidGlassButton
                  title={t('common.done')}
                  onPress={() => handleMarkPhotoDone(reminder.fishId)}
                  variant="primary"
                  size="sm"
                  fullWidth={false}
                />
              </View>
            ))}
          </>
        )}
      </View>
      </View>

      <NotificationCenterModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        storedReminders={sortedStoredReminders}
        photoReminders={photoReminders}
        onMarkDone={handleMarkDone}
        onMarkPhotoDone={handleMarkPhotoDone}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bellBadge: {
    alignItems: 'center',
    backgroundColor: colors.compatDanger,
    borderColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -1,
    top: -1,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  bellButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    top: 82,
    width: 56,
  },
  reminderBanner: {
    alignItems: 'center',
    backgroundColor: colors.glassBlueLight,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reminderBannerText: {
    color: colors.primary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  bubble1: {
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderRadius: 999,
    height: 34,
    position: 'absolute',
    right: 134,
    top: 72,
    width: 34,
  },
  bubble2: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderWidth: 1,
    borderRadius: 999,
    height: 18,
    position: 'absolute',
    right: 170,
    top: 126,
    width: 18,
  },
  bubble3: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderColor: 'rgba(255, 255, 255, 0.68)',
    borderWidth: 1,
    borderRadius: 999,
    height: 15,
    position: 'absolute',
    right: 64,
    top: 62,
    width: 15,
  },
  bubble4: {
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
    borderColor: 'rgba(255, 255, 255, 0.56)',
    borderRadius: 999,
    borderWidth: 1,
    height: 25,
    position: 'absolute',
    right: 86,
    top: 168,
    width: 25,
  },
  bubble5: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 999,
    borderWidth: 1,
    height: 12,
    position: 'absolute',
    right: 220,
    top: 100,
    width: 12,
  },
  container: {
    backgroundColor: colors.aquariumMist,
    flex: 1,
  },
  content: {
    paddingBottom: 116,
    width: '100%',
  },
  dashboardSection: {
    marginTop: 26,
  },
  emptyActions: {
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  emptyIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.glassBlueLight,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
    width: 56,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.glassWhite,
    borderColor: colors.glassBorder,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 5,
    padding: 24,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  fishCard: {
    backgroundColor: colors.glassWhite,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: 22,
    borderWidth: 1,
    elevation: 6,
    height: 250,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    width: 162,
  },
  fishCardDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  fishCardDateRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(0, 119, 182, 0.11)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
    paddingTop: 12,
  },
  fishCardImage: {
    height: 124,
    resizeMode: 'cover',
    width: '100%',
  },
  fishCardImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.aquariumLight,
    height: 124,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  fishCardInfo: {
    padding: 14,
  },
  fishCardName: {
    color: '#0B2D5A',
    fontSize: 16,
    fontWeight: '800',
  },
  fishCardSpecies: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  heroBackground: {
    backgroundColor: colors.aquariumLight,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroContainer: {
    height: 292,
    marginBottom: -34,
    marginHorizontal: -18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDarkLayer: {
    backgroundColor: colors.primaryLight,
    borderTopLeftRadius: 180,
    bottom: 8,
    height: 178,
    opacity: 0.36,
    position: 'absolute',
    right: -86,
    transform: [{ rotate: '-10deg' }],
    width: 330,
  },
  heroFishIcon: {
    bottom: 66,
    position: 'absolute',
    right: 28,
  },
  heroGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderRadius: 180,
    height: 280,
    left: -118,
    position: 'absolute',
    top: -36,
    width: 280,
  },
  heroLightWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderBottomRightRadius: 260,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '72%',
  },
  heroPlant1: {
    backgroundColor: 'rgba(39, 174, 96, 0.34)',
    borderRadius: 999,
    bottom: 40,
    height: 86,
    position: 'absolute',
    right: 18,
    transform: [{ rotate: '18deg' }],
    width: 12,
  },
  heroPlant2: {
    backgroundColor: 'rgba(39, 174, 96, 0.26)',
    borderRadius: 999,
    bottom: 36,
    height: 74,
    position: 'absolute',
    right: 43,
    transform: [{ rotate: '-22deg' }],
    width: 10,
  },
  heroRock1: {
    backgroundColor: 'rgba(0, 79, 128, 0.22)',
    borderRadius: 999,
    bottom: 24,
    height: 44,
    position: 'absolute',
    right: 24,
    width: 96,
  },
  heroRock2: {
    backgroundColor: 'rgba(0, 79, 128, 0.16)',
    borderRadius: 999,
    bottom: 20,
    height: 34,
    position: 'absolute',
    right: 92,
    width: 88,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: '500',
    marginTop: 6,
  },
  heroTextContainer: {
    left: 24,
    position: 'absolute',
    top: 132,
  },
  heroTitle: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 0,
  },
  longestKeptAvatarCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: 34,
    borderWidth: 2,
    height: 68,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 68,
  },
  longestKeptAvatarImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  longestBubble1: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    height: 58,
    position: 'absolute',
    right: 18,
    top: 16,
    width: 58,
  },
  longestBubble2: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    bottom: 34,
    height: 18,
    position: 'absolute',
    right: 140,
    width: 18,
  },
  longestKeptBanner: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    elevation: 8,
    marginTop: 28,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
  },
  longestKeptContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  longestKeptDurationBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 24,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  longestKeptDurationLabel: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 10,
    marginTop: 2,
  },
  longestKeptDurationText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  longestKeptEmptyText: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 14,
  },
  longestKeptFishName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  longestKeptHeader: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  longestKeptInfo: {
    flex: 1,
  },
  longestKeptLeft: {},
  longestPlant: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    bottom: -18,
    height: 116,
    position: 'absolute',
    right: 42,
    transform: [{ rotate: '-18deg' }],
    width: 18,
  },
  longestKeptSpecies: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 15,
    marginTop: 5,
  },
  dashboardFrame: {
    paddingHorizontal: 18,
    width: '100%',
  },
  recentlyAddedEmpty: {
    alignItems: 'center',
    backgroundColor: colors.glassWhite,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  recentlyAddedEmptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  reminderCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderColor: colors.glassBorder,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  reminderCardIcon: {
    alignItems: 'center',
    backgroundColor: colors.glassBlueLight,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  reminderCardLeft: {
    flex: 1,
  },
  reminderCardMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  reminderCardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  reminderErrorBox: {
    alignItems: 'center',
    backgroundColor: colors.glassWhite,
    borderColor: colors.glassBorder,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  reminderErrorText: {
    color: colors.compatDanger,
    fontSize: 14,
    textAlign: 'center',
  },
  reminderIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.glassBlueLight,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  reminderLoading: {
    alignItems: 'center',
    backgroundColor: colors.glassWhite,
    borderColor: colors.glassBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    padding: 20,
  },
  reminderLoadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  reminderRetryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  reminderSection: {
    backgroundColor: colors.glassWhite,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: 28,
    borderWidth: 1,
    elevation: 7,
    marginTop: 28,
    padding: 20,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
  },
  remindersAllClearCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderColor: 'rgba(0, 119, 182, 0.12)',
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  remindersAllClearSub: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  remindersAllClearText: {
    flex: 1,
  },
  remindersAllClearTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  sectionIconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 180, 216, 0.16)',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    marginRight: 10,
    width: 34,
  },
  sectionTitle: {
    color: '#0B2D5A',
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.glassWhite,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 7,
    flex: 1,
    minHeight: 144,
    paddingHorizontal: 8,
    paddingVertical: 18,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  statIconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderColor: 'rgba(0, 119, 182, 0.12)',
    borderRadius: 28,
    borderWidth: 1,
    elevation: 3,
    height: 56,
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    width: 56,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  statNumber: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 0,
  },
  statWave: {
    color: 'rgba(0, 119, 182, 0.32)',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  statusPillAlive: {
    backgroundColor: colors.compatSafe,
  },
  statusPillInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextAlive: {
    color: '#FFFFFF',
  },
  statusPillTextInactive: {
    color: '#FFFFFF',
  },
  summaryErrorBox: {
    alignItems: 'center',
    backgroundColor: colors.glassWhite,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  summaryErrorText: {
    color: colors.compatDanger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  summaryLoading: {
    alignItems: 'center',
    backgroundColor: colors.glassWhite,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    padding: 20,
  },
  summaryLoadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  summarySection: {
    marginTop: 0,
  },
  viewAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
});
