import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { User, Mail, LogOut, Building } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { InfoCard } from '../../components/InfoCard';

export function ProfileScreen() {
  const { user, activeSession, logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <InfoCard title="Account Profile">
        <View className="flex-row items-center gap-4 mb-6">
          <View className="h-16 w-16 bg-brand-light rounded-full items-center justify-center border border-brand/20">
            <User size={32} color="#0f766e" />
          </View>
          <View>
            <Text className="text-xl font-bold text-ink">{user?.name}</Text>
            <Text className="text-sm text-muted capitalize">{user?.role}</Text>
          </View>
        </View>

        <View className="gap-4">
          <View className="flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-line">
            <Mail size={20} color="#64748b" />
            <View>
              <Text className="text-xs font-semibold text-slate-500">Email Address</Text>
              <Text className="text-sm font-medium text-ink">{user?.email}</Text>
            </View>
          </View>

          {activeSession && (
            <View className="flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-line">
              <Building size={20} color="#64748b" />
              <View>
                <Text className="text-xs font-semibold text-slate-500">Attachment Company</Text>
                <Text className="text-sm font-medium text-ink">{activeSession.company.name}</Text>
              </View>
            </View>
          )}
        </View>
      </InfoCard>

      <InfoCard title="Account Actions">
        <PrimaryButton 
          label="Sign Out" 
          onPress={logout} 
          tone="secondary" 
        />
      </InfoCard>
    </ScrollView>
  );
}
