import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'expo-symbols';
import { Platform, View } from 'react-native';
import type { ColorValue } from 'react-native';

import { colors } from '@/constants/colors';
import { useI18n } from '@/i18n/I18nProvider';

const SCAN_DARK_BLUE = '#004F80';
const webFocusReset = Platform.select({
  web: {
    outlineColor: 'transparent',
    outlineStyle: 'none',
  },
});

interface TabIconProps {
  name: SFSymbol;
  androidName: keyof typeof Ionicons.glyphMap;
  androidFocusedName: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  focused: boolean;
}

function TabIcon({ name, androidName, androidFocusedName, color, focused }: TabIconProps) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name}
        size={22}
        tintColor={color}
        weight={focused ? 'semibold' : 'regular'}
      />
    );
  }

  return (
    <Ionicons
      name={focused ? androidFocusedName : androidName}
      color={String(color)}
      size={22}
    />
  );
}

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderColor: 'rgba(255, 255, 255, 0.86)',
          borderRadius: 28,
          borderTopWidth: 0,
          borderWidth: 1,
          bottom: Platform.OS === 'ios' ? 16 : 12,
          elevation: 14,
          height: Platform.OS === 'ios' ? 86 : 76,
          left: 18,
          paddingBottom: Platform.OS === 'ios' ? 16 : 10,
          paddingHorizontal: 8,
          paddingTop: 10,
          position: 'absolute',
          right: 18,
          shadowColor: colors.glassShadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.16,
          shadowRadius: 24,
        },
        tabBarItemStyle: {
          borderRadius: 24,
          ...webFocusReset,
        } as never,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0,
          ...webFocusReset,
        } as never,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="house"
              androidName="home-outline"
              androidFocusedName="home"
              color={color}
              focused={focused}
            />
          ),
          title: t('tabs.dashboard'),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="list.bullet"
              androidName="list-outline"
              androidFocusedName="list"
              color={color}
              focused={focused}
            />
          ),
          title: t('tabs.myFish'),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: () => (
            <View style={scanTabStyles.circle}>
              {Platform.OS === 'ios' ? (
                <SymbolView
                  name="camera.fill"
                  size={28}
                  tintColor="#FFFFFF"
                  weight="semibold"
                />
              ) : (
                <Ionicons name="camera" color="#FFFFFF" size={28} />
              )}
            </View>
          ),
          title: '',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="books.vertical"
              androidName="book-outline"
              androidFocusedName="book"
              color={color}
              focused={focused}
            />
          ),
          title: t('tabs.library'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="gearshape"
              androidName="settings-outline"
              androidFocusedName="settings"
              color={color}
              focused={focused}
            />
          ),
          title: t('tabs.settings'),
        }}
      />
      <Tabs.Screen
        name="collection/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="library/[id]"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const scanTabStyles = {
  circle: {
    alignItems: 'center' as const,
    backgroundColor: SCAN_DARK_BLUE,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 34,
    borderWidth: 4,
    elevation: 12,
    height: 68,
    justifyContent: 'center' as const,
    marginTop: -34,
    shadowColor: SCAN_DARK_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    width: 68,
  },
};
