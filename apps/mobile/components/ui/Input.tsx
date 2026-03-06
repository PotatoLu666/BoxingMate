import React from 'react';
import { View, Text, TextInput, type TextInputProps, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          {
            backgroundColor: colors.inputBg,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.inputBorder,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}
