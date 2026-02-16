# Stage 1: Build the Angular application
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install dependencies using legacy-peer-deps to avoid ERESOLVE issues
RUN npm install --legacy-peer-deps

COPY . .

# Build the application for production
RUN npm run build -- --configuration production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
# Note: verify the path matches angular.json "outputPath"
COPY --from=builder /app/dist/frontend-samawe/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
