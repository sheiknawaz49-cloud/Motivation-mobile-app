/**
 * Root Stack Layout for Motiveate AI.
 * Handles theme rotation, splash screen, and navigation stack.
 */

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { getActiveDailyTheme } from '../constants/themes';
import api from '../api/client';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const theme = getActiveDailyTheme();

  useEffect(() => {
    async function prepare() {
      try {
        await api.init();
      } catch (e) {
        console.warn('Initialization error', e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" backgroundColor={theme.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
