import { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { useTheme } from '../theme/ThemeContext';

type PasswordInputProps = TextInputProps & {
  label: string;
};

export function PasswordInput({ label, style, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <View>
      <Text className="mb-2 text-sm font-medium" style={{ color: colors.text }}>
        {label}
      </Text>
      <View
        className="h-12 flex-row items-center rounded-xl border px-4"
        style={{ borderColor: colors.border, backgroundColor: colors.input }}
      >
        <TextInput
          {...props}
          secureTextEntry={!visible}
          placeholderTextColor={colors.textSoft}
          className="flex-1 text-base"
          style={[{ color: colors.text }, style]}
        />
        <Pressable onPress={() => setVisible((current) => !current)} hitSlop={8}>
          {visible ? <EyeOff size={18} color={colors.textSoft} /> : <Eye size={18} color={colors.textSoft} />}
        </Pressable>
      </View>
    </View>
  );
}
