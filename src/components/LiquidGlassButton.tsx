import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';

interface LiquidGlassButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function LiquidGlassButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth,
  style,
  textStyle,
}: LiquidGlassButtonProps) {
  const shouldStretch = fullWidth ?? size !== 'sm';
  const radiusStyle = size === 'sm' ? styles.radius_sm : styles.radius_mdLg;
  const indicatorColor = variant === 'secondary' || variant === 'ghost' ? colors.primary : '#FFFFFF';

  const containerStyle = [
    styles.base,
    styles[`size_${size}`],
    radiusStyle,
    styles[`variant_${variant}`],
    shouldStretch ? styles.fullWidth : styles.autoWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      accessibilityRole="button"
      accessible
    >
      <View style={[styles.sheen, radiusStyle, { pointerEvents: 'none' }]} />
      <View style={styles.content}>
        {!loading && leftIcon}
        {loading ? (
          <ActivityIndicator color={indicatorColor} size="small" />
        ) : (
          <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
            {title}
          </Text>
        )}
        {!loading && rightIcon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  autoWidth: {
    alignSelf: 'flex-start',
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  radius_mdLg: {
    borderRadius: 14,
  },
  radius_sm: {
    borderRadius: 10,
  },
  sheen: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    height: '34%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  size_lg: {
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  size_md: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  size_sm: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  text: {
    letterSpacing: 0,
    textAlign: 'center',
  },
  text_destructive: {
    color: '#FFFFFF',
  },
  text_ghost: {
    color: colors.primary,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: colors.primary,
  },
  textSize_lg: {
    fontSize: 16,
    fontWeight: '800',
  },
  textSize_md: {
    fontSize: 15,
    fontWeight: '700',
  },
  textSize_sm: {
    fontSize: 13,
    fontWeight: '700',
  },
  variant_destructive: {
    backgroundColor: 'rgba(231, 76, 60, 0.90)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  variant_ghost: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(0, 119, 182, 0.30)',
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  variant_primary: {
    backgroundColor: 'rgba(0, 119, 182, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#004F80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
  },
  variant_secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(0, 119, 182, 0.45)',
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },
});
