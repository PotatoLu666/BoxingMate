import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const bgColors: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surface,
    danger: colors.danger,
    outline: 'transparent',
    ghost: 'transparent',
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.text,
    danger: '#FFFFFF',
    outline: colors.primary,
    ghost: colors.textSecondary,
  };

  const borderColors: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: colors.border,
    danger: undefined,
    outline: colors.primary,
    ghost: undefined,
  };

  const paddings: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 14, paddingHorizontal: 24 },
    lg: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  const fontSizes: Record<ButtonSize, number> = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: bgColors[variant],
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          ...paddings[size],
          ...(borderColors[variant] ? { borderWidth: 1.5, borderColor: borderColors[variant] } : {}),
          ...(fullWidth ? { width: '100%' } : {}),
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <Text
          style={[
            {
              color: textColors[variant],
              fontSize: fontSizes[size],
              fontWeight: '700',
              letterSpacing: 0.3,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
