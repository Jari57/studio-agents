# syntax=docker/dockerfile:1
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build

FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend .

# Railway is the production asset-generation backend. Vercel deploys only the
# frontend, so backend reliability has to be enforced in the Docker build that
# Railway actually runs. Fail the image build if the orchestrator loses bounded
# provider waits, explicit partial-failure handling, or phase timing.
COPY scripts/verify-video-reliability.mjs /app/scripts/verify-video-reliability.mjs
RUN node --check services/videoGenerationOrchestrator.js \
  && node /app/scripts/verify-video-reliability.mjs

COPY --from=frontend-builder /app/frontend/dist ./public
RUN npm prune --omit=dev

FROM node:22-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app/backend
COPY --from=backend-builder /app/backend ./
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
