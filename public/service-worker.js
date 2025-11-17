/**
 * Alerto Service Worker
 * Provides offline functionality for the typhoon tracking app
 * Version: 1.0.0
 */

const CACHE_NAME = 'alerto-cache-v1';
const DATA_CACHE_NAME = 'alerto-data-cache-v1';

// Static assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html', // Fallback offline page
];

// API endpoints to cache dynamically
const API_CACHE_PATTERNS = [
  '/api/typhoon/',
  '/api/weather/',
  '/api/lightning/',
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[ServiceWorker] Failed to cache static assets:', error);
      })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

/**
 * Fetch event - network first, falling back to cache
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests separately
  if (isAPIRequest(url.pathname)) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle other requests (assets, images, etc.)
  event.respondWith(handleAssetRequest(request));
});

/**
 * Check if request is for API data
 */
function isAPIRequest(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pathname.includes(pattern));
}

/**
 * Handle API requests - Network first, cache fallback
 * Fresh data is critical for weather/typhoon tracking
 */
async function handleAPIRequest(request) {
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);

    // Clone the response before caching
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.log('[ServiceWorker] Network failed for API request, falling back to cache:', request.url);

    // Try to return cached data
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Serving cached API data:', request.url);

      // Add custom header to indicate offline mode
      const clonedResponse = cachedResponse.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.append('X-Served-From-Cache', 'true');

      const offlineResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      });

      return offlineResponse;
    }

    // No cached data available - return offline error
    return new Response(
      JSON.stringify({
        error: 'Offline - No cached data available',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-Offline-Mode': 'true'
        })
      }
    );
  }
}

/**
 * Handle navigation requests - Try network, fallback to offline page
 */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed for navigation, serving offline page');

    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match('/offline.html');

    return offlinePage || new Response('Offline - Please check your connection', {
      status: 503,
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

/**
 * Handle asset requests - Cache first, network fallback
 * Static assets don't change often, prioritize speed
 */
async function handleAssetRequest(request) {
  // Check cache first
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.error('[ServiceWorker] Failed to fetch asset:', request.url, error);

    // Return a fallback response
    return new Response('Asset unavailable offline', {
      status: 503,
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

/**
 * Background Sync - Sync data when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-typhoon-data') {
    event.waitUntil(syncTyphoonData());
  }
});

/**
 * Sync typhoon data in background
 */
async function syncTyphoonData() {
  try {
    console.log('[ServiceWorker] Syncing typhoon data...');

    const response = await fetch('/api/typhoon/philippines');
    const cache = await caches.open(DATA_CACHE_NAME);
    cache.put('/api/typhoon/philippines', response.clone());

    console.log('[ServiceWorker] Typhoon data synced successfully');
  } catch (error) {
    console.error('[ServiceWorker] Failed to sync typhoon data:', error);
  }
}

/**
 * Push Notification - Handle incoming push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');

  let data = {
    title: 'Weather Alert',
    body: 'Check the app for updates',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'weather-alert',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification Click - Handle notification interactions
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Message event - Handle messages from the app
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[ServiceWorker] Loaded successfully');
