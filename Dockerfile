# syntax=docker/dockerfile:1
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend .
COPY --from=frontend-builder /app/frontend/dist ./public
RUN npm prune --omit=dev

FROM node:20-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app/backend
COPY --from=backend-builder /app/backend ./
ENV NODE_ENV=production
ENV PORT=3000
# Force rebuild 2026-02-13
EXPOSE 3000
CMD ["node", "server.js"]
