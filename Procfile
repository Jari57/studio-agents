release: cd frontend && npm ci && npm run build && rm -rf ../backend/public && mkdir -p ../backend/public && cp -r dist/* ../backend/public/ && cd ../backend && npm ci
web: cd backend && node server.js
