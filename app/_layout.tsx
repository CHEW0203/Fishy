import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { I18nProvider } from '@/i18n/I18nProvider';

export default function RootLayout() {
  return (
    <I18nProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-fish" options={{ headerShown: false }} />
        <Stack.Screen name="compatibility-warning" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="update-photo" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </I18nProvider>
  );
}
