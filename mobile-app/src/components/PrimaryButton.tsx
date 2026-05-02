import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'primary' | 'secondary';
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  tone = 'primary',
}: PrimaryButtonProps) {
  const isPrimary = tone === 'primary';
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`h-12 items-center justify-center rounded-xl px-4 ${(disabled || loading) ? 'opacity-60' : ''}`}
      style={{ backgroundColor: isPrimary ? colors.brand : colors.surfaceMuted }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : colors.text} />
      ) : (
        <Text className="text-base font-semibold" style={{ color: isPrimary ? '#ffffff' : colors.text }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
