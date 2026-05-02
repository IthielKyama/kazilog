import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { InfoCard } from '../../components/InfoCard';
import { useAuth } from '../../context/AuthContext';
import { groupItemsByWeek, formatDayLabel, getEntryDate } from '../../utils/logGrouping';
import { useTheme } from '../../theme/ThemeContext';

export function ProgressScreen() {
  const { logs, latestSession, refreshSessionData } = useAuth();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshSessionData().catch(() => undefined);
    }, [refreshSessionData]),
  );

  const summary = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc.total += 1;
        acc[log.supervisorStatus.toLowerCase() as 'pending' | 'approved' | 'rejected'] += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 },
    );
  }, [logs]);

  const groupedLogs = useMemo(() => groupItemsByWeek(logs), [logs]);
  const selectedWeek = useMemo(
    () => groupedLogs.find((group) => group.key === selectedWeekKey) ?? groupedLogs[0] ?? null,
    [groupedLogs, selectedWeekKey],
  );

  useEffect(() => {
    if (!groupedLogs.length) {
      setSelectedWeekKey(null);
      return;
    }

    setSelectedWeekKey((current) => {
      if (current && groupedLogs.some((group) => group.key === current)) {
        return current;
      }

      return groupedLogs[0].key;
    });
  }, [groupedLogs]);

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
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      <InfoCard title="Attachment Progress" subtitle="Track your logs, feedback, and final assessment in one place.">
        <View className="flex-row flex-wrap gap-3">
          {[
            { label: 'Total Logs', value: summary.total, tone: colors.brandSoft, text: colors.brand },
            { label: 'Approved', value: summary.approved, tone: '#dcfce7', text: colors.success },
            { label: 'Pending', value: summary.pending, tone: colors.warningSoft, text: colors.warning },
            { label: 'Rejected', value: summary.rejected, tone: colors.dangerSoft, text: colors.danger },
          ].map((item) => (
            <View key={item.label} className="rounded-2xl px-4 py-3 min-w-[46%]" style={{ backgroundColor: item.tone }}>
              <Text className="text-xs font-semibold uppercase" style={{ color: item.text }}>{item.label}</Text>
              <Text className="mt-2 text-2xl font-bold" style={{ color: colors.text }}>{item.value}</Text>
            </View>
          ))}
        </View>
      </InfoCard>

      <InfoCard title="Assessment">
        <View className="rounded-2xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.surfaceMuted }}>
          <Text className="text-sm font-semibold" style={{ color: colors.textSoft }}>Final grade</Text>
          <Text className="mt-2 text-3xl font-bold" style={{ color: colors.text }}>
            {latestSession?.finalGrade || 'Pending'}
          </Text>
          <Text className="mt-2 text-sm" style={{ color: colors.textSoft }}>
            Grading remains managed by the assessor after reviewing your weekly progress.
          </Text>
        </View>
      </InfoCard>

      <InfoCard title="Weekly Log Review" subtitle="Select a week to view only that period's attachment entries.">
        {groupedLogs.length ? (
          <View className="gap-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {groupedLogs.map((group) => {
                const selected = selectedWeek?.key === group.key;
                return (
                  <Pressable
                    key={group.key}
                    onPress={() => setSelectedWeekKey(group.key)}
                    className="rounded-full px-4 py-2"
                    style={{
                      backgroundColor: selected ? colors.brand : colors.surfaceMuted,
                      borderWidth: 1,
                      borderColor: selected ? colors.brand : colors.border,
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: selected ? '#ffffff' : colors.text }}>
                      {group.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedWeek ? (
              <View className="rounded-2xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.surfaceMuted }}>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>{selectedWeek.label}</Text>
                <View className="mt-3 gap-3">
                  {selectedWeek.items.map((log) => (
                    <View key={log._id} className="rounded-xl border p-3" style={{ borderColor: colors.borderStrong, backgroundColor: colors.surface }}>
                      <View className="flex-row items-start justify-between gap-3">
                        <Text className="flex-1 text-sm font-semibold" style={{ color: colors.text }}>
                          {formatDayLabel(getEntryDate(log))}
                        </Text>
                        <Text className="text-xs font-semibold" style={{ color: log.supervisorStatus === 'Approved' ? colors.success : log.supervisorStatus === 'Rejected' ? colors.danger : colors.warning }}>
                          {log.supervisorStatus}
                        </Text>
                      </View>
                      <Text className="mt-2 text-sm" style={{ color: colors.textMuted }}>{log.tasksDone}</Text>
                      {log.supervisorComment ? (
                        <View className="mt-3 rounded-xl px-3 py-2" style={{ backgroundColor: log.supervisorStatus === 'Rejected' ? colors.dangerSoft : colors.brandSoft }}>
                          <Text className="text-xs font-semibold uppercase" style={{ color: colors.textSoft }}>Supervisor comment</Text>
                          <Text className="mt-1 text-sm" style={{ color: colors.text }}>{log.supervisorComment}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <Text className="text-sm" style={{ color: colors.textSoft }}>
            No submitted logs yet for this attachment session. Your weekly progress will appear here after your first sync.
          </Text>
        )}
      </InfoCard>
    </ScrollView>
  );
}
