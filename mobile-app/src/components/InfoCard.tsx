import { ReactNode } from 'react';
import { Text, View } from 'react-native';

type InfoCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function InfoCard({ title, subtitle, children }: InfoCardProps) {
  return (
    <View className="rounded-2xl border border-line bg-white p-4">
      <Text className="text-lg font-semibold text-ink">{title}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-muted">{subtitle}</Text> : null}
      <View className="mt-4">{children}</View>
    </View>
  );
}
