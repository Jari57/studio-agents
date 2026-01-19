// Service Worker for Studio Agents PWA
// IMPORTANT: Increment version when deploying new builds to invalidate old caches
const CACHE_NAME = 'studio-agents-v9';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some assets:', err);
        // Don't fail installation if some assets can't be cached
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests, API calls, and non-HTTP(S) protocols
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  if (!event.request.url.startsWith('http')) return; // Skip chrome-extension://, etc.
  
  // Skip Firebase authentication domains
  if (event.request.url.includes('firebaseapp.com')) return;
  if (event.request.url.includes('googleapis.com')) return;
  if (event.request.url.includes('identitytoolkit.googleapis.com')) return;
  if (event.request.url.includes('securetoken.googleapis.com')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle push notifications (future use)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Studio Agents';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});

// Handle message events from the main thread
self.addEventListener('message', (event) => {
  try {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
      return;
    }
    
    // Handle other message types gracefully
    console.log('[SW] Received message:', event.data);
  } catch (error) {
    // Silently handle message parsing errors
    console.warn('[SW] Message handling error:', error);
  }
});

// Global error handler for uncaught service worker errors
self.addEventListener('error', (event) => {
  console.warn('[SW] Error:', event.error);
  // Don't let service worker errors crash the app
  event.preventDefault();
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.warn('[SW] Unhandled promise rejection:', event.reason);
  // Don't let promise rejections crash the service worker
  event.preventDefault();
});
