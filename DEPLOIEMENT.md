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
