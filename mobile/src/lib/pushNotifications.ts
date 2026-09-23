import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { apiClient } from "@/lib/apiClient";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Demande la permission (si pas déjà accordée/refusée) puis récupère le jeton Expo Push et
 * l'enregistre côté backend. Best-effort : ne doit jamais faire échouer le flux de connexion —
 * un appareil sans permission push utilise juste l'app sans notifications hors-ligne.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (!Device.isDevice) return; // simulateurs/émulateurs ne reçoivent pas de vraies push

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

    await apiClient.post("/api/users/me/device-tokens", {
      expoPushToken,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });
  } catch (err) {
    console.warn("[push] Échec de l'enregistrement du jeton", err);
  }
}

/** Désenregistre l'appareil courant à la déconnexion, pour éviter qu'un appareil partagé reçoive les push du compte précédent. */
export async function unregisterCurrentDevicePush(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await apiClient.delete(`/api/users/me/device-tokens/${encodeURIComponent(expoPushToken)}`);
  } catch (err) {
    console.warn("[push] Échec du désenregistrement du jeton", err);
  }
}
