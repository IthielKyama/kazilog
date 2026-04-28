import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../services/api';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({}: Props) {
  const { login } = useAuth();
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
      className="flex-1 bg-surface"
    >
      <View className="flex-1 justify-center px-6 py-10">
        <View className="rounded-3xl border border-line bg-white p-6">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-light">
            <Text className="text-xl font-bold text-brand">K</Text>
          </View>
          <Text className="mt-5 text-3xl font-bold text-ink">Welcome back</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Sign in to submit your daily attachment log and keep your progress up to date.
          </Text>

          <View className="mt-6 gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-ink">Email address</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="student@example.com"
                className="h-12 rounded-xl border border-line bg-slate-50 px-4 text-base text-ink"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-ink">Password</Text>
              <TextInput
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                className="h-12 rounded-xl border border-line bg-slate-50 px-4 text-base text-ink"
              />
            </View>
          </View>

          {error ? <Text className="mt-4 text-sm text-danger">{error}</Text> : null}

          <View className="mt-6">
            <PrimaryButton label="Sign In" onPress={handleLogin} loading={loading} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
