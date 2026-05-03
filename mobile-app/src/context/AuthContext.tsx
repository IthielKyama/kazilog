import NetInfo from '@react-native-community/netinfo';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { MOBILE_RESET_URL_BASE } from '../config/env';
import { authApi, extractApiError, logbookApi, setAuthToken } from '../services/api';
import { authStorage, offlineLogStorage } from '../services/storage';
import { syncManager } from '../utils/SyncManager';
import { AttachmentSession, AuthUser, LogEntry, OfflineLogPayload } from '../types';

type AuthContextValue = {
  booting: boolean;
  user: AuthUser | null;
  token: string | null;
  activeSession: AttachmentSession | null;
  latestSession: AttachmentSession | null;
  logs: LogEntry[];
  pendingLogs: OfflineLogPayload[];
  syncState: { syncing: boolean; lastMessage: string | null };
  login: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSessionData: () => Promise<void>;
  queueOfflineLog: (payload: OfflineLogPayload) => Promise<void>;
  refreshPendingLogs: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  syncNow: () => Promise<void>;
  retryOfflineLog: (idempotencyKey: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<AttachmentSession | null>(null);
  const [latestSession, setLatestSession] = useState<AttachmentSession | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pendingLogs, setPendingLogs] = useState<OfflineLogPayload[]>([]);
  const [syncState, setSyncState] = useState<{ syncing: boolean; lastMessage: string | null }>({
    syncing: false,
    lastMessage: null,
  });

  const refreshPendingLogs = useCallback(async () => {
    setPendingLogs(await offlineLogStorage.getLogs());
  }, []);

  const refreshSessionData = useCallback(async () => {
    if (!user || user.role !== 'student') {
      setActiveSession(null);
      setLatestSession(null);
      setLogs([]);
      return;
    }

    const [activeResult, latestResult] = await Promise.allSettled([
      logbookApi.getActiveSession(),
      logbookApi.getLatestSession(),
    ]);

    if (activeResult.status === 'fulfilled') {
      setActiveSession(activeResult.value);
    } else {
      const message = extractApiError(activeResult.reason);
      if (/no active attachment session/i.test(message)) {
        setActiveSession(null);
      } else {
        throw activeResult.reason;
      }
    }

    if (latestResult.status === 'fulfilled') {
      setLatestSession(latestResult.value);
      setLogs(await logbookApi.getStudentLogs(latestResult.value._id));
      return;
    }

    const latestMessage = extractApiError(latestResult.reason);
    if (/no attachment session found/i.test(latestMessage)) {
      setLatestSession(null);
      setLogs([]);
      return;
    }

    throw latestResult.reason;
  }, [user]);

  const syncNow = useCallback(async () => {
    if (!token) {
      return;
    }

    setSyncState({ syncing: true, lastMessage: 'Syncing saved logs...' });

    try {
      await syncManager.triggerSync();
      await refreshPendingLogs();
      await refreshSessionData();

      setSyncState({ syncing: false, lastMessage: 'Sync complete.' });
    } catch (error) {
      setSyncState({ syncing: false, lastMessage: extractApiError(error) });
      throw error;
    }
  }, [refreshPendingLogs, refreshSessionData, token]);

  const retryOfflineLog = useCallback(
    async (idempotencyKey: string) => {
      setSyncState({ syncing: true, lastMessage: 'Retrying selected log...' });

      try {
        await syncManager.retryLog(idempotencyKey);
        await refreshPendingLogs();
        await refreshSessionData();
        setSyncState({ syncing: false, lastMessage: 'Selected log synced.' });
      } catch (error) {
        await refreshPendingLogs();
        setSyncState({ syncing: false, lastMessage: extractApiError(error) });
        throw error;
      }
    },
    [refreshPendingLogs, refreshSessionData],
  );

  const applyAuth = useCallback(async (nextUser: AuthUser, nextToken: string) => {
    await authStorage.setUser(nextUser);
    await authStorage.setToken(nextToken);
    setAuthToken(nextToken);
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email.trim(), password);
      if (data.role !== 'student') {
        throw new Error('This mobile app currently supports student accounts only.');
      }

      const nextUser: AuthUser = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        mustChangePassword: data.mustChangePassword,
      };

      await applyAuth(nextUser, data.token);
      await refreshPendingLogs();
    },
    [applyAuth, refreshPendingLogs],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email.trim(), MOBILE_RESET_URL_BASE);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setToken(null);
    setActiveSession(null);
    setLatestSession(null);
    setLogs([]);
    await authStorage.clearToken();
    await authStorage.clearUser();
  }, []);

  const resetPassword = useCallback(
    async (resetToken: string, newPassword: string) => {
      const data = await authApi.resetPassword(resetToken, newPassword);
      if (data.role !== 'student') {
        throw new Error('This reset link belongs to a dashboard account. Please open it from the web dashboard.');
      }

      await logout();
    },
    [logout],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const data = await authApi.changePassword(currentPassword, newPassword);
      const nextUser: AuthUser = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        mustChangePassword: data.mustChangePassword,
      };

      await applyAuth(nextUser, data.token);
      await refreshSessionData();
    },
    [applyAuth, refreshSessionData],
  );

  const queueOfflineLog = useCallback(
    async (payload: OfflineLogPayload) => {
      await offlineLogStorage.appendLog(payload);
      await refreshPendingLogs();
      setSyncState({
        syncing: false,
        lastMessage: 'Log saved on this device. It will sync automatically when internet is available.',
      });
    },
    [refreshPendingLogs],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([authStorage.getUser(), authStorage.getToken()]);
        if (storedUser && storedToken) {
          setAuthToken(storedToken);
          setUser(storedUser);
          setToken(storedToken);
        }
        await refreshPendingLogs();
      } finally {
        setBooting(false);
      }
    };

    bootstrap();
  }, [refreshPendingLogs]);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    refreshSessionData().catch(() => undefined);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncNow().catch(() => undefined);
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncNow().catch(() => undefined);
      }
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [refreshSessionData, syncNow, token, user]);

  const value = useMemo(
    () => ({
      booting,
      user,
      token,
      activeSession,
      latestSession,
      logs,
      pendingLogs,
      syncState,
      login,
      forgotPassword,
      resetPassword,
      logout,
      refreshSessionData,
      queueOfflineLog,
      refreshPendingLogs,
      changePassword,
      syncNow,
      retryOfflineLog,
    }),
    [
      activeSession,
      booting,
      changePassword,
      forgotPassword,
      login,
      latestSession,
      logout,
      logs,
      pendingLogs,
      queueOfflineLog,
      refreshPendingLogs,
      refreshSessionData,
      resetPassword,
      retryOfflineLog,
      syncNow,
      syncState,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
