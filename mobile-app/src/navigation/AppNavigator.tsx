import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { ForceChangePasswordScreen } from '../screens/auth/ForceChangePasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { useTheme } from '../theme/ThemeContext';
import { TabNavigator } from './TabNavigator';

export type RootStackParamList = {
  Login: undefined;
  ChangePassword: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface px-6">
      <ActivityIndicator size="large" color="#0f766e" />
      <Text className="mt-4 text-base text-muted">Loading KaziLog...</Text>
    </View>
  );
}

export function AppNavigator() {
  const { booting, user } = useAuth();
  const { colors } = useTheme();

  if (booting) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text, fontWeight: '600' },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : user.mustChangePassword ? (
          <Stack.Screen
            name="ChangePassword"
            component={ForceChangePasswordScreen}
            options={{ title: 'Change Password', gestureEnabled: false }}
          />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
