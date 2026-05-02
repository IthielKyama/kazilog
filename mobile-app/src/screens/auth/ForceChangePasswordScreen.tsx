import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Text, View, Platform } from 'react-native';

import { PasswordInput } from '../../components/PasswordInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ForceChangePasswordScreen({}: Props) {
  const { changePassword, logout } = useAuth();
  const { colors } = useTheme();
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
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1 px-6 py-10">
        <View className="rounded-3xl border p-6" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>Change your temporary password</Text>
          <Text className="mt-2 text-sm leading-6" style={{ color: colors.textSoft }}>
            Your account needs a new password before you can continue. Use at least 8 characters with upper and lower case letters, a number, and a symbol.
          </Text>

          <View className="mt-6 gap-4">
            <PasswordInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
            />
            <PasswordInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
            />
            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
            />
          </View>

          {error ? <Text className="mt-4 text-sm" style={{ color: colors.danger }}>{error}</Text> : null}

          <View className="mt-6 gap-3">
            <PrimaryButton label="Save Password" onPress={handleSubmit} loading={loading} />
            <PrimaryButton label="Sign Out" onPress={logout} tone="secondary" />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
