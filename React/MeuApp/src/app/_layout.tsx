import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppAlertDialogHost } from '@/components/AppAlertDialog';
import { Colors } from '@/core/theme/appTheme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="home" options={{ animation: 'none' }} />
        <Stack.Screen name="menu" options={{ animation: 'none' }} />
      </Stack>
      <AppAlertDialogHost />
    </>
  );
}
