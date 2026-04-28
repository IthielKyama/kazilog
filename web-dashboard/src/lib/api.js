import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_BASE_URL = envBaseUrl.replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const buildAuthConfig = (token) =>
  token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};

export const extractApiError = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage;
