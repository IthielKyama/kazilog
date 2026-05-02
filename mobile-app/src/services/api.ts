import axios from 'axios';

import { API_BASE_URL } from '../config/env';
import { AttachmentSession, AuthResponse, LogEntry, LogSubmissionPayload } from '../types';

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
  async getLatestSession() {
    const { data } = await api.get<{ success: boolean; data: AttachmentSession }>('/logs/session/latest');
    return data.data;
  },
  async getStudentLogs(sessionId?: string) {
    const params = sessionId ? { sessionId } : undefined;
    const { data } = await api.get<{ success: boolean; count: number; data: LogEntry[] }>('/logs/student', { params });
    return data.data;
  },
  async submitLog(payload: LogSubmissionPayload) {
    if (payload.imageUri) {
      const formData = new FormData();
      formData.append('sessionId', payload.sessionId);
      formData.append('tasksDone', payload.tasksDone);
      formData.append('skillsLearned', payload.skillsLearned);
      formData.append('latitude', payload.latitude.toString());
      formData.append('longitude', payload.longitude.toString());
      
      const filename = payload.imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      // @ts-ignore: React Native FormData accepts an object with uri, name, and type
      formData.append('image', { uri: payload.imageUri, name: filename, type });
      
      const { data } = await api.post('/logs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    }

    const { data } = await api.post('/logs', payload);
    return data;
  },
};
