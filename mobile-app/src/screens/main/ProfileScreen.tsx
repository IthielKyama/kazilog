import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { User, Mail, Building, GraduationCap } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { InfoCard } from '../../components/InfoCard';
import { useTheme } from '../../theme/ThemeContext';

export function ProfileScreen() {
  const { user, latestSession, logout } = useAuth();
  const { colors } = useTheme();

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <InfoCard title="Account Profile">
        <View className="flex-row items-center gap-4 mb-6">
          <View className="h-16 w-16 rounded-full items-center justify-center border" style={{ backgroundColor: colors.brandSoft, borderColor: colors.border }}>
            <User size={32} color={colors.brand} />
          </View>
          <View>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>{user?.name}</Text>
            <Text className="text-sm capitalize" style={{ color: colors.textSoft }}>{user?.role}</Text>
          </View>
        </View>

        <View className="gap-4">
          <View className="flex-row items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.border }}>
            <Mail size={20} color={colors.textSoft} />
            <View>
              <Text className="text-xs font-semibold" style={{ color: colors.textSoft }}>Email Address</Text>
              <Text className="text-sm font-medium" style={{ color: colors.text }}>{user?.email}</Text>
            </View>
          </View>

          {latestSession && (
            <View className="flex-row items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.border }}>
              <Building size={20} color={colors.textSoft} />
              <View>
                <Text className="text-xs font-semibold" style={{ color: colors.textSoft }}>Attachment Company</Text>
                <Text className="text-sm font-medium" style={{ color: colors.text }}>{latestSession.company.name}</Text>
              </View>
            </View>
          )}

          {latestSession && (
            <View className="flex-row items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.border }}>
              <GraduationCap size={20} color={colors.textSoft} />
              <View>
                <Text className="text-xs font-semibold" style={{ color: colors.textSoft }}>Latest Final Grade</Text>
                <Text className="text-sm font-medium" style={{ color: colors.text }}>{latestSession.finalGrade || 'Pending'}</Text>
              </View>
            </View>
          )}
        </View>
      </InfoCard>

      <InfoCard title="Attachment Support">
        <View className="rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.surfaceMuted }}>
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>Light mode is now standard</Text>
          <Text className="mt-1 text-xs leading-5" style={{ color: colors.textSoft }}>
            KaziLog now uses one consistent light interface across your student experience for clearer review and grading updates.
          </Text>
        </View>
      </InfoCard>

      <InfoCard title="Account Actions">
        <PrimaryButton label="Sign Out" onPress={logout} tone="secondary" />
      </InfoCard>
    </ScrollView>
  );
}
