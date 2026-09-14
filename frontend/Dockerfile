# Étape 1 : Build
FROM node:22-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Configuration npm : timeout plus long, retries
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 120000

# Installer avec fallback (si `npm ci` échoue, on fait `npm install`)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps --no-audit --no-fund

# Copier le reste du code et builder
COPY . .
RUN npm run build

# Étape 2 : Servir avec Nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]