import * as Location from 'expo-location';

export const requestForegroundLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission is required to verify your workplace before submitting a log.');
  }
};

export const getCurrentCoordinates = async () => {
  await requestForegroundLocation();

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
};
