import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncManager } from './SyncManager';

export const BACKGROUND_SYNC_TASK = 'BACKGROUND_LOG_SYNC';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await syncManager.triggerSync();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundSync = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false, // Continue after app is swiped away (Android)
      startOnBoot: true,     // Start on device reboot (Android)
    });
  } catch (err) {
    console.log("Background Fetch failed to register", err);
  }
};
