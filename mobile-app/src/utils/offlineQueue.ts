import NetInfo from '@react-native-community/netinfo';

import { logbookApi } from '../services/api';
import { offlineLogStorage } from '../services/storage';
import { LogSubmissionPayload } from '../types';

export const syncOfflineLogs = async () => {
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) {
    return { synced: 0, skipped: true };
  }

  const queuedLogs = await offlineLogStorage.getLogs();
  let synced = 0;

  for (const queuedLog of queuedLogs) {
    const payload: LogSubmissionPayload = {
      idempotencyKey: queuedLog.idempotencyKey,
      sessionId: queuedLog.sessionId,
      tasksDone: queuedLog.tasksDone,
      skillsLearned: queuedLog.skillsLearned,
      latitude: queuedLog.latitude,
      longitude: queuedLog.longitude,
      imageUri: queuedLog.imageUri,
    };

    await logbookApi.submitLog(payload);

    await offlineLogStorage.removeLog(queuedLog.idempotencyKey);
    synced += 1;
  }

  return { synced, skipped: false };
};
