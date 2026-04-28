import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Animated } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function FloatingLabelInput({ label, error, onFocus, onBlur, ...props }: Props) {
  const [isFocused, setIsFocused] = useState(false);

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
      <Text className="text-sm font-semibold text-slate-600 mb-2">{label}</Text>
      <View 
        className={`border rounded-2xl bg-slate-50 ${
          isFocused ? 'border-emerald-500 bg-white' : error ? 'border-rose-500' : 'border-slate-200'
        }`}
      >
        <TextInput
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`p-4 text-slate-800 text-base ${props.multiline ? 'min-h-[100px]' : 'h-14'}`}
          placeholderTextColor="#94a3b8"
          style={[{ textAlignVertical: props.multiline ? 'top' : 'center' }, props.style]}
        />
      </View>
      {error && <Text className="text-xs text-rose-500 mt-1">{error}</Text>}
    </View>
  );
}
