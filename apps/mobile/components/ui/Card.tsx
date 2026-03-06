import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          ...(variant === 'elevated' && !isDark
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }
            : {
                borderWidth: 1,
                borderColor: colors.border,
              }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
