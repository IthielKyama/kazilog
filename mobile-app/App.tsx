import './global.css';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { registerBackgroundSync } from './src/utils/backgroundTask';

import Toast from 'react-native-toast-message';

function AppShell() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
      <Toast topOffset={60} config={undefined} />
    </AuthProvider>
  );
}

export default function App() {
  useEffect(() => {
    registerBackgroundSync();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
