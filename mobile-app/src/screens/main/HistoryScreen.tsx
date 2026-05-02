import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { InfoCard } from '../../components/InfoCard';
import { useAuth } from '../../context/AuthContext';
import { MainTabParamList } from '../../navigation/TabNavigator';
import { useTheme } from '../../theme/ThemeContext';
import { formatDayLabel, formatShortDayLabel, getEntryDate, groupItemsByWeek } from '../../utils/logGrouping';

type Props = BottomTabScreenProps<MainTabParamList, 'History'>;

import { LogStatusBadge } from '../../components/logs/LogStatusBadge';

export function HistoryScreen({ navigation }: Props) {
  const { logs, pendingLogs, refreshSessionData, retryOfflineLog, syncState } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

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

  const groupedLogs = useMemo(() => groupItemsByWeek(logs), [logs]);
  const groupedPendingLogs = useMemo(() => groupItemsByWeek(pendingLogs), [pendingLogs]);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      {pendingLogs.length ? (
        <InfoCard title="Queued Offline Logs" subtitle="These entries are waiting for internet before syncing.">
          <View className="gap-4">
            {groupedPendingLogs.map((group) => (
              <View key={group.key} className="gap-3">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>{group.label}</Text>
                {group.items.map((log) => {
                  const failed = log.syncState === 'failed';

                  return (
                    <View
                      key={log.localId}
                      className="rounded-xl border p-3"
                      style={{
                        borderStyle: 'dashed',
                        borderColor: failed ? colors.danger : colors.brand,
                        backgroundColor: failed ? colors.dangerSoft : colors.brandSoft,
                      }}
                    >
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {formatDayLabel(getEntryDate(log))}
                      </Text>
                      <Text className="mt-1 text-sm" style={{ color: colors.textMuted }} numberOfLines={3}>
                        {log.tasksDone}
                      </Text>
                      <View className="mt-3 flex-row items-center justify-between gap-3">
                        <Text className="flex-1 text-xs" style={{ color: failed ? colors.danger : colors.textSoft }}>
                          {log.lastError || syncState.lastMessage || 'Waiting for sync.'}
                        </Text>
                        <Pressable
                          disabled={syncState.syncing}
                          onPress={() => retryOfflineLog(log.idempotencyKey).catch(() => undefined)}
                        >
                          <Text className="text-sm font-semibold" style={{ color: colors.brand }}>
                            Retry
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </InfoCard>
      ) : null}

      <InfoCard title="Submitted Logs" subtitle="Supervisor review updates appear by week with day-level detail.">
        {groupedLogs.length ? (
          <View className="gap-4">
            {groupedLogs.map((group) => (
              <View key={group.key} className="rounded-2xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.surfaceMuted }}>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>{group.label}</Text>
                <View className="mt-3 gap-3">
                  {group.items.map((log) => (
                    <View key={log._id} className="rounded-2xl border p-4" style={{ borderColor: colors.borderStrong, backgroundColor: colors.surface }}>
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {formatDayLabel(getEntryDate(log))}
                          </Text>
                          <Text className="mt-1 text-xs" style={{ color: colors.textSoft }}>
                            {formatShortDayLabel(getEntryDate(log))}
                          </Text>
                        </View>
                        <LogStatusBadge status={log.supervisorStatus} />
                      </View>

                      <Text className="mt-3 text-sm font-medium" style={{ color: colors.text }}>Tasks</Text>
                      <Text className="mt-1 text-sm leading-6" style={{ color: colors.textMuted }}>{log.tasksDone}</Text>

                      <Text className="mt-3 text-sm font-medium" style={{ color: colors.text }}>Skills learned</Text>
                      <Text className="mt-1 text-sm leading-6" style={{ color: colors.textMuted }}>{log.skillsLearned}</Text>

                      {log.supervisorComment ? (
                        <>
                          <Text className="mt-3 text-sm font-medium" style={{ color: colors.text }}>Supervisor comment</Text>
                          <Text className="mt-1 text-sm leading-6" style={{ color: colors.textMuted }}>{log.supervisorComment}</Text>
                        </>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm leading-6" style={{ color: colors.textSoft }}>No submitted logs yet. Your entries will appear here after the first successful submission.</Text>
        )}
      </InfoCard>
    </ScrollView>
  );
}
