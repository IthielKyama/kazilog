import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ForceChangePasswordScreen({}: Props) {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Password updated', 'You can now continue to your daily log.');
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
      <View className="flex-1 px-6 py-10">
        <View className="rounded-3xl border border-line bg-white p-6">
          <Text className="text-2xl font-bold text-ink">Change your temporary password</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Your account needs a new password before you can continue. Use at least 8 characters with upper and lower case letters, a number, and a symbol.
          </Text>

          <View className="mt-6 gap-4">
            <TextInput
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              className="h-12 rounded-xl border border-line bg-slate-50 px-4 text-base text-ink"
            />
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              className="h-12 rounded-xl border border-line bg-slate-50 px-4 text-base text-ink"
            />
            <TextInput
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              className="h-12 rounded-xl border border-line bg-slate-50 px-4 text-base text-ink"
            />
          </View>

          {error ? <Text className="mt-4 text-sm text-danger">{error}</Text> : null}

          <View className="mt-6 gap-3">
            <PrimaryButton label="Save Password" onPress={handleSubmit} loading={loading} />
            <PrimaryButton label="Sign Out" onPress={logout} tone="secondary" />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
