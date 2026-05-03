import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fromExpoConfig = Constants.expoConfig?.extra?.apiBaseUrl;
const fromPublicEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const configuredScheme = Constants.expoConfig?.scheme;

const fallbackBaseUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const trimTrailingSlashes = (value: string) => {
  if (value.endsWith('://')) {
    return value;
  }

  return value.replace(/\/+$/, '');
};

export const API_BASE_URL = (fromPublicEnv || fromExpoConfig || fallbackBaseUrl).replace(/\/+$/, '');
export const MOBILE_LINKING_PREFIX = trimTrailingSlashes(Constants.linkingUri || (configuredScheme ? `${configuredScheme}://` : 'kazilog://'));
export const MOBILE_RESET_URL_BASE = `${MOBILE_LINKING_PREFIX}${MOBILE_LINKING_PREFIX.endsWith('://') ? '' : '/'}reset-password`;
