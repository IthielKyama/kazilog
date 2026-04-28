import * as Location from 'expo-location';

export const requestForegroundLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission is required to verify your workplace before submitting a log.');
  }
};

export const getCurrentCoordinates = async () => {
  await requestForegroundLocation();

  try {
    // Wrap in a promise race to prevent infinite hanging (e.g. on web without network)
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    // Fallback to last known position if current position fails or times out
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    }
    
    // If all else fails, return null so the screen can decide on a fallback (like workplace location)
    return null;
  }
};
