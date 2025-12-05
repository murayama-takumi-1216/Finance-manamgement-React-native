import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/useStore';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AlarmModal } from './src/components/common';
import useReminderAlarm from './src/hooks/useReminderAlarm';
import SplashLoadingScreen from './src/components/SplashLoadingScreen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Cannot GET /',
  'Network Error',
  'java.lang.Exception',
]);

// Keep native splash visible until our loading screen is ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { initializeAuth, isInitialized } = useAuthStore();
  const { activeAlarm, dismissAlarm, snoozeAlarm } = useReminderAlarm();
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    const init = async () => {
      if (!isInitialized) {
        try {
          await initializeAuth();
        } catch (error) {
          console.log('Init error caught:', error.message);
          // Error is handled in the store, app will show login screen
        }
      }
    };
    init();
  }, [initializeAuth, isInitialized]);

  // Set app ready when fonts loaded and auth initialized
  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setAppReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, isInitialized]);

  if (!appReady) {
    return <SplashLoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootNavigator />
            <Toast />
            <AlarmModal
              visible={!!activeAlarm}
              onDismiss={dismissAlarm}
              onSnooze={snoozeAlarm}
              reminder={activeAlarm}
            />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
