import rateLimit from "express-rate-limit";

/** Anti brute-force sur les tentatives de connexion : 10 essais / 15 min par IP. */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_REQUESTS", message: "Trop de tentatives de connexion, réessayez dans 15 minutes" },
});

/** Anti-spam sur la création de compte : 5 comptes / heure / IP. */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_REQUESTS", message: "Trop de comptes créés depuis cette adresse, réessayez plus tard" },
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_REQUESTS", message: "Trop de requêtes, réessayez plus tard" },
});

/** Limite générale appliquée à toute l'API pour absorber les pics/abus. */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
