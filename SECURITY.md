# Rapport de sécurité — ColisMonde

Ce document liste les tests de sécurité réalisés sur le backend et le frontend avant livraison,
leur résultat, et les corrections appliquées. Les tests automatisés sont exécutables via :

```bash
cd backend
npm run security:test   # nécessite le serveur backend démarré (npm run dev) sur localhost:4000
```

Le script (`backend/scripts/security-tests.ts`) est un outil d'audit "boîte noire" qui exécute de
vraies requêtes HTTP contre l'API, complétées par quelques vérifications directes en base via
Prisma. **Dernière exécution : 20/20 tests réussis.**

> Le script effectue jusqu'à 5 inscriptions par exécution (limite du rate limiter testé au point
> 13) : si vous le relancez plusieurs fois dans la même heure, redémarrez le backend entre deux
> exécutions pour réinitialiser les compteurs en mémoire, sinon les inscriptions suivantes seront
> légitimement bloquées par le rate limiter lui-même.

## Résumé exécutif

| # | Test | Résultat | Correction appliquée |
|---|------|----------|----------------------|
| 1 | Hachage des mots de passe (bcrypt) | ✅ PASS | — |
| 2 | Injection SQL (paramètres de recherche) | ✅ PASS | — (Prisma paramètre nativement toutes les requêtes) |
| 3 | Injection SQL (champ e-mail du login) | ✅ PASS | — (validation zod stricte du format) |
| 4 | XSS stocké (description de colis) | ✅ PASS | — (React échappe par défaut, jamais de HTML brut injecté) |
| 5 | Accès sans jeton à une route protégée | ✅ PASS | — |
| 6 | Jeton JWT invalide/forgé | ✅ PASS | — |
| 7 | IDOR — lecture d'une réservation d'autrui | ✅ PASS | — |
| 8 | IDOR — action (accepter) sur une réservation d'autrui | ✅ PASS | — |
| 9 | Accès légitime du participant à sa propre ressource | ✅ PASS | — |
| 10 | Fuite de PII dans les listes publiques (email/téléphone) | ✅ PASS | — |
| 11 | Fuite de PII dans le profil public | ✅ PASS | — |
| 12 | Rotation du refresh token (1er usage) | ✅ PASS | — |
| 13 | Rejeu (replay) d'un refresh token déjà consommé | ✅ PASS | — |
| 14 | Upload — type MIME non autorisé | ✅ PASS | — |
| 15 | Upload — fichier corrompu / mime usurpé | 🔴 → ✅ PASS | **Corrigé** : le décodage `sharp` d'un buffer invalide levait une exception non interceptée → 500. Ajout d'un `try/catch` dédié convertissant l'échec en `400 Fichier image invalide ou corrompu` (`backend/src/modules/uploads/upload.middleware.ts`). |
| 16 | En-têtes de sécurité HTTP (CSP, X-Content-Type-Options...) | ✅ PASS | — |
| 17 | CORS — origine non whitelistée | ✅ PASS | — |
| 18 | Suppression de compte : connexion et jeton invalidés après anonymisation | ✅ PASS | — |
| 19 | Blocage : réservation empêchée entre deux utilisateurs bloqués | ✅ PASS | — |
| 20 | Rate limiting brute-force sur `/api/auth/login` | ✅ PASS | — |

---

## 1. Validation et sanitation des entrées

**Approche** : validation stricte à la frontière de l'API avec [zod](https://zod.dev), indépendante
de toute validation côté frontend (défense en profondeur — un attaquant qui contourne le frontend
retombe sur les mêmes règles côté serveur). Voir `backend/src/middleware/validate.ts` et les fichiers
`*.schemas.ts` de chaque module.

- **Injection SQL** : toutes les requêtes passent par Prisma Client, qui paramètre systématiquement
  les requêtes SQL générées (jamais de concaténation de chaînes). Testé avec des payloads `'; DROP
  TABLE "User"; --` dans la recherche de villes et le champ e-mail du login : aucun effet, la table
  reste intacte, et la validation zod rejette les formats invalides avant même d'atteindre la base.
- **XSS** : le backend stocke les descriptions de colis, bios, etc. telles quelles (aucune
  sur-ingénierie de sanitation côté serveur qui casserait des caractères légitimes), et les renvoie
  systématiquement en `Content-Type: application/json`, jamais interprété comme HTML par un
  navigateur. Le frontend React échappe par défaut tout contenu inséré via `{variable}` dans le JSX ;
  le code ne contient **aucun** usage de `dangerouslySetInnerHTML` sur du contenu utilisateur. Testé
  avec un payload `<script>alert('xss')</script>` dans une description de demande d'envoi.

## 2. Authentification

- **Mots de passe** : hachés avec `bcryptjs`, facteur de coût 12 (`backend/src/utils/password.ts`,
  configurable via `BCRYPT_SALT_ROUNDS`). Jamais stockés ni loggés en clair.
- **Anti-énumération de comptes** : en cas d'échec de connexion, un hash bcrypt factice est comparé
  même si l'utilisateur n'existe pas (`DUMMY_HASH` dans `auth.routes.ts`), pour égaliser le temps de
  réponse entre "compte inexistant" et "mot de passe incorrect".
- **Jetons d'accès (JWT)** : courte durée de vie (15 min par défaut), signés avec un secret dédié
  (`JWT_ACCESS_SECRET`). Un jeton invalide, expiré ou forgé est rejeté avec 401.
- **Refresh tokens** : valeur aléatoire opaque de 48 octets (pas un JWT), stockée en base uniquement
  sous forme de hash SHA-256 — une fuite de la base ne permet donc pas de rejouer un refresh token.
  Transmis exclusivement via un cookie `httpOnly`, `sameSite=lax`, scopé au path `/api/auth`
  (invisible en JavaScript, non envoyé aux autres routes). **Rotation à chaque refresh** : l'ancien
  token est révoqué et un nouveau émis ; toute tentative de réutiliser un token déjà consommé est
  rejetée (testé : 1er refresh → 200, rejeu du même cookie → 401), ce qui permet de détecter un vol
  de token (si un attaquant et l'utilisateur légitime tentent tous deux d'utiliser le même refresh
  token, le second arrivé échoue).
- **Protection des routes** : middleware `requireAuth` sur toutes les routes mutantes et les données
  sensibles ; testé sans jeton (401) et avec un jeton invalide (401).

## 3. Contrôle d'accès (IDOR)

Chaque ressource sensible (réservations, documents d'identité, conversations) vérifie explicitement
que l'utilisateur courant est un **participant légitime** avant de renvoyer ou modifier quoi que ce
soit — jamais une simple vérification d'authentification générique :

- `assertParticipant()` dans `bookings.routes.ts` : seuls `booking.senderId` et `booking.travelerId`
  peuvent lire/agir sur une réservation. Testé : un tiers (Bob) tentant de lire (`GET`) ou d'accepter
  (`PATCH .../accept`) la réservation d'Alice reçoit `403 Forbidden` dans les deux cas ; Alice,
  participante légitime, reçoit `200`.
- Les actions de progression du colis (`pickup`, `in-transit`, `deliver`) sont en plus restreintes au
  rôle exact (`travelerId === req.userId`), et la livraison finale exige la saisie du code à 6
  chiffres connu uniquement de l'expéditeur.
- Les documents d'identité (`VerificationDocument`) ne sont accessibles que via une route
  authentifiée qui vérifie `doc.userId === req.userId` — voir section Upload ci-dessous.

## 4. Rate limiting et protection brute-force

`express-rate-limit` appliqué par route sensible (`backend/src/middleware/rateLimiters.ts`) :

- `/api/auth/login` : 10 tentatives / 15 min / IP
- `/api/auth/register` : 5 comptes / heure / IP
- `/api/auth/refresh` : 30 requêtes / 15 min / IP
- Limite globale sur toute l'API : 120 requêtes / minute / IP (absorption de pics/abus génériques)

Testé : 12 tentatives de connexion consécutives avec un mauvais mot de passe déclenchent bien un
`429 Too Many Requests` avant la fin de la boucle.

## 5. En-têtes de sécurité et CORS

- **helmet** applique sur toutes les réponses (vérifié sur `/health`) :
  `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; ...`,
  `Strict-Transport-Security: max-age=15552000; includeSubDomains`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`. Le CSP n'autorise aucun script inline
  ni externe non listé (protection XSS en profondeur, en plus de l'échappement React).
- **CORS** : allowlist stricte d'origines (`WEB_ORIGIN`), avec vérification explicite de l'origine de
  la requête plutôt qu'un wildcard `*`. Testé : une requête avec `Origin: http://evil-attacker.example`
  ne reçoit **aucun** en-tête `Access-Control-Allow-Origin`, donc le navigateur bloque la lecture de
  la réponse même si la requête atteint le serveur.

## 6. Protection des données sensibles (email / téléphone)

Toute la logique de masquage vit dans un seul module auditable : `backend/src/utils/serializers.ts`.

- `serializePublicUser()` ne renvoie **jamais** `email`/`phone` — utilisé pour tous les profils
  affichés dans les listes publiques (recherche, feed, détail trajet/demande).
- Le contact privé (`counterpartContact`) d'une réservation n'est révélé que si l'utilisateur courant
  est participant **et** que le statut n'est ni `PENDING`, ni `REJECTED`, ni `CANCELLED` — c'est-à-dire
  seulement une fois la mise en relation confirmée par les deux parties.
- Testé : `GET /api/trips` (liste publique) ne contient aucune adresse e-mail ; `GET
  /api/users/:id/public` ne renvoie que 10 champs non sensibles (aucune clé `email`/`phone`).

## 7. Upload de fichiers sécurisé

`backend/src/modules/uploads/upload.middleware.ts` :

- **Stockage en mémoire** (`multer.memoryStorage()`) — le buffer brut envoyé par le client n'est
  **jamais** écrit tel quel sur disque.
- **Allowlist de type MIME** stricte par usage (images pour avatars/preuves, images+PDF pour les
  documents d'identité) ; testé avec un script shell déguisé en upload → `400`.
- **Re-encodage systématique des images via `sharp`** (`rotate()` + `resize` + conversion `webp`)
  avant écriture : neutralise les fichiers "polyglots" (payload caché dans un JPEG valide) et
  supprime les métadonnées EXIF (position GPS, modèle d'appareil, etc.). Si le buffer n'est pas une
  image valide malgré un mimetype usurpé, `sharp` échoue au décodage — capturé et transformé en `400`
  propre (bug initialement détecté par la suite de tests : le rejet fonctionnait mais renvoyait une
  `500` non maîtrisée ; corrigé).
- **Noms de fichiers entièrement aléatoires** (24 octets hex) — aucune donnée utilisateur (nom
  original, extension déclarée) dans le chemin final.
- **Limite de taille** configurable (`MAX_UPLOAD_SIZE_MB`, 5 Mo par défaut), gérée par `multer` et
  restituée en erreur `400` lisible.
- **Documents d'identité jamais publics** : contrairement aux avatars/preuves de livraison (servis en
  statique sous `/uploads/avatars` et `/uploads/proofs`), les documents KYC ne sont accessibles que
  via `GET /api/users/me/documents/:docId/file`, qui vérifie `doc.userId === req.userId` avant de
  streamer le fichier — pas d'URL publique devinable, même avec un nom de fichier aléatoire.

## 8. Suppression de compte et blocage d'utilisateur

Ajoutés pour la conformité aux politiques Apple (règle 5.1.1v) et Google Play (suppression de
compte 2023, UGC) — voir `backend/src/modules/users/account-deletion.service.ts` et
`backend/src/modules/blocks/blocks.routes.ts`.

- **Suppression de compte = anonymisation, pas de hard delete** : `Booking`, `Review`, `Message`,
  `Report` référencent `User` sans `onDelete: Cascade` (l'historique des contreparties doit rester
  cohérent, comme chez tout marketplace type Uber/Airbnb). `DELETE /api/users/me` révoque tous les
  refresh tokens, remplace le mot de passe par un hash aléatoire inutilisable, vide email/téléphone/
  nom/bio/avatar/localisation, supprime réellement les documents d'identité (lignes DB **et**
  fichiers sur disque), et annule les trajets/demandes/réservations encore actifs. `requireAuth`,
  `optionalAuth` et le login vérifient tous `deletedAt`. Testé : après suppression, ni l'ancien mot
  de passe ni le jeton d'accès déjà émis ne fonctionnent (401 dans les deux cas).
- **Blocage d'utilisateur** (`Block`, contrainte unique `blockerId`+`blockedId`) : vérifié dans les
  deux sens (`isBlockedEitherWay`) à la création de message et de réservation (403/400), et les
  utilisateurs bloqués sont exclus des résultats de recherche de trajets/demandes
  (`getBlockedUserIds`) — le blocage est donc effectif, pas seulement cosmétique. Testé : une
  tentative de réservation entre deux utilisateurs ayant un blocage mutuel est rejetée (400).

## 9. Audit complémentaire — grille inspirée d'OWASP MASVS (adaptée au web)

Une revue structurée selon les 7 catégories du référentiel [OWASP MASVS](https://mas.owasp.org/MASVS/)
a été demandée. **Ce référentiel cible nativement iOS/Android** (Keychain, détection root/jailbreak,
deep links, WebView) — la majorité de ses contrôles n'a pas d'équivalent direct pour une application
web comme ColisMonde. Le tableau ci-dessous reprend la structure et l'esprit du référentiel, adapté à
notre stack (Next.js + Express), en indiquant explicitement les catégories non applicables.

| Catégorie MASVS | Applicable ? | Constat pour ColisMonde |
|---|---|---|
| **STORAGE** — protection des données locales | Adapté | Le jeton d'accès n'est **jamais** persisté (pas de `localStorage`/`sessionStorage`) — vérifié par recherche exhaustive dans `web/src`, aucune occurrence. Seul le refresh token vit en cookie `httpOnly`, inaccessible en JS. Aucun secret, mot de passe ou token n'apparaît dans les `console.log` du backend (recherche exhaustive effectuée). `.env`/`.env.local` sont exclus du dépôt (`.gitignore`). |
| **CRYPTO** — algorithmes et gestion des clés | Adapté | bcrypt (coût 12) pour les mots de passe, SHA-256 pour le hash des refresh tokens, JWT signés HS256. Pas de clé/secret en dur dans le code source (recherche par motif effectuée, aucun résultat hors `.env.example`). |
| **AUTH** — authentification, sessions, MFA | Adapté | Sessions à jetons courts + rotation déjà couvertes (section 2). **Écart identifié : pas de MFA/2FA** — acceptable pour ce MVP, à considérer avant une mise en production réelle. La biométrie (spécifique mobile natif) n'a pas d'équivalent web pertinent ici. |
| **NETWORK** — TLS, certificate pinning | Partiellement adapté | HSTS actif (`max-age=15552000; includeSubDomains`) forçant HTTPS côté navigateur une fois visité en HTTPS. **Le "certificate pinning" n'a pas d'équivalent côté web** (propre aux apps natives) ; la protection équivalente est TLS géré par la plateforme d'hébergement — à configurer au déploiement (non testable en local en HTTP). |
| **PLATFORM** — IPC, deep links, WebView | Non applicable | Ces contrôles concernent l'intégration OS natif (intents Android, universal links iOS, composants `WebView`). ColisMonde s'exécute dans le bac à sable du navigateur ; l'équivalent pertinent est le **CSP strict** déjà en place (section 5), qui interdit scripts inline/externes non listés. |
| **CODE** — dépendances, build, validation des entrées | Adapté | Validation stricte zod côté serveur (section 1). `npm audit --omit=dev` : une seule vulnérabilité modérée résiduelle, transitive à `next` (`postcss`, non exploitable dans notre contexte — voir section 10). Aucune dépendance à risque critique/élevé. |
| **RESILIENCE** — anti-tampering, anti-debug, root/jailbreak detection | Non applicable | Spécifique aux binaires mobiles distribués (protection contre la rétro-ingénierie de l'app installée). Sans objet pour une application web où le code client est de toute façon visible dans le navigateur. L'équivalent défensif pertinent — rate limiting contre l'automatisation abusive — est déjà en place et testé (section 4). |

**Conclusion de cet audit complémentaire** : sur les 7 catégories, 4 ont un équivalent web direct et sont
couvertes, 1 est partiellement applicable (TLS — dépend du déploiement, pas du code), et 2 sont sans
objet pour une architecture web (PLATFORM, RESILIENCE au sens mobile). Le principal écart réel
identifié par cette grille est **l'absence de MFA**, déjà noté ci-dessous comme axe d'amélioration.

## 10. Limites connues et recommandations pour la production

- **Vulnérabilité transitive `postcss`** (modérée, XSS dans le stringifier CSS) présente dans une
  dépendance interne à `next` (`node_modules/next/node_modules/postcss`), non contrôlable via nos
  propres `package.json`. Non exploitable dans notre contexte (aucun CSS ne provient d'une entrée
  utilisateur à la construction) ; à surveiller lors des futures mises à jour de Next.js.
- **Vulnérabilité transitive `tar`** (élevée, path traversal) dans `@capacitor/cli` (`mobile/`),
  qui dépend d'une version non corrigée en ligne 6.x (le correctif nécessite un saut vers la
  version majeure 8, non testée avec le reste des packages Capacitor 6.x utilisés ici). `tar` n'est
  utilisé qu'en local par le CLI Capacitor pour scaffolder les projets natifs à partir de templates
  officiels — jamais embarqué dans l'app ni exposé à une entrée utilisateur/réseau. Risque réel
  négligeable ; à réévaluer lors d'une mise à jour majeure de Capacitor.
- **Paiement mocké** : aucune donnée de carte n'est jamais collectée ni stockée (voir README) ; avant
  un déploiement réel, remplacer `backend/src/modules/payments` par une intégration Stripe (Payment
  Intents) derrière la même interface REST.
- **Modération** : les routes de signalement (`/api/reports`) et le flag `isAdmin` existent, mais
  aucune interface d'administration n'est fournie dans ce livrable — à construire avant mise en
  production.
- **Secrets** : les valeurs par défaut de `.env.example` (`JWT_ACCESS_SECRET`, etc.) sont à usage de
  développement uniquement et doivent être régénérées (`openssl rand -base64 48`) avant tout
  déploiement.
- **HTTPS/`COOKIE_SECURE`** : en local, `COOKIE_SECURE=false` permet au cookie de refresh de
  fonctionner en HTTP. En production, exiger HTTPS et passer `COOKIE_SECURE=true`.
- **Pas de MFA/2FA** (identifié via la grille MASVS-AUTH, section 9) : l'authentification repose
  uniquement sur mot de passe + jetons. Acceptable pour ce MVP ; à envisager (TOTP par exemple) avant
  une mise en production visant une audience large.
