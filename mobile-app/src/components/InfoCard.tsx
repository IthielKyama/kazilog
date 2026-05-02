import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type InfoCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function InfoCard({ title, subtitle, children }: InfoCardProps) {
  const { colors } = useTheme();

  return (
    <View className="rounded-2xl p-4" style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
      <Text className="text-lg font-semibold" style={{ color: colors.text }}>{title}</Text>
      {subtitle ? <Text className="mt-1 text-sm" style={{ color: colors.textSoft }}>{subtitle}</Text> : null}
      <View className="mt-4">{children}</View>
    </View>
  );
}
