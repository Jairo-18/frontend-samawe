FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM deps AS builder-production
WORKDIR /app
COPY . .
RUN npm run build -- --configuration production

FROM deps AS builder-development
WORKDIR /app
COPY . .
RUN npm run build -- --configuration development

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder-production /app/dist/frontend-samawe ./dist/frontend-samawe
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/frontend-samawe/server/server.mjs"]

FROM node:22-alpine AS development
WORKDIR /app
COPY --from=builder-development /app/dist/frontend-samawe ./dist/frontend-samawe
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/frontend-samawe/server/server.mjs"]
