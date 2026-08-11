# --- Stage 1: Build Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# --- Stage 2: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 3: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install Nginx and build tools needed for native node modules
RUN apk add --no-cache nginx

# Copy backend package configs and dist files
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Install production dependencies inside the runner environment (rebuilds native C++ binaries like bcrypt correctly)
WORKDIR /app/backend
RUN npm ci --only=production
RUN npx prisma generate

WORKDIR /app

# Copy frontend static build files
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Nginx Configuration
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://127.0.0.1:5000/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/http.d/default.conf

EXPOSE 80

CMD ["sh", "-c", "nginx && cd /app/backend && node dist/server.js"]
