import { Stack } from "expo-router";

/**
 * Miroir de web/src/app/(app)/(with-nav) vs (no-nav) : le groupe (tabs) porte la barre du bas,
 * les écrans ici (trajets/[id], conditions, confidentialite...) s'empilent par-dessus sans elle.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
