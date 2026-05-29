import type React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  height?: number;
}

export function ScreenHeader({
  title,
  subtitle,
  rightElement,
  height = 200,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.background} />
      <View style={styles.lightWash} />
      <View style={styles.darkLayer} />
      <View style={styles.plantOne} />
      <View style={styles.plantTwo} />
      <View style={styles.rockOne} />
      <View style={styles.rockTwo} />
      <View style={styles.bubbleOne} />
      <View style={styles.bubbleTwo} />
      <View style={styles.bubbleThree} />
      <View style={styles.bubbleFour} />

      <View style={styles.content}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.aquariumLight,
  },
  bubbleFour: {
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
    borderColor: 'rgba(255, 255, 255, 0.56)',
    borderRadius: 999,
    borderWidth: 1,
    height: 14,
    position: 'absolute',
    right: 220,
    top: 74,
    width: 14,
  },
  bubbleOne: {
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
    borderColor: 'rgba(255, 255, 255, 0.66)',
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    position: 'absolute',
    right: 122,
    top: 48,
    width: 30,
  },
  bubbleThree: {
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    borderColor: 'rgba(255, 255, 255, 0.60)',
    borderRadius: 999,
    borderWidth: 1,
    height: 20,
    position: 'absolute',
    right: 82,
    top: 112,
    width: 20,
  },
  bubbleTwo: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 999,
    borderWidth: 1,
    height: 16,
    position: 'absolute',
    right: 172,
    top: 92,
    width: 16,
  },
  container: {
    backgroundColor: colors.aquariumLight,
    marginBottom: -16,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    paddingBottom: 34,
  },
  darkLayer: {
    backgroundColor: '#00B4D8',
    borderTopLeftRadius: 150,
    height: 168,
    opacity: 0.28,
    position: 'absolute',
    right: -70,
    top: 18,
    transform: [{ rotate: '-12deg' }],
    width: 290,
  },
  lightWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    borderBottomRightRadius: 220,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '68%',
  },
  plantOne: {
    backgroundColor: 'rgba(22, 130, 80, 0.44)',
    borderRadius: 999,
    bottom: 22,
    height: 82,
    position: 'absolute',
    right: 26,
    transform: [{ rotate: '18deg' }],
    width: 13,
  },
  plantTwo: {
    backgroundColor: 'rgba(22, 130, 80, 0.30)',
    borderRadius: 999,
    bottom: 18,
    height: 68,
    position: 'absolute',
    right: 52,
    transform: [{ rotate: '-22deg' }],
    width: 11,
  },
  rightElement: {
    flexShrink: 0,
  },
  rockOne: {
    backgroundColor: 'rgba(0, 79, 128, 0.18)',
    borderRadius: 999,
    bottom: 14,
    height: 34,
    position: 'absolute',
    right: 18,
    width: 92,
  },
  rockTwo: {
    backgroundColor: 'rgba(0, 79, 128, 0.12)',
    borderRadius: 999,
    bottom: 10,
    height: 28,
    position: 'absolute',
    right: 88,
    width: 78,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  textGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#0B2D5A',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
