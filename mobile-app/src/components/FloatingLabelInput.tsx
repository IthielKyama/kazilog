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
    <View className="mb-4">
      <Text className="text-sm font-semibold mb-2" style={{ color: colors.textMuted }}>{label}</Text>
      <View 
        className="border rounded-2xl"
        style={{
          borderColor: isFocused ? colors.brand : error ? colors.danger : colors.border,
          backgroundColor: isFocused ? colors.surface : colors.input,
        }}
      >
        <TextInput
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`p-4 text-base ${props.multiline ? 'min-h-[100px]' : 'h-14'}`}
          placeholderTextColor={colors.textSoft}
          style={[{ textAlignVertical: props.multiline ? 'top' : 'center', color: colors.text }, props.style]}
        />
      </View>
      {error && <Text className="text-xs mt-1" style={{ color: colors.danger }}>{error}</Text>}
    </View>
  );
}
