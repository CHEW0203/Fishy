import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/ErrorMessage';
import { FishCard } from '@/components/FishCard';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';
import { getUserFish } from '@/services/fishService';
import type { UserFish } from '@/types';
import { extractErrorMessage } from '@/utils/errors';

const CONFIG_ERROR =
  'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

export default function CollectionScreen() {
  const { t } = useI18n();
  const [fish, setFish] = useState<UserFish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await getUserFish();
      setFish(results);
    } catch (err) {
      console.error('[Fishy][CollectionScreen] load error:', err);
      setError(extractErrorMessage(err, 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleAddFish = useCallback(() => {
    router.push('/add-fish');
  }, []);

  const renderFish = useCallback(
    ({ item }: { item: UserFish }) => (
      <FishCard
        fish={item}
        onPress={() => router.push(`/(tabs)/collection/${item.id}`)}
      />
    ),
    [],
  );

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner label={t('myFish.loading')} />;
    }

    if (error === CONFIG_ERROR) {
      return (
        <ErrorMessage message="Supabase is not configured. Please set environment variables." />
      );
    }

    if (error) {
      return (
        <ErrorMessage
          message={t('myFish.errorLoad')}
          onRetry={refetch}
        />
      );
    }

    if (fish.length === 0) {
      return (
        <EmptyState
          title={t('myFish.emptyTitle')}
          subtitle={t('myFish.emptySubtitle')}
        />
      );
    }

    return (
      <FlatList
        data={fish}
        renderItem={renderFish}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('tabs.myFish')}
        subtitle={loading ? t('myFish.subtitle') : t('myFish.subtitleWithCount', { count: fish.length })}
        rightElement={
          <LiquidGlassButton
            title={t('myFish.addFishButton')}
            onPress={handleAddFish}
            variant="primary"
            size="sm"
            fullWidth={false}
          />
        }
      />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.aquariumMist,
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
