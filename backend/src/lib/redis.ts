import { createClient } from "redis";
import { env } from "@/config/env";

export const isRedisConfigured = Boolean(env.REDIS_URL);

/**
 * Client Redis partagé, utilisé pour l'adaptateur Socket.IO multi-instances et le store de
 * limitation de débit. `null` quand REDIS_URL n'est pas défini — l'app tourne alors normalement
 * en mono-instance (comportement historique), sans dépendance dure à Redis en développement.
 */
export const redisClient = isRedisConfigured ? createClient({ url: env.REDIS_URL }) : null;

redisClient?.on("error", (err) => console.error("[redis] Erreur de connexion", err));

let connectPromise: Promise<void> | null = null;

export function connectRedis(): Promise<void> {
  if (!redisClient) return Promise.resolve();
  if (!connectPromise) connectPromise = redisClient.connect().then(() => undefined);
  return connectPromise;
}
