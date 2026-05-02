import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

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
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1 justify-center px-6 py-10">
        <View className="items-center mb-5">
          <Image
            source={require('../../../assets/icon.png')}
            style={{ width: 72, height: 72, marginBottom: 12, borderRadius: 20 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>KaziLog</Text>
        </View>
        <View className="rounded-3xl border p-6" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
          <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.brandSoft }}>
            <Text className="text-xl font-bold" style={{ color: colors.brand }}>K</Text>
          </View>
          <Text className="mt-5 text-3xl font-bold" style={{ color: colors.text }}>Welcome back</Text>
          <Text className="mt-2 text-sm leading-6" style={{ color: colors.textSoft }}>
            Sign in to submit your daily attachment log and keep your progress up to date.
          </Text>

          <View className="mt-6 gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium" style={{ color: colors.text }}>Email address</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="student@example.com"
                placeholderTextColor={colors.textSoft}
                className="h-12 rounded-xl border px-4 text-base"
                style={{ borderColor: colors.border, backgroundColor: colors.input, color: colors.text }}
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

          {error ? <Text className="mt-4 text-sm" style={{ color: colors.danger }}>{error}</Text> : null}

          <View className="mt-6">
            <PrimaryButton label="Sign In" onPress={handleLogin} loading={loading} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
