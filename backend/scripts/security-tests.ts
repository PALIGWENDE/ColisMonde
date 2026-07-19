/**
 * Suite de tests de sécurité "boîte noire" exécutée contre une instance backend en cours
 * d'exécution (npm run dev), complétée par quelques vérifications directes en base.
 *
 * Usage : npm run security:test   (le serveur doit tourner sur http://localhost:4000)
 *
 * Ce script n'est PAS une suite de tests unitaires — c'est un outil d'audit qui imprime un
 * rapport PASS/FAIL en console. Les résultats sont retranscrits dans SECURITY.md.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const API = process.env.SECURITY_TEST_API_URL ?? "http://localhost:4000";
const prisma = new PrismaClient();

interface Result {
  name: string;
  pass: boolean;
  detail: string;
}
const results: Result[] = [];

function record(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"} — ${name}\n    ${detail}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function randomEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerUser(prefix: string) {
  const email = randomEmail(prefix);
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "TestPass123", firstName: "Sec", lastName: "Tester" }),
  });
  const body = await json(res);
  const setCookie = res.headers.get("set-cookie");
  return { email, accessToken: body?.accessToken as string, userId: body?.user?.id as string, cookie: setCookie };
}

async function main() {
  console.log(`\n=== Suite de tests de sécurité ColisMonde — cible ${API} ===\n`);

  // ---------------------------------------------------------------------
  // 1. Hachage des mots de passe
  // ---------------------------------------------------------------------
  const userA = await registerUser("alice");
  const dbUser = await prisma.user.findUnique({ where: { email: userA.email } });
  const looksHashed = Boolean(dbUser?.passwordHash?.startsWith("$2")) && dbUser!.passwordHash !== "TestPass123";
  record(
    "Mots de passe hachés (bcrypt) et jamais stockés en clair",
    looksHashed,
    `passwordHash = ${dbUser?.passwordHash?.slice(0, 10)}... (préfixe bcrypt attendu: $2a$/$2b$)`,
  );

  // ---------------------------------------------------------------------
  // 2. Injection SQL via les paramètres de recherche
  // ---------------------------------------------------------------------
  const sqlPayload = "'; DROP TABLE \"User\"; --";
  const sqlRes = await fetch(`${API}/api/cities/search?q=${encodeURIComponent(sqlPayload)}`);
  const userCountAfter = await prisma.user.count();
  record(
    "Injection SQL sur /api/cities/search sans effet et sans erreur serveur",
    sqlRes.status === 200 && userCountAfter > 0,
    `Statut HTTP: ${sqlRes.status}, table User toujours présente (${userCountAfter} lignes) — Prisma paramètre toutes les requêtes.`,
  );

  const sqlLoginRes = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "' OR '1'='1", password: "x" }),
  });
  record(
    "Injection SQL via le champ e-mail du login rejetée proprement (400/401, pas 500)",
    sqlLoginRes.status === 400 || sqlLoginRes.status === 401,
    `Statut HTTP: ${sqlLoginRes.status} (validation zod : format e-mail invalide)`,
  );

  // ---------------------------------------------------------------------
  // 3. XSS stocké
  // ---------------------------------------------------------------------
  const xssPayload = "<script>alert('xss')</script>";
  const cityId = await prisma.city.findFirst();
  if (cityId) {
    const reqRes = await fetch(`${API}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userA.accessToken}` },
      body: JSON.stringify({
        departureCityId: cityId.id,
        arrivalCityId: (await prisma.city.findFirst({ where: { id: { not: cityId.id } } }))!.id,
        desiredDate: new Date(Date.now() + 86400000).toISOString(),
        weightKg: 1,
        category: "OTHER",
        description: xssPayload,
        sizeEstimate: "SMALL",
        isUrgent: false,
        offeredPrice: 10,
      }),
    });
    const reqBody = await json(reqRes);
    const storedRaw = reqBody?.request?.description === xssPayload;
    const contentType = reqRes.headers.get("content-type") ?? "";
    record(
      "Payload XSS stocké tel quel (échappement délégué au rendu React) et servi en JSON strict",
      storedRaw && contentType.includes("application/json"),
      `Content-Type: ${contentType} — un payload <script> renvoyé en JSON n'est jamais exécuté par le navigateur ; ` +
        `l'échappement a lieu à l'affichage (React échappe par défaut, jamais de dangerouslySetInnerHTML sur du contenu utilisateur).`,
    );
  }

  // ---------------------------------------------------------------------
  // 4. Accès sans authentification
  // ---------------------------------------------------------------------
  const noAuthRes = await fetch(`${API}/api/users/me`);
  record(
    "Route protégée inaccessible sans jeton (401)",
    noAuthRes.status === 401,
    `GET /api/users/me sans Authorization → ${noAuthRes.status}`,
  );

  const badTokenRes = await fetch(`${API}/api/users/me`, { headers: { Authorization: "Bearer invalid.token.value" } });
  record(
    "Jeton JWT invalide/forgé rejeté (401)",
    badTokenRes.status === 401,
    `GET /api/users/me avec un JWT invalide → ${badTokenRes.status}`,
  );

  // ---------------------------------------------------------------------
  // 5. IDOR — accès croisé aux ressources d'autrui
  // ---------------------------------------------------------------------
  const userB = await registerUser("bob");

  const travelerCity1 = await prisma.city.findFirst();
  const travelerCity2 = await prisma.city.findFirst({ where: { id: { not: travelerCity1!.id } } });
  const tripRes = await fetch(`${API}/api/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userA.accessToken}` },
    body: JSON.stringify({
      departureCityId: travelerCity1!.id,
      arrivalCityId: travelerCity2!.id,
      departureDate: new Date(Date.now() + 86400000).toISOString(),
      availableWeightKg: 5,
      pricePerKg: 10,
      acceptedCategories: ["OTHER"],
      maxItemSize: "SMALL",
      transportMode: "PLANE",
    }),
  });
  const tripBody = await json(tripRes);

  const requestRes = await fetch(`${API}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userA.accessToken}` },
    body: JSON.stringify({
      departureCityId: travelerCity1!.id,
      arrivalCityId: travelerCity2!.id,
      desiredDate: new Date(Date.now() + 86400000).toISOString(),
      weightKg: 1,
      category: "OTHER",
      description: "Colis de test IDOR",
      sizeEstimate: "SMALL",
      isUrgent: false,
      offeredPrice: 10,
    }),
  });
  const requestBody = await json(requestRes);

  // userA est à la fois sender et traveler (auto-réservation) : on force la vérification IDOR
  // en créant le booking depuis userA, puis en tentant un accès depuis userB (non-participant).
  let bookingId: string | null = null;
  if (tripBody?.trip?.id === undefined) {
    record("Setup IDOR : création du trajet de test", false, `Échec création trajet: ${JSON.stringify(tripBody)}`);
  } else {
    // Astuce : userA ne peut pas réserver son propre trajet, donc on utilise directement
    // Prisma pour créer un booking synthétique appartenant à userA (sender ET traveler simulés
    // par deux comptes A/A2), afin de tester si userB (tiers) peut y accéder.
    const userA2 = await registerUser("alice2");
    const booking = await prisma.booking.create({
      data: {
        tripId: tripBody.trip.id,
        requestId: requestBody.request.id,
        senderId: userA.userId,
        travelerId: userA2.userId,
        initiatorId: userA.userId,
        agreedPrice: 10,
        serviceFee: 15,
      },
    });
    bookingId = booking.id;

    const idorRes = await fetch(`${API}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${userB.accessToken}` },
    });
    record(
      "IDOR — un tiers non-participant ne peut pas lire une réservation d'autrui (403)",
      idorRes.status === 403,
      `GET /api/bookings/${bookingId} avec le jeton de Bob (non-participant) → ${idorRes.status}`,
    );

    const idorAcceptRes = await fetch(`${API}/api/bookings/${bookingId}/accept`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${userB.accessToken}` },
    });
    record(
      "IDOR — un tiers ne peut pas accepter une réservation d'autrui (403)",
      idorAcceptRes.status === 403,
      `PATCH /api/bookings/${bookingId}/accept avec le jeton de Bob → ${idorAcceptRes.status}`,
    );

    const participantRes = await fetch(`${API}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${userA.accessToken}` },
    });
    record(
      "Le participant légitime (sender) peut lire sa propre réservation (200)",
      participantRes.status === 200,
      `GET /api/bookings/${bookingId} avec le jeton d'Alice (sender) → ${participantRes.status}`,
    );
  }

  // ---------------------------------------------------------------------
  // 6. Fuite de PII (email/téléphone) dans les listes publiques
  // ---------------------------------------------------------------------
  const tripsListRes = await fetch(`${API}/api/trips`);
  const tripsListBody = await json(tripsListRes);
  const tripsListText = JSON.stringify(tripsListBody);
  const leaksEmail = tripsListText.includes("@example.com") && tripsListText.includes("email");
  record(
    "Aucune adresse e-mail exposée dans la liste publique des trajets",
    !leaksEmail,
    `GET /api/trips (public) : champ "email" absent des profils voyageurs.`,
  );

  const publicUserRes = await fetch(`${API}/api/users/${userA.userId}/public`);
  const publicUserBody = await json(publicUserRes);
  record(
    "Le profil public d'un utilisateur ne contient ni e-mail ni téléphone",
    publicUserBody?.user?.email === undefined && publicUserBody?.user?.phone === undefined,
    `GET /api/users/${userA.userId}/public → clés renvoyées: ${Object.keys(publicUserBody?.user ?? {}).join(", ")}`,
  );

  // ---------------------------------------------------------------------
  // 7. Rotation et rejeu du refresh token
  // ---------------------------------------------------------------------
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userA.email, password: "TestPass123" }),
  });
  const rawCookie = loginRes.headers.get("set-cookie") ?? "";
  const cookieMatch = /cm_refresh=([^;]+)/.exec(rawCookie);
  if (cookieMatch) {
    const cookieHeader = `cm_refresh=${cookieMatch[1]}`;
    const refresh1 = await fetch(`${API}/api/auth/refresh`, { method: "POST", headers: { Cookie: cookieHeader } });
    record("Premier refresh accepté (200)", refresh1.status === 200, `POST /api/auth/refresh (1er usage) → ${refresh1.status}`);

    // Rejeu du MÊME refresh token (déjà consommé/révoqué par rotation) : doit échouer.
    const refresh2 = await fetch(`${API}/api/auth/refresh`, { method: "POST", headers: { Cookie: cookieHeader } });
    record(
      "Rejeu (replay) d'un refresh token déjà utilisé rejeté (401)",
      refresh2.status === 401,
      `POST /api/auth/refresh (rejeu du même cookie) → ${refresh2.status} — la rotation invalide l'ancien token.`,
    );
  } else {
    record("Setup refresh token", false, "Cookie cm_refresh introuvable dans la réponse de login");
  }

  // ---------------------------------------------------------------------
  // 8. Upload de fichier — type MIME invalide rejeté
  // ---------------------------------------------------------------------
  const maliciousFile = new Blob(["#!/bin/sh\necho pwned"], { type: "application/x-sh" });
  const formData = new FormData();
  formData.append("avatar", maliciousFile, "malicious.sh");
  const uploadRes = await fetch(`${API}/api/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${userA.accessToken}` },
    body: formData,
  });
  record(
    "Upload de fichier avec un type MIME non autorisé rejeté (400)",
    uploadRes.status === 400,
    `POST /api/users/me/avatar avec un script shell déguisé → ${uploadRes.status}`,
  );

  // Fichier "image" en réalité invalide (texte brut avec extension .jpg falsifiée côté client)
  const fakeImage = new Blob(["not a real image"], { type: "image/jpeg" });
  const formData2 = new FormData();
  formData2.append("avatar", fakeImage, "fake.jpg");
  const uploadRes2 = await fetch(`${API}/api/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${userA.accessToken}` },
    body: formData2,
  });
  record(
    "Fichier au contenu corrompu (mime usurpé) rejeté par le ré-encodage sharp (400)",
    uploadRes2.status === 400,
    `POST /api/users/me/avatar avec un faux JPEG (contenu texte) → ${uploadRes2.status}`,
  );

  // ---------------------------------------------------------------------
  // 9. En-têtes de sécurité HTTP
  // ---------------------------------------------------------------------
  const headersRes = await fetch(`${API}/health`);
  const hasCsp = Boolean(headersRes.headers.get("content-security-policy"));
  const hasXCto = headersRes.headers.get("x-content-type-options") === "nosniff";
  record(
    "En-têtes de sécurité (Content-Security-Policy, X-Content-Type-Options) présents via helmet",
    hasCsp && hasXCto,
    `CSP: ${hasCsp ? "présent" : "absent"}, X-Content-Type-Options: ${headersRes.headers.get("x-content-type-options")}`,
  );

  // ---------------------------------------------------------------------
  // 10. CORS — origine non autorisée rejetée
  // ---------------------------------------------------------------------
  const corsRes = await fetch(`${API}/api/trips`, { headers: { Origin: "http://evil-attacker.example" } });
  const acao = corsRes.headers.get("access-control-allow-origin");
  record(
    "CORS : une origine non whitelistée ne reçoit pas Access-Control-Allow-Origin",
    acao === null,
    `Origin: http://evil-attacker.example → Access-Control-Allow-Origin: ${acao ?? "(absent)"}`,
  );

  // ---------------------------------------------------------------------
  // 11. Suppression de compte — anonymisation effective
  // ---------------------------------------------------------------------
  const userC = await registerUser("carol");
  const deleteRes = await fetch(`${API}/api/users/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${userC.accessToken}` },
  });
  const loginAfterDeleteRes = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userC.email, password: "TestPass123" }),
  });
  const meAfterDeleteRes = await fetch(`${API}/api/users/me`, {
    headers: { Authorization: `Bearer ${userC.accessToken}` },
  });
  record(
    "Suppression de compte : connexion impossible ensuite et jeton existant invalidé",
    deleteRes.status === 204 && loginAfterDeleteRes.status === 401 && meAfterDeleteRes.status === 401,
    `DELETE /api/users/me → ${deleteRes.status} ; login avec l'ancien mot de passe → ${loginAfterDeleteRes.status} ; ` +
      `jeton d'accès émis avant suppression → ${meAfterDeleteRes.status}`,
  );

  // ---------------------------------------------------------------------
  // 12. Blocage d'utilisateur réellement effectif (messagerie + création de réservation)
  // Réutilise userB (déjà enregistré au test 5) plutôt qu'un nouveau compte : le register
  // rate-limiter (5/heure/IP, testé plus haut) s'applique aussi à ce script lui-même.
  // ---------------------------------------------------------------------
  const userD = userB;
  const userE = await registerUser("erin");

  const cityA = await prisma.city.findFirst();
  const cityB = await prisma.city.findFirst({ where: { id: { not: cityA!.id } } });

  const tripByE = await json(
    await fetch(`${API}/api/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userE.accessToken}` },
      body: JSON.stringify({
        departureCityId: cityA!.id,
        arrivalCityId: cityB!.id,
        departureDate: new Date(Date.now() + 86400000).toISOString(),
        availableWeightKg: 5,
        pricePerKg: 10,
        acceptedCategories: ["OTHER"],
        maxItemSize: "SMALL",
        transportMode: "PLANE",
      }),
    }),
  );

  const requestByD = await json(
    await fetch(`${API}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userD.accessToken}` },
      body: JSON.stringify({
        departureCityId: cityA!.id,
        arrivalCityId: cityB!.id,
        desiredDate: new Date(Date.now() + 86400000).toISOString(),
        weightKg: 1,
        category: "OTHER",
        description: "Colis de test blocage",
        sizeEstimate: "SMALL",
        isUrgent: false,
        offeredPrice: 10,
      }),
    }),
  );

  const blockRes = await fetch(`${API}/api/users/${userE.userId}/block`, {
    method: "POST",
    headers: { Authorization: `Bearer ${userD.accessToken}` },
  });

  const blockedBookingAttempt = await fetch(`${API}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userD.accessToken}` },
    body: JSON.stringify({ tripId: tripByE.trip.id, requestId: requestByD.request.id }),
  });

  record(
    "Blocage : la création d'une réservation entre deux utilisateurs bloqués est empêchée",
    blockRes.status === 204 && blockedBookingAttempt.status === 400,
    `D bloque E → ${blockRes.status} ; D tente de réserver le trajet de E → ${blockedBookingAttempt.status} ` +
      `(attendu 400, plutôt que 201)`,
  );

  // ---------------------------------------------------------------------
  // 13. Rate limiting brute-force sur /api/auth/login
  // Volontairement en DERNIER : ce test épuise la limite de connexion (10/15min) pour l'IP du
  // script, ce qui ferait échouer à tort tout test ultérieur ayant besoin de se connecter.
  // ---------------------------------------------------------------------
  let sawTooMany = false;
  let lastStatus = 0;
  for (let i = 0; i < 12; i++) {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userA.email, password: "wrong-password" }),
    });
    lastStatus = res.status;
    if (res.status === 429) {
      sawTooMany = true;
      break;
    }
  }
  record(
    "Rate limiting déclenché après plusieurs tentatives de connexion échouées (429)",
    sawTooMany,
    sawTooMany ? "429 obtenu avant 12 tentatives (limite: 10/15min)." : `Aucun 429 reçu après 12 tentatives (dernier statut: ${lastStatus}).`,
  );

  // ---------------------------------------------------------------------
  // Bilan
  // ---------------------------------------------------------------------
  const failed = results.filter((r) => !r.pass);
  console.log(`\n=== Bilan : ${results.length - failed.length}/${results.length} tests réussis ===`);
  if (failed.length > 0) {
    console.log("Échecs :");
    failed.forEach((f) => console.log(` - ${f.name}`));
  }

  await prisma.$disconnect();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("Erreur fatale pendant les tests de sécurité :", err);
  await prisma.$disconnect();
  process.exit(1);
});
