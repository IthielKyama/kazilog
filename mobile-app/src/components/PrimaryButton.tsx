import { ActivityIndicator, Pressable, Text } from 'react-native';

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

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`h-12 items-center justify-center rounded-xl px-4 ${
        isPrimary ? 'bg-brand' : 'bg-slate-200'
      } ${(disabled || loading) ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#0f172a'} />
      ) : (
        <Text className={`text-base font-semibold ${isPrimary ? 'text-white' : 'text-slate-900'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
