import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fromExpoConfig = Constants.expoConfig?.extra?.apiBaseUrl;
const fromPublicEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

const fallbackBaseUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

export const API_BASE_URL = (fromPublicEnv || fromExpoConfig || fallbackBaseUrl).replace(/\/+$/, '');
