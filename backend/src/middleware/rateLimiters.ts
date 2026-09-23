import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { isRedisConfigured, redisClient } from "@/lib/redis";

/**
 * Sans Redis, express-rate-limit compte en mémoire locale — cohérent en mono-instance seulement.
 * Avec plusieurs instances de serveur derrière un même load balancer, chaque instance aurait son
 * propre compteur et la limite réelle serait multipliée par le nombre d'instances : le store Redis
 * partagé applique la même limite quel que soit le nombre d'instances.
 */
function store() {
  if (!isRedisConfigured || !redisClient) return undefined;
  const client = redisClient;
  return new RedisStore({ sendCommand: (...args: string[]) => client.sendCommand(args) });
}

/** Anti brute-force sur les tentatives de connexion : 10 essais / 15 min par IP. */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: store(),
  message: { error: "TOO_MANY_REQUESTS", message: "Trop de tentatives de connexion, réessayez dans 15 minutes" },
});

/** Anti-spam sur la création de compte : 5 comptes / heure / IP. */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: store(),
  message: { error: "TOO_MANY_REQUESTS", message: "Trop de comptes créés depuis cette adresse, réessayez plus tard" },
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: store(),
  message: { error: "TOO_MANY_REQUESTS", message: "Trop de requêtes, réessayez plus tard" },
});

/** Limite générale appliquée à toute l'API pour absorber les pics/abus. */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: store(),
});
