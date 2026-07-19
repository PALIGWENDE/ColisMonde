import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Wrapper natif (iOS + Android) autour de l'app web ColisMonde existante : la WebView pointe vers
 * l'URL HTTPS déployée (voir README), plutôt qu'un export statique — nos routes dynamiques
 * (/trajets/[id], /envois/[id]...) sont client-side avec fetch runtime vers l'API, donc un simple
 * "wrap" du site fonctionne sans avoir à pré-générer chaque page.
 *
 * CAPACITOR_SERVER_URL doit pointer vers une URL HTTPS de production pour un vrai build App
 * Store / Play Store. En développement, elle peut pointer vers l'IP locale du poste de dev
 * (PAS "localhost", qui depuis un appareil/émulateur mobile se référerait à l'appareil lui-même) :
 * ex. http://192.168.1.42:3000
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "app.colismonde.mobile",
  appName: "ColisMonde",
  webDir: "www", // dossier placeholder non utilisé en mode "server url" (cf. server.url ci-dessous)
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"), // autorise le HTTP non chiffré uniquement en dev local
      }
    : undefined,
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
