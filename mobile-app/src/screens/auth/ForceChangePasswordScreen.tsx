import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Text, View, Platform } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

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
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center' }}>
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
            Change your temporary password
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 22, color: colors.textSoft }}>
            Your account needs a new password before you can continue. Use at least 8 characters with upper and lower case letters, a number, and a symbol.
          </Text>

          <View style={{ marginTop: 24, gap: 16 }}>
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

          <View style={{ marginTop: 24, gap: 12 }}>
            <PrimaryButton label="Save Password" onPress={handleSubmit} loading={loading} />
            <PrimaryButton label="Sign Out" onPress={logout} tone="secondary" />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
