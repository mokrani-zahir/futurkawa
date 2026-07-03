# ── Development stage (docker-compose.yml — target: dev) ─────────────────────
# Runs the Vite dev server; source is bind-mounted on top for hot reload.
FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]

# ── Build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

# ── Production stage (docker-compose.prod.yml) ────────────────────────────
# Self-contained image: static build served by nginx. The backend URL is
# injected at container startup from env vars (see docker-entrypoint.sh),
# not baked in at build time, so this image never needs to know about the
# backend until it actually runs.
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# nginx's official entrypoint runs every executable script in
# /docker-entrypoint.d/ before starting nginx itself.
COPY docker-entrypoint.sh /docker-entrypoint.d/30-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/30-runtime-env.sh

EXPOSE 80
