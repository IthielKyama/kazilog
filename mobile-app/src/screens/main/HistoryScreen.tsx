import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { InfoCard } from '../../components/InfoCard';
import { useAuth } from '../../context/AuthContext';
import { MainTabParamList } from '../../navigation/TabNavigator';

type Props = BottomTabScreenProps<MainTabParamList, 'History'>;

import { LogStatusBadge } from '../../components/logs/LogStatusBadge';

export function HistoryScreen({ navigation }: Props) {
  const { logs, pendingLogs, refreshSessionData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text className="text-sm font-semibold text-brand" onPress={() => navigation.navigate('DailyLog')}>
          New Log
        </Text>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      refreshSessionData().catch(() => undefined);
    }, [refreshSessionData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSessionData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />}
    >
      {pendingLogs.length ? (
        <InfoCard title="Queued Offline Logs" subtitle="These entries are waiting for internet before syncing.">
          <View className="gap-3">
            {pendingLogs.map((log) => (
              <View key={log.localId} className="rounded-xl border border-dashed border-brand bg-brand-light/40 p-3">
                <Text className="text-sm font-semibold text-ink">{new Date(log.capturedAt).toLocaleString()}</Text>
                <Text className="mt-1 text-sm text-muted" numberOfLines={3}>
                  {log.tasksDone}
                </Text>
              </View>
            ))}
          </View>
        </InfoCard>
      ) : null}

      <InfoCard title="Submitted Logs" subtitle="Supervisor review status updates appear here.">
        {logs.length ? (
          <View className="gap-4">
            {logs.map((log) => (
              <View key={log._id} className="rounded-2xl border border-line bg-slate-50 p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-sm font-semibold text-ink">
                    {new Date(log.date || log.createdAt).toLocaleDateString()}
                  </Text>
                  <LogStatusBadge status={log.supervisorStatus} />
                </View>

                <Text className="mt-3 text-sm font-medium text-ink">Tasks</Text>
                <Text className="mt-1 text-sm leading-6 text-muted">{log.tasksDone}</Text>

                <Text className="mt-3 text-sm font-medium text-ink">Skills learned</Text>
                <Text className="mt-1 text-sm leading-6 text-muted">{log.skillsLearned}</Text>

                {log.supervisorComment ? (
                  <>
                    <Text className="mt-3 text-sm font-medium text-ink">Supervisor comment</Text>
                    <Text className="mt-1 text-sm leading-6 text-muted">{log.supervisorComment}</Text>
                  </>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm leading-6 text-muted">No submitted logs yet. Your entries will appear here after the first successful submission.</Text>
        )}
      </InfoCard>
    </ScrollView>
  );
}
