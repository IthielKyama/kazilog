import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

import { PasswordInput } from '../../components/PasswordInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { extractApiError } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(route.params.token, password);
      setPasswordReset(true);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}>
        <View
          style={{
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 24,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 5,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.brandSoft,
              marginBottom: 16,
            }}
          >
            <ShieldCheck size={24} color={colors.brand} />
          </View>

          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
            Choose a new password
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 22, color: colors.textSoft }}>
            Use at least 8 characters with upper and lower case letters, a number, and a symbol.
          </Text>

          {passwordReset ? (
            <View style={{ marginTop: 24, gap: 16 }}>
              <View
                style={{
                  borderRadius: 16,
                  backgroundColor: colors.successSoft,
                  padding: 16,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success }}>Password reset successful</Text>
                <Text style={{ marginTop: 8, fontSize: 13, lineHeight: 20, color: colors.textMuted }}>
                  Your password has been updated. You can now sign in with your new password.
                </Text>
              </View>

              <PrimaryButton label="Back to Login" onPress={() => navigation.replace('Login')} />
            </View>
          ) : (
            <>
              <View style={{ marginTop: 24, gap: 16 }}>
                <PasswordInput
                  label="New password"
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password"
                />
                <PasswordInput
                  label="Confirm new password"
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                />
              </View>

              {error ? (
                <View
                  style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.dangerSoft,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text>
                </View>
              ) : null}

              <View style={{ marginTop: 24 }}>
                <PrimaryButton label="Reset Password" onPress={handleSubmit} loading={loading} />
              </View>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
