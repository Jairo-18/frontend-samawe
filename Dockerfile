FROM node:22-alpine AS deps
WORKDIR /app
# Version fijada: sin ella el build tomaba el pnpm mas reciente y un cambio de
# comportamiento de pnpm rompia la imagen sin tocar el repositorio.
RUN npm install -g pnpm@10
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install

FROM deps AS builder-production
WORKDIR /app
COPY . .
RUN pnpm exec ng build --configuration production && node scripts/fix-ssr-manifest.mjs

FROM deps AS builder-development
WORKDIR /app
COPY . .
RUN pnpm exec ng build --configuration development && node scripts/fix-ssr-manifest.mjs

FROM node:22-alpine AS prod-deps
WORKDIR /app
# Version fijada: sin ella el build tomaba el pnpm mas reciente y un cambio de
# comportamiento de pnpm rompia la imagen sin tocar el repositorio.
RUN npm install -g pnpm@10
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder-production /app/dist/frontend-samawe ./dist/frontend-samawe
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/frontend-samawe/server/server.mjs"]

FROM node:22-alpine AS development
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder-development /app/dist/frontend-samawe ./dist/frontend-samawe
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/frontend-samawe/server/server.mjs"]
