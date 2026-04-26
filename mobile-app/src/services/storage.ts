import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { AuthUser, OfflineLogPayload } from '../types';

const TOKEN_KEY = 'kazilog_token';
const USER_KEY = 'kazilog_user';
const OFFLINE_LOGS_KEY = 'kazilog_offline_logs';

const secureStoreAvailable =
  typeof SecureStore.getItemAsync === 'function' &&
  typeof SecureStore.setItemAsync === 'function' &&
  typeof SecureStore.deleteItemAsync === 'function';

const tokenStorage = {
  async getItem() {
    if (secureStoreAvailable) {
      try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      } catch {
        // Fall back when SecureStore is unavailable in the current runtime, such as some web setups.
      }
    }

    return AsyncStorage.getItem(TOKEN_KEY);
  },
  async setItem(value: string) {
    if (secureStoreAvailable) {
      try {
        await SecureStore.setItemAsync(TOKEN_KEY, value);
        return;
      } catch {
        // Fall back when SecureStore is unavailable in the current runtime, such as some web setups.
      }
    }

    await AsyncStorage.setItem(TOKEN_KEY, value);
  },
  async removeItem() {
    if (secureStoreAvailable) {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        return;
      } catch {
        // Fall back when SecureStore is unavailable in the current runtime, such as some web setups.
      }
    }

    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};

export const authStorage = {
  async getToken() {
    return tokenStorage.getItem();
  },
  async setToken(token: string) {
    return tokenStorage.setItem(token);
  },
  async clearToken() {
    return tokenStorage.removeItem();
  },
  async getUser() {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  async setUser(user: AuthUser) {
    return AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async clearUser() {
    return AsyncStorage.removeItem(USER_KEY);
  },
};

export const offlineLogStorage = {
  async getLogs() {
    const raw = await AsyncStorage.getItem(OFFLINE_LOGS_KEY);
    return raw ? (JSON.parse(raw) as OfflineLogPayload[]) : [];
  },
  async setLogs(logs: OfflineLogPayload[]) {
    return AsyncStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(logs));
  },
  async appendLog(log: OfflineLogPayload) {
    const logs = await this.getLogs();
    logs.push(log);
    await this.setLogs(logs);
    return logs;
  },
  async removeLog(localId: string) {
    const logs = await this.getLogs();
    const nextLogs = logs.filter((item) => item.localId !== localId);
    await this.setLogs(nextLogs);
    return nextLogs;
  },
};
