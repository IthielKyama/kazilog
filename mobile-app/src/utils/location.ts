import * as Location from 'expo-location';

export const requestForegroundLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission is required to verify your workplace before submitting a log.');
  }
};

export interface LocationResult {
  coords?: { latitude: number; longitude: number };
  error?: string;
}

export const getResilientCoordinates = async (): Promise<LocationResult> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'denied') {
      return { error: 'Location permission denied. Please enable it in your phone settings to verify your workplace.' };
    }

    // Try balanced accuracy with a strict timeout
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000))
    ]);

    return { coords: { latitude: position.coords.latitude, longitude: position.coords.longitude } };
    
  } catch (err: any) {
    if (err.message === 'TIMEOUT') {
      // Fallback 1: Try Last Known Location (instant)
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return { coords: { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude } };
      }
      return { error: 'GPS signal is too weak. Please move outside or closer to a window.' };
    }

    if (!await Location.hasServicesEnabledAsync()) {
      return { error: 'Your device location services are turned off. Please turn on GPS.' };
    }

    return { error: 'An unknown error occurred while fetching GPS. Please restart the app.' };
  }
};
