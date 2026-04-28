import './global.css';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerBackgroundSync } from './src/utils/backgroundTask';

import Toast from 'react-native-toast-message';

export default function App() {
  useEffect(() => {
    registerBackgroundSync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
        <Toast topOffset={60} config={undefined} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
