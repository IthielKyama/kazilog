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
    <View
      style={{
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.textSoft }}>
          {subtitle}
        </Text>
      ) : null}
      <View style={{ marginTop: 16 }}>{children}</View>
    </View>
  );
}
