import type { ViewStyle } from "react-native";
import { Platform } from "react-native";

/**
 * Équivalents RN des boxShadow de web/tailwind.config.ts (soft-glow, elevated) — non traduisibles
 * via className NativeWind, à appliquer via le prop `style`. iOS utilise shadow*, Android elevation.
 */
export const shadows: Record<"softGlow" | "elevated", ViewStyle> = {
  softGlow: Platform.select({
    ios: { shadowColor: "#009E49", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20 },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  elevated: Platform.select({
    ios: { shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 32 },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle,
};
