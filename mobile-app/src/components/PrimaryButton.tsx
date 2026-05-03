import { ActivityIndicator, Pressable, Text, StyleSheet } from 'react-native';
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
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? colors.brand : colors.surfaceMuted,
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
          borderWidth: isPrimary ? 0 : 1,
          borderColor: isPrimary ? 'transparent' : colors.border,
        },
        isPrimary && {
          shadowColor: colors.brand,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 4,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : colors.text} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: isPrimary ? '#ffffff' : colors.text },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
