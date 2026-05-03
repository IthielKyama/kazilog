import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { User, Mail, Building, GraduationCap, LogOut } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { InfoCard } from '../../components/InfoCard';
import { useTheme } from '../../theme/ThemeContext';

export function ProfileScreen() {
  const { user, latestSession, logout } = useAuth();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
    >
      {/* Profile Header */}
      <InfoCard title="Account Profile">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <View
            style={{
              height: 64,
              width: 64,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.brandSoft,
            }}
          >
            <User size={30} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
              {user?.name}
            </Text>
            <View
              style={{
                marginTop: 6,
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 99,
                backgroundColor: colors.brandSoft,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand, textTransform: 'capitalize' }}>
                {user?.role}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          {/* Email */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.brandSoft,
              }}
            >
              <Mail size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Email Address
              </Text>
              <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '500', color: colors.text }}>
                {user?.email}
              </Text>
            </View>
          </View>

          {/* Company */}
          {latestSession && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.brandSoft,
                }}
              >
                <Building size={18} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Attachment Company
                </Text>
                <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '500', color: colors.text }}>
                  {latestSession.company.name}
                </Text>
              </View>
            </View>
          )}

          {/* Grade */}
          {latestSession && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.brandSoft,
                }}
              >
                <GraduationCap size={18} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Latest Final Grade
                </Text>
                <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '500', color: colors.text }}>
                  {latestSession.finalGrade || 'Pending'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </InfoCard>

      {/* Actions */}
      <InfoCard title="Account Actions">
        <PrimaryButton label="Sign Out" onPress={logout} tone="secondary" />
      </InfoCard>
    </ScrollView>
  );
}
