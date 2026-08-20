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
# frontend, so backend reliability is enforced in the Docker build Railway runs.
# The build fails closed if bounded provider waits, database-safe state, current
# video routing, requested-duration handling, or explicit failure semantics regress.
COPY scripts/verify-video-reliability.mjs /app/scripts/verify-video-reliability.mjs
COPY scripts/patch-provider-routing.mjs /app/scripts/patch-provider-routing.mjs
RUN node /app/scripts/patch-provider-routing.mjs \
  && node --check services/videoGenerationOrchestrator.js \
  && node /app/scripts/verify-video-reliability.mjs \
  && grep -Fq '__studioStabilityAudioAvailability' server.js \
  && grep -Fq '__studioReplicateBoundedPrediction' server.js \
  && grep -Fq 'req.body?.duration ?? 60' server.js \
  && grep -Fq 'minimax/hailuo-2.3-fast' services/videoGenerationOrchestrator.js \
  && node --check server.js

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
