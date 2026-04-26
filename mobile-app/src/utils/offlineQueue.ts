import NetInfo from '@react-native-community/netinfo';

import { logbookApi } from '../services/api';
import { offlineLogStorage } from '../services/storage';

export const syncOfflineLogs = async () => {
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) {
    return { synced: 0, skipped: true };
  }

  const queuedLogs = await offlineLogStorage.getLogs();
  let synced = 0;

  for (const queuedLog of queuedLogs) {
    await logbookApi.submitLog({
      sessionId: queuedLog.sessionId,
      tasksDone: queuedLog.tasksDone,
      skillsLearned: queuedLog.skillsLearned,
      latitude: queuedLog.latitude,
      longitude: queuedLog.longitude,
    });

    await offlineLogStorage.removeLog(queuedLog.localId);
    synced += 1;
  }

  return { synced, skipped: false };
};
