import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function FloatingLabelInput({ label, error, onFocus, onBlur, ...props }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useTheme();

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 8,
          color: isFocused ? colors.brand : colors.textMuted,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          borderWidth: isFocused ? 2 : 1,
          borderRadius: 16,
          borderColor: isFocused ? colors.brand : error ? colors.danger : colors.border,
          backgroundColor: isFocused ? colors.surface : colors.input,
        }}
      >
        <TextInput
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.textSoft}
          style={[
            {
              padding: 16,
              fontSize: 15,
              color: colors.text,
              minHeight: props.multiline ? 110 : 52,
              textAlignVertical: props.multiline ? 'top' : 'center',
            },
            props.style,
          ]}
        />
      </View>
      {error && (
        <Text style={{ fontSize: 12, marginTop: 4, color: colors.danger }}>{error}</Text>
      )}
    </View>
  );
}
