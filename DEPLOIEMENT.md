# Déploiement ColisMonde (hébergeurs managés)

Architecture cible :

- **Site web** (Next.js, `web/`) → **Vercel**
- **API** (Express, `backend/`) → **Render** (blueprint `render.yaml` fourni) ou **Railway** (Dockerfile fourni)
- **Base de données** Postgres → provisionnée par le même hébergeur que l'API

## 0. Prérequis

- Un dépôt GitHub contenant ce dossier (voir section "Pousser le code" plus bas).
- Comptes gratuits sur [vercel.com](https://vercel.com) et [render.com](https://render.com) (ou [railway.app](https://railway.app)), connectés à GitHub.

## 1. API + base de données sur Render

1. Dashboard Render → **New → Blueprint** → sélectionner le dépôt GitHub.
2. Render lit `render.yaml` à la racine et propose de créer :
   - le service web `colismonde-api` (build via `backend/Dockerfile`)
   - la base `colismonde-db` (Postgres gratuit)
3. Après création, la variable `WEB_ORIGIN` du service `colismonde-api` est vide (`sync: false`) —
   il faudra la renseigner à l'étape 3 avec l'URL Vercel définitive.
4. Au premier déploiement, `prisma migrate deploy` s'exécute automatiquement (voir `CMD` du Dockerfile) :
   les tables sont créées, mais la base est vide. Pour la peupler :
   - Render Dashboard → Shell (sur le service `colismonde-api`) →
     `cd /repo/backend && npx tsx prisma/seed.ts` (comptes de démo)
     et/ou `npx tsx scripts/import-cities.ts` (33k villes GeoNames).
5. Notez l'URL générée par Render (ex. `https://colismonde-api.onrender.com`).

**Alternative Railway** : New Project → Deploy from GitHub repo → Railway détecte
`backend/Dockerfile` automatiquement (renseigner "Dockerfile path" = `backend/Dockerfile`,
"Root Directory" = `.`) → Add a Postgres plugin (fournit `DATABASE_URL` automatiquement) →
ajouter les mêmes variables d'environnement que dans `render.yaml` (secrets JWT, WEB_ORIGIN, etc.).

⚠️ **Uploads (avatars, justificatifs)** : les plans gratuits Render/Railway ont un disque
éphémère — les fichiers uploadés sont perdus à chaque redéploiement. Pour la prod, prévoir soit
un disque persistant payant, soit migrer `backend/src/utils/*upload*` vers un stockage objet
(S3, Cloudflare R2...). Non traité ici — à faire avant un vrai lancement public.

## 2. Site web sur Vercel

1. Vercel → **Add New → Project** → importer le dépôt GitHub.
2. **Root Directory** : `web`
3. **Build Command** (override, car le monorepo doit d'abord compiler `shared`) :
   ```
   cd .. && npm run build --workspace @colismonde/shared && cd web && npm run build
   ```
4. **Install Command** : laisser Vercel gérer (il détecte le `package-lock.json` racine et
   installe tout le monorepo automatiquement).
5. Variables d'environnement (Project Settings → Environment Variables) :
   ```
   NEXT_PUBLIC_API_URL=https://colismonde-api.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://colismonde-api.onrender.com
   INTERNAL_API_URL=https://colismonde-api.onrender.com
   ```
   (remplacer par l'URL réelle notée à l'étape précédente)
6. Déployer. Vercel donne une URL du type `https://colismonde.vercel.app`.

## 3. Boucler CORS

Retourner sur Render/Railway et mettre à jour `WEB_ORIGIN` du service API avec l'URL Vercel
exacte (ex. `https://colismonde.vercel.app`), puis redéployer le service API pour que le
navigateur ne soit plus bloqué par CORS.

## 4. Vérification

- `https://<ton-api>.onrender.com/health` → `{"status":"ok",...}`
- `https://<ton-site>.vercel.app` → page d'accueil, recherche de ville fonctionnelle
- Connexion avec un compte de démo (si seed exécuté) : `sophie.sender@example.com` / `Demo1234`

## Secrets à changer avant tout usage réel

`render.yaml` génère des secrets JWT aléatoires (`generateValue: true`) — ne jamais réutiliser
les valeurs de `backend/.env.example` en production.

## Passer à l'échelle (au-delà de quelques centaines d'utilisateurs actifs)

L'app fonctionne telle quelle en mono-instance (dev, démo, faible trafic). Deux limites connues
avant de grossir, toutes deux activables sans changement de code, juste via des variables
d'environnement — voir `backend/src/config/env.ts` :

### 1. Stockage des fichiers (avatars, preuves de livraison, documents KYC) — à faire en premier

Sur la plupart des hébergeurs gérés (dont Render), le disque du service est **éphémère** : tout
fichier uploadé est perdu au prochain redéploiement, quel que soit le nombre d'utilisateurs. Pour
un stockage durable, brancher un bucket S3-compatible (Cloudflare R2 recommandé : pas de frais de
sortie, offre gratuite généreuse) :

1. Créer un bucket R2 (dashboard Cloudflare → R2 → Create bucket), activer l'accès public dessus
   (ou brancher un domaine personnalisé) pour obtenir une URL publique de base.
2. Créer un jeton d'API R2 (Manage R2 API Tokens) → récupérer Access Key ID / Secret Access Key /
   Endpoint (`https://<account_id>.r2.cloudflarestorage.com`).
3. Renseigner sur Render (ou en local dans `.env`) : `S3_ENDPOINT`, `S3_BUCKET`,
   `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (`S3_REGION` reste `auto` pour R2).
4. Redéployer — dès que ces 5 variables sont toutes renseignées, `backend/src/lib/storage.ts`
   bascule automatiquement du disque local vers S3, sans autre changement.

### 2. Redis — nécessaire seulement si on passe à plusieurs instances de serveur

Tant qu'une seule instance backend tourne, ce n'est pas nécessaire. Dès qu'on en ajoute une
deuxième (pour absorber plus de trafic), deux choses cassent sans Redis : la messagerie temps réel
(un message envoyé sur l'instance A n'atteint pas un utilisateur connecté à l'instance B) et la
limitation de débit (chaque instance compte séparément, la limite réelle se multiplie par le
nombre d'instances). Render propose un addon Redis managé (ou Upstash en gratuit) : renseigner
`REDIS_URL` active l'adaptateur Socket.IO partagé et le store de rate-limit partagé automatiquement.

### 3. Plan d'hébergement

Le plan gratuit/starter Render suffit pour du développement et une démo, pas pour un usage réel à
grande échelle : prévoir un plan avec plus de RAM/CPU dédiés en fonction du trafic observé.
