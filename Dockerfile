# ==============================================================================
# Multi-stage Dockerfile untuk JejakStok Frontend (warehouse_app)
# Stage 1: Build aset statis dengan Node.js
# Stage 2: Sajikan hasil kompilasi via Nginx Alpine (~25 MB)
# ==============================================================================

# Stage 1: Build Aset Statis
FROM node:22-alpine AS builder

WORKDIR /app

# Argument build untuk menyetel URL Backend API Production
ARG VITE_API_BASE_URL=https://api-jkstok.my.id
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
