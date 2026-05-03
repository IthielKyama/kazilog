import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, CloudOff } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [selectedSubmittedWeekKey, setSelectedSubmittedWeekKey] = useState<string | null>(null);
  const [selectedPendingWeekKey, setSelectedPendingWeekKey] = useState<string | null>(null);
  const [queueExpanded, setQueueExpanded] = useState(false);
  const { colors } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('DailyLog')}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 99,
            backgroundColor: colors.brandSoft,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.brand }}>+ New Log</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors]);

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

  const selectedSubmittedWeek = useMemo(
    () => groupedLogs.find((group) => group.key === selectedSubmittedWeekKey) ?? groupedLogs[0] ?? null,
    [groupedLogs, selectedSubmittedWeekKey],
  );

  const selectedPendingWeek = useMemo(
    () => groupedPendingLogs.find((group) => group.key === selectedPendingWeekKey) ?? groupedPendingLogs[0] ?? null,
    [groupedPendingLogs, selectedPendingWeekKey],
  );

  useEffect(() => {
    if (!groupedLogs.length) {
      setSelectedSubmittedWeekKey(null);
    } else {
      setSelectedSubmittedWeekKey((current) => {
        if (current && groupedLogs.some((group) => group.key === current)) return current;
        return groupedLogs[0].key;
      });
    }
  }, [groupedLogs]);

  useEffect(() => {
    if (!groupedPendingLogs.length) {
      setSelectedPendingWeekKey(null);
    } else {
      setSelectedPendingWeekKey((current) => {
        if (current && groupedPendingLogs.some((group) => group.key === current)) return current;
        return groupedPendingLogs[0].key;
      });
    }
  }, [groupedPendingLogs]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      {/* Queued Offline Logs — Collapsible */}
      {pendingLogs.length ? (
        <View
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 3,
            overflow: 'hidden',
          }}
        >
          {/* Collapsible Header */}
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setQueueExpanded(prev => !prev);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.warningSoft,
                }}
              >
                <CloudOff size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Offline Queue</Text>
                <Text style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>Waiting for internet to sync</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: 99,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.warning,
                  paddingHorizontal: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>{pendingLogs.length}</Text>
              </View>
              <ChevronDown
                size={20}
                color={colors.textSoft}
                style={{ transform: [{ rotate: queueExpanded ? '180deg' : '0deg' }] }}
              />
            </View>
          </Pressable>

          {/* Collapsible Content */}
          {queueExpanded && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 16 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {groupedPendingLogs.map((group) => {
                  const selected = selectedPendingWeek?.key === group.key;
                  return (
                    <Pressable
                      key={group.key}
                      onPress={() => setSelectedPendingWeekKey(group.key)}
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

              {selectedPendingWeek ? (
                <View
                  style={{
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceMuted,
                    padding: 16,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{selectedPendingWeek.label}</Text>
                  <View style={{ marginTop: 12, gap: 12 }}>
                    {selectedPendingWeek.items.map((log) => {
                      const failed = log.syncState === 'failed';
                      return (
                        <View
                          key={log.localId}
                          style={{
                            borderRadius: 16,
                            borderWidth: 1,
                            borderStyle: 'dashed',
                            borderColor: failed ? colors.danger : colors.brand,
                            backgroundColor: failed ? colors.dangerSoft : colors.brandSoft,
                            padding: 14,
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                            {formatDayLabel(getEntryDate(log))}
                          </Text>
                          <Text style={{ marginTop: 4, fontSize: 13, color: colors.textMuted }} numberOfLines={3}>
                            {log.tasksDone}
                          </Text>
                          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <Text style={{ flex: 1, fontSize: 11, color: failed ? colors.danger : colors.textSoft }}>
                              {log.lastError || syncState.lastMessage || 'Waiting for sync.'}
                            </Text>
                            <Pressable
                              disabled={syncState.syncing}
                              onPress={() => retryOfflineLog(log.idempotencyKey).catch(() => undefined)}
                            >
                              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.brand }}>
                                Retry
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      {/* Submitted Logs */}
      <InfoCard title="Submitted Logs" subtitle="Supervisor review updates appear by week with day-level detail.">
        {groupedLogs.length ? (
          <View style={{ gap: 16 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {groupedLogs.map((group) => {
                const selected = selectedSubmittedWeek?.key === group.key;
                return (
                  <Pressable
                    key={group.key}
                    onPress={() => setSelectedSubmittedWeekKey(group.key)}
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

            {selectedSubmittedWeek ? (
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceMuted,
                  padding: 16,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{selectedSubmittedWeek.label}</Text>
                <View style={{ marginTop: 12, gap: 12 }}>
                  {selectedSubmittedWeek.items.map((log) => (
                    <View
                      key={log._id}
                      style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        padding: 16,
                        shadowColor: '#0f172a',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.03,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                            {formatDayLabel(getEntryDate(log))}
                          </Text>
                          <Text style={{ marginTop: 2, fontSize: 12, color: colors.textSoft }}>
                            {formatShortDayLabel(getEntryDate(log))}
                          </Text>
                        </View>
                        <LogStatusBadge status={log.supervisorStatus} />
                      </View>

                      <View style={{ marginTop: 14, gap: 12 }}>
                        <View>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.8 }}>Tasks</Text>
                          <Text style={{ marginTop: 4, fontSize: 14, lineHeight: 22, color: colors.textMuted }}>{log.tasksDone}</Text>
                        </View>

                        <View>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.8 }}>Skills learned</Text>
                          <Text style={{ marginTop: 4, fontSize: 14, lineHeight: 22, color: colors.textMuted }}>{log.skillsLearned}</Text>
                        </View>
                      </View>

                      {log.supervisorComment ? (
                        <View
                          style={{
                            marginTop: 14,
                            padding: 14,
                            borderRadius: 14,
                            backgroundColor: log.supervisorStatus === 'Rejected' ? colors.dangerSoft : colors.brandSoft,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Supervisor comment
                          </Text>
                          <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 22, color: colors.text }}>{log.supervisorComment}</Text>
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
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSoft, textAlign: 'center' }}>
              No submitted logs yet. Your entries will appear here after the first successful submission.
            </Text>
          </View>
        )}
      </InfoCard>
    </ScrollView>
  );
}
