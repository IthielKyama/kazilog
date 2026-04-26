import NetInfo from '@react-native-community/netinfo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

import { InfoCard } from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { extractApiError, logbookApi } from '../services/api';
import { getCurrentCoordinates } from '../utils/location';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyLog'>;

export function DailyLogScreen({ navigation }: Props) {
  const {
    activeSession,
    pendingLogs,
    queueOfflineLog,
    refreshSessionData,
    syncNow,
    syncState,
    logout,
  } = useAuth();
  const [tasksDone, setTasksDone] = useState('');
  const [skillsLearned, setSkillsLearned] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text className="text-sm font-semibold text-brand" onPress={() => navigation.navigate('History')}>
          History
        </Text>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      refreshSessionData().catch(() => undefined);
    }, [refreshSessionData]),
  );

  const workplaceSummary = useMemo(() => {
    if (!activeSession) {
      return null;
    }

    return `${activeSession.company.name} • Radius ${activeSession.company.allowedRadiusMeters}m`;
  }, [activeSession]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSessionData();
      await syncNow();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeSession) {
      Alert.alert('No active session', 'Your account does not have an active attachment session yet.');
      return;
    }

    if (!tasksDone.trim() || !skillsLearned.trim()) {
      setMessage('Please fill in both the tasks completed and skills learned sections.');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const coords = await getCurrentCoordinates();
      const payload = {
        sessionId: activeSession._id,
        tasksDone: tasksDone.trim(),
        skillsLearned: skillsLearned.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        await logbookApi.submitLog(payload);
        await refreshSessionData();
        setMessage('Log submitted successfully.');
      } else {
        await queueOfflineLog({
          localId: `${Date.now()}`,
          capturedAt: new Date().toISOString(),
          ...payload,
        });
        setMessage('No internet connection. Your log has been saved on this device.');
      }

      setTasksDone('');
      setSkillsLearned('');
    } catch (error) {
      setMessage(extractApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0f766e" />}
    >
      <InfoCard
        title="Attachment Status"
        subtitle={activeSession ? workplaceSummary || undefined : 'Waiting for an active student session'}
      >
        {activeSession ? (
          <View className="gap-2">
            <Text className="text-sm text-muted">{activeSession.company.address}</Text>
            <Text className="text-sm text-muted">
              Supervisor: {activeSession.supervisor?.name || 'Not assigned'}
            </Text>
            <Text className="text-sm text-muted">
              Assessor: {activeSession.assessor?.name || 'Not assigned'}
            </Text>
          </View>
        ) : (
          <Text className="text-sm leading-6 text-muted">
            An administrator needs to create your attachment session before daily submissions can be accepted.
          </Text>
        )}
      </InfoCard>

      <InfoCard
        title="Offline Queue"
        subtitle="Saved logs stay on this device until a sync can complete."
      >
        <Text className="text-sm text-muted">{pendingLogs.length} pending log{pendingLogs.length === 1 ? '' : 's'}</Text>
        {syncState.lastMessage ? <Text className="mt-2 text-sm text-brand-dark">{syncState.lastMessage}</Text> : null}
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <PrimaryButton
              label={syncState.syncing ? 'Syncing...' : 'Sync Now'}
              onPress={() => syncNow().catch((error) => setMessage(extractApiError(error)))}
              loading={syncState.syncing}
              disabled={!pendingLogs.length}
            />
          </View>
          <View className="flex-1">
            <PrimaryButton label="Sign Out" onPress={logout} tone="secondary" />
          </View>
        </View>
      </InfoCard>

      <InfoCard title="Daily Submission" subtitle="Location is captured right before submission.">
        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-ink">Tasks completed today</Text>
            <TextInput
              multiline
              textAlignVertical="top"
              value={tasksDone}
              onChangeText={setTasksDone}
              placeholder="Describe the work you handled today"
              className="min-h-[120px] rounded-2xl border border-line bg-slate-50 px-4 py-3 text-base text-ink"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-ink">Skills or lessons learned</Text>
            <TextInput
              multiline
              textAlignVertical="top"
              value={skillsLearned}
              onChangeText={setSkillsLearned}
              placeholder="Note what you learned, practised, or improved"
              className="min-h-[120px] rounded-2xl border border-line bg-slate-50 px-4 py-3 text-base text-ink"
            />
          </View>
        </View>

        {message ? (
          <Text className={`mt-4 text-sm ${/success|saved/i.test(message) ? 'text-success' : 'text-danger'}`}>
            {message}
          </Text>
        ) : null}

        <View className="mt-6">
          <PrimaryButton label="Capture GPS and Submit" onPress={handleSubmit} loading={submitting} />
        </View>
      </InfoCard>
    </ScrollView>
  );
}
