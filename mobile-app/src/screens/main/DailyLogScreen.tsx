import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { differenceInWeeks, parseISO } from 'date-fns';
import { Camera, MapPin, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Crypto from 'expo-crypto';

import { useAuth } from '../../context/AuthContext';
import { extractApiError, logbookApi } from '../../services/api';
import { getResilientCoordinates } from '../../utils/location';
import { syncManager } from '../../utils/SyncManager';
import { FloatingLabelInput } from '../../components/FloatingLabelInput';

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

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0f766e" />}
    >
      {progress && (
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-semibold text-slate-700">Attachment Progress</Text>
            <Text className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              Week {progress.currentWeek} of {progress.totalWeeks}
            </Text>
          </View>
          <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <View 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${progress.percentage}%` }} 
            />
          </View>
        </View>
      )}

      {pendingLogs.length > 0 && (() => {
        const hasFailed = pendingLogs.some(log => log.syncState === 'failed');
        const failedMessage = pendingLogs.find(log => log.syncState === 'failed')?.lastError;
        
        return (
          <View className={`rounded-2xl p-4 border ${hasFailed ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`${hasFailed ? 'text-red-800' : 'text-amber-800'} font-semibold text-sm`}>
                Offline Queue ({pendingLogs.length})
              </Text>
              <Text 
                className="text-brand font-bold text-sm" 
                onPress={() => syncNow().catch((error) => setMessage(extractApiError(error)))}
              >
                {syncState.syncing ? 'Syncing...' : (hasFailed ? 'Retry Failed' : 'Sync Now')}
              </Text>
            </View>
            <Text className={`text-xs ${hasFailed ? 'text-red-700' : 'text-amber-700'}`}>
              {hasFailed ? `Error: ${failedMessage}` : (syncState.lastMessage || 'Waiting for internet connection to sync logs.')}
            </Text>
          </View>
        );
      })()}

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
        <View className="mb-6">
          <Text className="text-xl font-bold text-slate-800">Today's Log</Text>
          {!activeSession && (
             <Text className="text-sm text-amber-600 mt-2">
               Waiting for active session to enable submissions.
             </Text>
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

        <View className="flex-row items-center mb-6 mt-2">
          {imageUri ? (
            <View className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200">
              <Image source={{ uri: imageUri }} className="h-full w-full" />
              <TouchableOpacity 
                className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                onPress={() => setImageUri(null)}
              >
                <X size={12} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={pickImage}
              className="flex-row items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl"
            >
              <Camera size={20} color="#64748b" />
              <Text className="ml-2 text-slate-600 font-medium">Attach Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !tasksDone || !skillsLearned || !activeSession}
          className={`w-full flex-row justify-center items-center py-4 rounded-2xl ${
            tasksDone && skillsLearned && activeSession ? 'bg-emerald-600 shadow-md shadow-emerald-200' : 'bg-slate-300'
          }`}
        >
          {submitting ? (
            <>
              <ActivityIndicator color="white" />
              <Text className="text-white font-semibold text-lg ml-3">Getting GPS...</Text>
            </>
          ) : (
            <>
              <MapPin size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">Capture & Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
