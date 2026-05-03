import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { Mail } from 'lucide-react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { extractApiError } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { forgotPassword } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setEmailSent(true);
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
            <Mail size={24} color={colors.brand} />
          </View>

          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
            Reset your password
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 22, color: colors.textSoft }}>
            Enter the email address on your student account and we will send a reset link that opens in KaziLog.
          </Text>

          {emailSent ? (
            <View style={{ marginTop: 24, gap: 16 }}>
              <View
                style={{
                  borderRadius: 16,
                  backgroundColor: colors.successSoft,
                  padding: 16,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success }}>Check your inbox</Text>
                <Text style={{ marginTop: 8, fontSize: 13, lineHeight: 20, color: colors.textMuted }}>
                  We sent a reset link to {email}. Open it on this device to choose a new password.
                </Text>
              </View>

              <PrimaryButton label="Back to Sign In" onPress={() => navigation.navigate('Login')} tone="secondary" />
            </View>
          ) : (
            <View style={{ marginTop: 24, gap: 16 }}>
              <View>
                <Text style={{ marginBottom: 8, fontSize: 13, fontWeight: '600', color: colors.text }}>
                  Email address
                </Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="student@example.com"
                  placeholderTextColor={colors.textSoft}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.input,
                    paddingHorizontal: 16,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>

              {error ? (
                <View
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.dangerSoft,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text>
                </View>
              ) : null}

              <View style={{ gap: 12 }}>
                <PrimaryButton label="Send Reset Link" onPress={handleSubmit} loading={loading} />
                <PrimaryButton label="Back to Sign In" onPress={() => navigation.goBack()} tone="secondary" />
              </View>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
