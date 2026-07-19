# ColisMonde — Crowdshipping international

Mise en relation entre expéditeurs de colis et voyageurs, partout dans le monde. Un expéditeur
publie ce qu'il veut envoyer, un voyageur publie son trajet ; ColisMonde les met en relation,
sécurise le paiement, suit la livraison et permet de s'évaluer mutuellement.

Interface entièrement en français, avec un globe terrestre 3D interactif sur la page d'accueil
illustrant la portée mondiale du service. Palette rouge/vert dégradé (couleurs du Burkina Faso),
Plus Jakarta Sans + Inter.

## Stack technique

| Domaine | Choix |
|---|---|
| Frontend | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS |
| 3D | react-three-fiber (Three.js) — globe + arcs animés, lazy-loadé |
| État / data | TanStack Query · Zustand · Socket.IO client |
| Backend | Node.js · Express · TypeScript |
| Base de données | PostgreSQL · Prisma ORM |
| Auth | JWT (access 15 min) + refresh token rotatif (cookie httpOnly) |
| Temps réel | Socket.IO (messagerie, notifications) |
| Paiement | Fournisseur **mocké** (aucune donnée de carte réelle) — interface remplaçable par Stripe |

## Structure du monorepo

```
/backend    API Express + Prisma (PostgreSQL)
/web        Application Next.js (App Router) — aussi une PWA installable
/shared     Types et enums TypeScript partagés entre backend et web
/mobile     Wrapper natif Capacitor (iOS + Android) autour de l'app web
```

## Prérequis

- Node.js ≥ 20 et npm ≥ 10
- Docker Desktop (pour PostgreSQL via `docker-compose`) — ou un PostgreSQL local existant

## Installation

Depuis la racine du projet :

```bash
npm install
```

Cette commande installe les dépendances des trois workspaces (`backend`, `web`, `shared`) d'un
seul coup.

### 1. Variables d'environnement

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
```

Les valeurs par défaut fonctionnent telles quelles pour un lancement en local. Pour un usage au-delà
du développement, régénérez au minimum `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` :

```bash
openssl rand -base64 48
```

### 2. Base de données

```bash
docker compose up -d          # démarre PostgreSQL sur le port 5432
npm run build:shared          # compile le package partagé (nécessaire avant le premier démarrage)
npm run db:migrate            # applique les migrations Prisma
npm run db:seed               # peuple la base : villes du monde + comptes de démonstration
```

> Si vous n'utilisez pas Docker, adaptez `DATABASE_URL` dans `backend/.env` pour pointer vers votre
> propre instance PostgreSQL, puis lancez directement `npm run db:migrate` et `npm run db:seed`.

### 3. Lancer l'application

Deux terminaux séparés :

```bash
npm run dev:backend   # API sur http://localhost:4000
npm run dev:web       # App sur http://localhost:3000 (ou le prochain port libre)
```

Ouvrez ensuite `http://localhost:3000`.

## Comptes de démonstration

Le seed crée ces comptes (mot de passe commun : `Demo1234`) :

| E-mail | Rôle |
|---|---|
| `sophie.sender@example.com` | Expéditrice |
| `amadou.traveler@example.com` | Voyageur (a un envoi en transit avec Sophie) |
| `marc.traveler@example.com` | Voyageur |
| `admin@colismonde.app` | Administrateur |

Vous pouvez aussi créer votre propre compte via l'écran d'inscription.

## Écrans

| Écran | Route |
|---|---|
| Landing (globe 3D) | `/` |
| Connexion / Inscription | `/connexion`, `/inscription` |
| Onboarding | `/onboarding` |
| Accueil / feed | `/accueil` |
| Recherche de trajets | `/recherche` |
| Création d'annonce (envoi/trajet) | `/annonce/nouvelle` |
| Détail d'un trajet + réservation | `/trajets/[id]` |
| Détail d'un envoi (statuts, accepter/payer) | `/envois/[id]` |
| Suivi de livraison (code, timeline, preuve) | `/suivi/[id]` |
| Paiement (récapitulatif → confirmation) | `/paiement/[bookingId]` |
| Messagerie | `/messages`, `/messages/[id]` |
| Profil (expéditeur/voyageur, vérification) | `/profil` |
| Confidentialité et compte (blocage, suppression) | `/profil/parametres` |
| Politique de confidentialité | `/confidentialite` |
| Conditions générales | `/conditions` |
| Suppression de compte (accessible sans connexion) | `/suppression-compte` |

## Parcours fonctionnel

1. Un voyageur publie un trajet, ou un expéditeur publie une demande d'envoi (`/annonce/nouvelle`),
   ou réserve directement un trajet trouvé via la recherche (`/trajets/[id]`).
2. La contrepartie doit **accepter** la proposition (`/envois/[id]`) — jamais d'engagement financier
   avant accord des deux parties.
3. Une fois acceptée, l'expéditeur choisit son assurance et paie (`/paiement/[bookingId]`).
4. Le voyageur confirme la remise du colis, puis le transit, puis la livraison finale via un **code
   de confirmation à 6 chiffres** connu uniquement de l'expéditeur (`/suivi/[id]`).
5. Les deux parties peuvent s'évaluer une fois la livraison terminée.

Ce flux "double accord" (au lieu d'une réservation instantanée) protège les deux parties par design
— voir `SECURITY.md`, section contrôle d'accès.

## Sécurité

Un rapport détaillé des tests de sécurité effectués (injection, XSS, IDOR, brute-force, upload,
en-têtes, CORS...) et des corrections appliquées se trouve dans [`SECURITY.md`](./SECURITY.md).

Pour ré-exécuter la suite de tests automatisés (le backend doit tourner) :

```bash
cd backend
npm run security:test
```

> ⚠️ Ce script crée des comptes et réservations de test dans la base connectée. Relancez
> `npm run db:seed` ensuite pour retrouver des données de démonstration propres.

## Scripts utiles (racine)

| Commande | Effet |
|---|---|
| `npm run dev:backend` | Démarre l'API en mode watch |
| `npm run dev:web` | Démarre le frontend Next.js en mode dev |
| `npm run build:shared` | Compile `@colismonde/shared` (requis après toute modification de `/shared`) |
| `npm run build:backend` | Build TypeScript du backend (`backend/dist`) |
| `npm run build:web` | Build de production Next.js |
| `npm run db:migrate` | Applique les migrations Prisma (mode dev) |
| `npm run db:seed` | Réinitialise et peuple la base de démonstration |

Prisma Studio (interface graphique de la base) :

```bash
cd backend && npm run db:studio
```

## Notes sur le globe 3D

Le globe (page d'accueil) est chargé paresseusement (`React.lazy` + `IntersectionObserver`) et
seulement si l'appareil le permet : WebGL disponible, appareil non détecté comme bas de gamme
(`navigator.hardwareConcurrency`/`deviceMemory`). Il respecte `prefers-reduced-motion` en figeant
l'animation plutôt qu'en la coupant brutalement. Sur les navigateurs/appareils qui ne remplissent pas
ces conditions, un dégradé statique reprenant la palette de marque est affiché à la place — la
landing page reste utilisable et rapide dans tous les cas.

## Application mobile (App Store / Play Store)

L'app web est aussi une **PWA installable** (`web/public/manifest.json` + service worker minimal
`web/public/sw.js`) et un **wrapper natif Capacitor** existe dans `/mobile` pour la soumission aux
stores (iOS + Android depuis une seule base — la WebView pointe vers l'URL HTTPS déployée de l'app,
pas un export statique, pour rester compatible avec les routes dynamiques comme `/trajets/[id]`).

### Ce qui est déjà en place

- Projets natifs `mobile/android` et `mobile/ios` générés (`npx cap add android/ios`), avec
  permissions minimales déclarées : caméra + photothèque (upload de documents KYC et de preuve de
  livraison), rien de plus.
- Suppression de compte en libre-service (`/profil/parametres`, `/suppression-compte`) et blocage
  d'utilisateur — exigences obligatoires des deux stores, voir `SECURITY.md` section 8.
- Pages légales publiques : `/confidentialite`, `/conditions`, `/suppression-compte`.
- Icônes PWA/app générées via `backend/scripts/generate-pwa-icons.ts` (sharp, pas d'outil externe).

### Lancer le wrapper mobile en local

```bash
npm install                          # installe aussi le workspace /mobile

# Démarrez d'abord le backend et le frontend (npm run dev:backend / dev:web), puis :
cd mobile
CAPACITOR_SERVER_URL="http://<IP-LAN-de-votre-poste>:3000" npx cap sync
npx cap open android   # nécessite Android Studio
npx cap open ios       # nécessite macOS + Xcode + CocoaPods (impossible depuis Windows)
```

> Utilisez l'IP locale de votre machine (ex. `192.168.1.42`), pas `localhost` : depuis un
> émulateur/appareil mobile, `localhost` désigne l'appareil lui-même, pas votre poste de dev.

Pour un vrai build de soumission, `CAPACITOR_SERVER_URL` doit pointer vers l'URL **HTTPS de
production** (voir ci-dessous), puis relancer `npx cap sync`.

### Prérequis externes avant de pouvoir soumettre (non automatisables ici)

1. **Déployer le web et le backend** derrière une URL HTTPS réelle (Vercel/Railway/etc. pour le web,
   n'importe quel hébergeur Node+PostgreSQL pour le backend). Sans ça, aucun build natif final n'est
   possible.
2. **Remplacer le paiement mocké par Stripe** (ou équivalent) avant tout lancement avec de vrais
   utilisateurs — voir `SECURITY.md`.
3. **Comptes développeur** : Apple Developer Program (99$/an) et/ou Google Play Console (25$,
   paiement unique).
4. **Fiches des stores** : captures d'écran, description, "App Privacy" (Apple) / "Data safety"
   (Google) — déclarer précisément les données déjà documentées dans `/confidentialite`.
5. Générer les icônes/splash natifs définitifs à partir de `web/public/icons/` dans les résolutions
   attendues par chaque store (mipmaps Android, Assets.xcassets iOS) — non généré automatiquement ici
   (l'outil `@capacitor/assets` a été volontairement omis, voir `SECURITY.md` section 10).
6. Sur iOS, lancer `pod install` dans `mobile/ios/App` depuis un Mac avant la première ouverture
   Xcode (CocoaPods n'est pas disponible sur ce poste de développement Windows).

## Limites connues

- Le paiement est simulé (aucune intégration bancaire réelle) — voir `SECURITY.md` pour le plan de
  bascule vers Stripe.
- Pas d'interface d'administration/modération fournie (les routes `/api/reports` existent côté API).
- Les données de villes sont un échantillon représentatif (~44 villes) plutôt qu'une base
  géographique exhaustive.
