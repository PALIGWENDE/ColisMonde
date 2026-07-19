# Build et exécution de l'API ColisMonde depuis la racine du monorepo (workspaces npm) :
# le backend dépend de @colismonde/shared, donc l'image a besoin du contexte complet du repo,
# pas seulement du dossier backend/.
#
# Build : docker build -f backend/Dockerfile -t colismonde-api .   (contexte = racine du repo)

FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

RUN npm ci

COPY shared shared
COPY backend backend

RUN npm run build --workspace @colismonde/shared
RUN npm run db:generate --workspace @colismonde/backend
RUN npm run build --workspace @colismonde/backend

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/shared/dist shared/dist
COPY --from=build /repo/shared/package.json shared/package.json
COPY --from=build /repo/backend/dist backend/dist
COPY --from=build /repo/backend/package.json backend/package.json
COPY --from=build /repo/backend/prisma backend/prisma

WORKDIR /repo/backend
EXPOSE 4000

# `prisma migrate deploy` applique les migrations en attente avant de démarrer l'API —
# nécessaire car il n'y a pas d'étape de build séparée sur Railway/Render pour ça.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]
