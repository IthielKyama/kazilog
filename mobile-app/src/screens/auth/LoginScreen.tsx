import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { PasswordInput } from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../services/api';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({}: Props) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
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
        {/* Brand Logo */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.brand,
              shadowColor: colors.brand,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              marginBottom: 16,
            }}
          >
            <MapPin size={28} color="#ffffff" />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
            KaziLog
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSoft, marginTop: 4 }}>
            Student Attachment Logger
          </Text>
        </View>

        {/* Login Card */}
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
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
            Welcome back
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 22, color: colors.textSoft }}>
            Sign in to submit your daily attachment log and keep your progress up to date.
          </Text>

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

            <PasswordInput
              label="Password"
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
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
            <PrimaryButton label="Sign In" onPress={handleLogin} loading={loading} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
