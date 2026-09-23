import "@/global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppFonts } from "@/lib/fonts";
import { AppProviders } from "@/providers";
import { useAuthStore } from "@/store/auth";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const [fontsLoaded] = useAppFonts();
  const authResolved = status === "authenticated" || status === "guest";

  useEffect(() => {
    if (fontsLoaded && authResolved) SplashScreen.hideAsync();
  }, [fontsLoaded, authResolved]);

  if (!fontsLoaded || !authResolved) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === "authenticated"}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={status === "guest"}>
        <Stack.Screen name="connexion" />
        <Stack.Screen name="inscription" />
      </Stack.Protected>

      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="suppression-compte" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </SafeAreaProvider>
  );
}
