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

FROM nginx:alpine AS production
COPY --from=builder-production /app/dist/frontend-samawe/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine AS development
COPY --from=builder-development /app/dist/frontend-samawe/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
