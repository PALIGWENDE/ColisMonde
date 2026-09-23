import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";

/**
 * Route racine "/" — nécessaire pour le ciblage web (URL directe), où Expo Router a besoin d'un
 * gestionnaire explicite contrairement à la navigation native qui retombe naturellement sur le
 * premier écran accessible du Stack.Protected actif (voir src/app/_layout.tsx).
 */
export default function Index() {
  const status = useAuthStore((s) => s.status);
  return <Redirect href={status === "authenticated" ? "/accueil" : "/connexion"} />;
}
