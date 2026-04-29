import NetInfo from '@react-native-community/netinfo';
import { offlineLogStorage } from '../services/storage';
import { logbookApi } from '../services/api';
import { OfflineLogPayload } from '../types';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

class SyncManager {
  private isSyncing = false;

  async triggerSync(): Promise<void> {
    if (this.isSyncing) return;
    
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) return;

    this.isSyncing = true;
    try {
      const logs = await offlineLogStorage.getLogs();
      const now = Date.now();

      // Only pick logs that are 'queued' or 'failed' and are ready for retry
      const pendingLogs = logs.filter(
        (log) => 
          (log.syncState === 'queued' || log.syncState === 'failed') && 
          (!log.nextRetryAt || log.nextRetryAt <= now)
      );

      for (const log of pendingLogs) {
        await this.syncSingleLog(log);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncSingleLog(log: OfflineLogPayload) {
    // 1. Mark as syncing
    await this.updateLogState(log.idempotencyKey, { syncState: 'syncing' });

    try {
      // 2. Attempt API call
      await logbookApi.submitLog(log);
      
      // 3. Success: Remove from offline queue entirely
      await offlineLogStorage.removeLog(log.idempotencyKey);
    } catch (error: any) {
      // 4. Handle Failure & Exponential Backoff
      const isNetworkError = !error.response || error.message?.toLowerCase().includes('network error');
      const isServerError = error.response?.status >= 500;
      
      if (isNetworkError || isServerError) {
        const nextRetryCount = log.retryCount + 1;
        if (nextRetryCount > MAX_RETRIES) {
          await this.updateLogState(log.idempotencyKey, { 
            syncState: 'failed', 
            lastError: 'Max retries exceeded. Please manually re-submit.' 
          });
        } else {
          // Exponential backoff: 2s, 4s, 8s, 16s...
          const delay = BASE_DELAY_MS * Math.pow(2, log.retryCount);
          await this.updateLogState(log.idempotencyKey, {
            syncState: 'queued',
            retryCount: nextRetryCount,
            nextRetryAt: Date.now() + delay,
            lastError: 'Network error, will retry soon...'
          });
        }
      } else {
        // 400 Bad Request (e.g., validation error) - Do not retry automatically
        await this.updateLogState(log.idempotencyKey, { 
          syncState: 'failed', 
          lastError: error.response?.data?.message || 'Invalid data submitted.'
        });
      }
    }
  }

  private async updateLogState(idempotencyKey: string, updates: Partial<OfflineLogPayload>) {
    const logs = await offlineLogStorage.getLogs();
    const updatedLogs = logs.map(log => 
      log.idempotencyKey === idempotencyKey ? { ...log, ...updates } : log
    );
    await offlineLogStorage.setLogs(updatedLogs);
  }
}

export const syncManager = new SyncManager();
