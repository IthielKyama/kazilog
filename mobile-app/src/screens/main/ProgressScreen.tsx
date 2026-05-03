import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Award } from 'lucide-react-native';

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

  const statCards = [
    { label: 'Total Logs', value: summary.total, bg: colors.brandSoft, accent: colors.brand },
    { label: 'Approved', value: summary.approved, bg: colors.successSoft ?? '#dcfce7', accent: colors.success },
    { label: 'Pending', value: summary.pending, bg: colors.warningSoft, accent: colors.warning },
    { label: 'Rejected', value: summary.rejected, bg: colors.dangerSoft, accent: colors.danger },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      {/* Summary Statistics */}
      <InfoCard title="Attachment Progress" subtitle="Track your logs, feedback, and final assessment in one place.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {statCards.map((item) => (
            <View
              key={item.label}
              style={{
                minWidth: '46%',
                flex: 1,
                borderRadius: 18,
                padding: 16,
                backgroundColor: item.bg,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: item.accent }}>
                {item.label}
              </Text>
              <Text style={{ marginTop: 8, fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </InfoCard>

      {/* Assessment Grade */}
      <InfoCard title="Assessment">
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
            padding: 20,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.brandSoft,
              marginBottom: 12,
            }}
          >
            <Award size={28} color={colors.brand} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.textSoft }}>
            Final grade
          </Text>
          <Text style={{ marginTop: 8, fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
            {latestSession?.finalGrade || 'Pending'}
          </Text>
          <Text style={{ marginTop: 8, fontSize: 13, color: colors.textSoft, textAlign: 'center', lineHeight: 20 }}>
            Grading remains managed by the assessor after reviewing your weekly progress.
          </Text>
        </View>
      </InfoCard>

      {/* Weekly Log Review */}
      <InfoCard title="Weekly Log Review" subtitle="Select a week to view only that period's attachment entries.">
        {groupedLogs.length ? (
          <View style={{ gap: 16 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {groupedLogs.map((group) => {
                const selected = selectedWeek?.key === group.key;
                return (
                  <Pressable
                    key={group.key}
                    onPress={() => setSelectedWeekKey(group.key)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 99,
                      backgroundColor: selected ? colors.brand : colors.surfaceMuted,
                      borderWidth: 1,
                      borderColor: selected ? colors.brand : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: selected ? '#ffffff' : colors.text }}>
                      {group.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedWeek ? (
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceMuted,
                  padding: 16,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{selectedWeek.label}</Text>
                <View style={{ marginTop: 12, gap: 12 }}>
                  {selectedWeek.items.map((log) => (
                    <View
                      key={log._id}
                      style={{
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        padding: 14,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}>
                          {formatDayLabel(getEntryDate(log))}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 99,
                            backgroundColor:
                              log.supervisorStatus === 'Approved'
                                ? colors.successSoft ?? '#dcfce7'
                                : log.supervisorStatus === 'Rejected'
                                ? colors.dangerSoft
                                : colors.warningSoft,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color:
                                log.supervisorStatus === 'Approved'
                                  ? colors.success
                                  : log.supervisorStatus === 'Rejected'
                                  ? colors.danger
                                  : colors.warning,
                            }}
                          >
                            {log.supervisorStatus}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ marginTop: 8, fontSize: 14, color: colors.textMuted, lineHeight: 22 }}>{log.tasksDone}</Text>
                      {log.supervisorComment ? (
                        <View
                          style={{
                            marginTop: 12,
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            backgroundColor: log.supervisorStatus === 'Rejected' ? colors.dangerSoft : colors.brandSoft,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft }}>
                            Supervisor comment
                          </Text>
                          <Text style={{ marginTop: 4, fontSize: 14, color: colors.text, lineHeight: 22 }}>{log.supervisorComment}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.textSoft, textAlign: 'center', lineHeight: 22 }}>
              No submitted logs yet for this attachment session. Your weekly progress will appear here after your first sync.
            </Text>
          </View>
        )}
      </InfoCard>
    </ScrollView>
  );
}
