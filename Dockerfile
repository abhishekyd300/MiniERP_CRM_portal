
# Stage 1: Build Backend

FROM node:20-bookworm-slim AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci

COPY backend/ ./

RUN npx prisma generate
RUN npm run build

# Stage 2: Build Frontend

FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ ./

RUN npm run build

# Stage 3: Production
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install Nginx and OpenSSL
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx openssl \
    && rm -rf /var/lib/apt/lists/*

# Backend

COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend

RUN npm ci --omit=dev

RUN npx prisma generate

# Frontend
WORKDIR /app

COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Nginx

RUN rm -f /etc/nginx/sites-enabled/default \
    && rm -f /etc/nginx/conf.d/default.conf

# Create custom Nginx configuration
RUN printf '%s\n' \
'server {' \
'    listen 80 default_server;' \
'    server_name _;' \
'' \
'    root /usr/share/nginx/html;' \
'    index index.html;' \
'' \
'    location / {' \
'        try_files $uri $uri/ /index.html;' \
'    }' \
'' \
'    location /api/ {' \
'        proxy_pass http://127.0.0.1:5000/api/;' \
'        proxy_http_version 1.1;' \
'        proxy_set_header Upgrade $http_upgrade;' \
'        proxy_set_header Connection "upgrade";' \
'        proxy_set_header Host $host;' \
'        proxy_set_header X-Real-IP $remote_addr;' \
'        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
'        proxy_set_header X-Forwarded-Proto $scheme;' \
'    }' \
'}' \
> /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["sh", "-c", "nginx && cd /app/backend && node dist/server.js"]