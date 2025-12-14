release: cd frontend && npm install --include=dev && npm run build && rm -rf ../backend/public && mkdir -p ../backend/public && cp -r dist/* ../backend/public/ && cd ../backend && npm install
web: cd backend && npm install && node server.js
