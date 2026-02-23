import { Stack, useSegments, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const restore = useAuthStore((s) => s.restore);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    console.log('🔍 App mounted, calling restore()');
    restore();
  }, []);

  // Handle navigation after hydration
  useEffect(() => {
    if (!hydrated) return; // Don't navigate until hydrated

    const inAuthGroup = segments[0] === 'auth';

    if (!token && !inAuthGroup) {
      // User not logged in, redirect to login
      router.replace('/auth/login');
    } else if (token && inAuthGroup) {
      // User logged in, redirect to app
      router.replace('/(tabs)/sales');
    }
  }, [token, hydrated, segments]);

  // Show loading screen while hydrating
  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        }}
      >
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
