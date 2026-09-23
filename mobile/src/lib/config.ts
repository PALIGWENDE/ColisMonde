import { Platform } from "react-native";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Sur web, la cible tourne dans le navigateur de la même machine que le serveur de dev — utiliser
 * l'IP réseau configurée pour le mobile (nécessaire pour qu'un téléphone physique l'atteigne) échoue
 * ici sur certaines configs Windows où la boucle vers sa propre IP LAN ("hairpin") ne fonctionne pas.
 * `window.location.hostname` retombe naturellement sur "localhost" quand la page est ouverte ainsi.
 */
function resolveUrl(fallback: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:4000`;
  }
  return fallback;
}

export const API_URL = resolveUrl((extra.apiUrl as string) ?? "http://localhost:4000");
export const SOCKET_URL = resolveUrl((extra.socketUrl as string) ?? "http://localhost:4000");
