import axios from 'axios';

import { API_BASE_URL } from '../config/env';
import { AttachmentSession, AuthResponse, LogEntry, OfflineLogPayload } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const extractApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },
  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.put<AuthResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};

export const logbookApi = {
  async getActiveSession() {
    const { data } = await api.get<{ success: boolean; data: AttachmentSession }>('/logs/session/active');
    return data.data;
  },
  async getStudentLogs() {
    const { data } = await api.get<{ success: boolean; count: number; data: LogEntry[] }>('/logs/student');
    return data.data;
  },
  async submitLog(payload: Omit<OfflineLogPayload, 'localId' | 'capturedAt'>) {
    const { data } = await api.post('/logs', payload);
    return data;
  },
};
