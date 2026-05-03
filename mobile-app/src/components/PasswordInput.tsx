import { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { useTheme } from '../theme/ThemeContext';

type PasswordInputProps = TextInputProps & {
  label: string;
};

export function PasswordInput({ label, style, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useTheme();

  return (
    <View>
      <Text
        style={{
          marginBottom: 8,
          fontSize: 13,
          fontWeight: '600',
          color: isFocused ? colors.brand : colors.text,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 14,
          borderWidth: isFocused ? 2 : 1,
          borderColor: isFocused ? colors.brand : colors.border,
          backgroundColor: colors.input,
          paddingHorizontal: 16,
        }}
      >
        <TextInput
          {...props}
          secureTextEntry={!visible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.textSoft}
          style={[{ flex: 1, fontSize: 15, color: colors.text }, style]}
        />
        <Pressable onPress={() => setVisible((current) => !current)} hitSlop={8}>
          {visible ? <EyeOff size={18} color={colors.textSoft} /> : <Eye size={18} color={colors.textSoft} />}
        </Pressable>
      </View>
    </View>
  );
}
