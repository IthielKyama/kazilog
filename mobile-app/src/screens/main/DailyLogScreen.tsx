import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { differenceInWeeks, format, parseISO } from 'date-fns';
import { Camera, MapPin, X, Send, Wifi, WifiOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Crypto from 'expo-crypto';

import { useAuth } from '../../context/AuthContext';
import { extractApiError, logbookApi } from '../../services/api';
import { getResilientCoordinates } from '../../utils/location';
import { syncManager } from '../../utils/SyncManager';
import { FloatingLabelInput } from '../../components/FloatingLabelInput';
import { useTheme } from '../../theme/ThemeContext';

const DEV_GPS_FALLBACK_ENABLED = __DEV__;

export function DailyLogScreen({ navigation }: any) {
  const {
    activeSession,
    pendingLogs,
    queueOfflineLog,
    refreshSessionData,
    syncNow,
    syncState,
  } = useAuth();
  
  const [tasksDone, setTasksDone] = useState('');
  const [skillsLearned, setSkillsLearned] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { colors } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Daily Log',
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      refreshSessionData().catch(() => undefined);
    }, [refreshSessionData]),
  );

  const progress = useMemo(() => {
    if (!activeSession) return null;
    try {
      const start = parseISO(activeSession.startDate);
      const end = parseISO(activeSession.endDate);
      const now = new Date();
      
      const totalWeeks = Math.max(1, differenceInWeeks(end, start));
      const currentWeek = Math.max(1, differenceInWeeks(now, start) + 1);
      
      const cappedCurrentWeek = Math.min(currentWeek, totalWeeks);
      const percentage = Math.min(100, Math.round((cappedCurrentWeek / totalWeeks) * 100));

      return { currentWeek: cappedCurrentWeek, totalWeeks, percentage };
    } catch {
      return null;
    }
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

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.granted) {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
      } else {
        alert('Gallery permission is required.');
      }
      return;
    }

    Alert.alert(
      'Attach Photo',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (permission.granted) {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
              });
              if (!result.canceled) setImageUri(result.assets[0].uri);
            } else {
              Alert.alert('Permission needed', 'Camera permission is required.');
            }
          }
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.granted) {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
              });
              if (!result.canceled) setImageUri(result.assets[0].uri);
            } else {
              Alert.alert('Permission needed', 'Gallery permission is required.');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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

    let { coords, error } = await getResilientCoordinates();

    // Development convenience only: production submissions still require live GPS.
    if (!coords && DEV_GPS_FALLBACK_ENABLED && activeSession?.company?.location?.coordinates) {
      coords = {
        latitude: activeSession.company.location.coordinates[1],
        longitude: activeSession.company.location.coordinates[0],
      };
    } else if (!coords && DEV_GPS_FALLBACK_ENABLED) {
      // Final dev fallback so emulator testing is still possible without GPS hardware.
      coords = { latitude: -1.2921, longitude: 36.8219 };
    }

    if (!coords) {
      setSubmitting(false);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: error || 'Could not verify your location. Please ensure GPS is enabled.',
      });
      return;
    }

    try {
      const payload = {
        localId: Date.now().toString(),
        idempotencyKey: Crypto.randomUUID(),
        sessionId: activeSession._id,
        tasksDone: tasksDone.trim(),
        skillsLearned: skillsLearned.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        capturedAt: new Date().toISOString(),
        syncState: 'queued' as const,
        retryCount: 0,
        ...(imageUri && { imageUri })
      };

      // Always save locally first for robustness
      await queueOfflineLog(payload);

      // Trigger background sync
      syncManager.triggerSync().catch(console.error);

      Toast.show({
        type: 'success',
        text1: 'Log Saved',
        text2: 'Your log is safely queued and syncing.',
      });

      setTasksDone('');
      setSkillsLearned('');
      setImageUri(null);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save log. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isReady = !!(tasksDone && skillsLearned && activeSession);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brand} />}
    >
      {/* Progress Bar */}
      {progress && (
        <View
          style={{
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>Attachment Progress</Text>
            <View style={{ backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand }}>
                Week {progress.currentWeek} of {progress.totalWeeks}
              </Text>
            </View>
          </View>
          <View style={{ height: 8, width: '100%', borderRadius: 99, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                borderRadius: 99,
                backgroundColor: colors.brand,
                width: `${progress.percentage}%`,
              }}
            />
          </View>
          <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSoft }}>
            {progress.percentage}% complete
          </Text>
        </View>
      )}

      {/* Offline Queue Banner */}
      {pendingLogs.length > 0 && (() => {
        const hasFailed = pendingLogs.some(log => log.syncState === 'failed');
        const failedMessage = pendingLogs.find(log => log.syncState === 'failed')?.lastError;
        
        return (
          <View
            style={{
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: hasFailed ? colors.danger : colors.warning,
              backgroundColor: hasFailed ? colors.dangerSoft : colors.warningSoft,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <WifiOff size={16} color={hasFailed ? colors.danger : colors.warning} />
                <Text style={{ fontWeight: '700', fontSize: 13, color: hasFailed ? colors.danger : colors.warning }}>
                  Offline Queue ({pendingLogs.length})
                </Text>
              </View>
              <TouchableOpacity onPress={() => syncNow().catch((error) => setMessage(extractApiError(error)))}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: colors.brand }}>
                  {syncState.syncing ? 'Syncing...' : (hasFailed ? 'Retry Failed' : 'Sync Now')}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: hasFailed ? colors.danger : colors.warning }}>
              {hasFailed ? `Error: ${failedMessage}` : (syncState.lastMessage || 'Waiting for internet connection to sync logs.')}
            </Text>
          </View>
        );
      })()}

      {/* Today's Log Form */}
      <View
        style={{
          borderRadius: 28,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 3,
        }}
      >
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
            Today's Log
          </Text>
          <Text style={{ marginTop: 6, fontSize: 14, color: colors.textSoft }}>
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </Text>
          {!activeSession && (
            <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.warningSoft }}>
              <Text style={{ fontSize: 13, color: colors.warning }}>
                Waiting for active session to enable submissions.
              </Text>
            </View>
          )}
        </View>

        <FloatingLabelInput
          label="Tasks Completed"
          placeholder="What did you work on today?"
          value={tasksDone}
          onChangeText={setTasksDone}
          multiline
        />

        <FloatingLabelInput
          label="Skills & Lessons"
          placeholder="What did you learn or practice?"
          value={skillsLearned}
          onChangeText={setSkillsLearned}
          multiline
        />

        {/* Image Picker */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 4 }}>
          {imageUri ? (
            <View
              style={{
                height: 80,
                width: 80,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Image source={{ uri: imageUri }} style={{ height: '100%', width: '100%' }} />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 99,
                  padding: 4,
                }}
                onPress={() => setImageUri(null)}
              >
                <X size={12} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: colors.surfaceMuted,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Camera size={20} color={colors.textSoft} />
              <Text style={{ marginLeft: 8, fontWeight: '600', color: colors.textMuted }}>Attach Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !isReady}
          activeOpacity={0.8}
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 16,
            borderRadius: 18,
            backgroundColor: isReady ? colors.brand : colors.borderStrong,
            shadowColor: isReady ? colors.brand : 'transparent',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isReady ? 0.3 : 0,
            shadowRadius: 12,
            elevation: isReady ? 4 : 0,
          }}
        >
          {submitting ? (
            <>
              <ActivityIndicator color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, marginLeft: 12 }}>Getting GPS...</Text>
            </>
          ) : (
            <>
              <MapPin size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>Capture & Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {message ? (
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.dangerSoft }}>
          <Text style={{ fontSize: 13, color: colors.danger }}>{message}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
