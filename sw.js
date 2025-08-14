const CACHE_NAME = 'dhanika-v1.0.0';
const STATIC_CACHE = 'dhanika-static-v1.0.0';
const DYNAMIC_CACHE = 'dhanika-dynamic-v1.0.0';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/transactions/',
  '/transactions/index.html',
  '/assets/css/style.css',
  '/assets/js/script.js',
  '/assets/json/tooltips.json',
  '/assets/json/transaction-types.json',
  '/manifest.json',
  // External CDN resources
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching static files');
      return cache.addAll(STATIC_FILES.map(url => {
        return new Request(url, { mode: 'no-cors' });
      })).catch(error => {
        console.error('Failed to cache some resources:', error);
        // Cache individual files that succeed
        return Promise.allSettled(
          STATIC_FILES.map(url => 
            cache.add(new Request(url, { mode: 'no-cors' }))
              .catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      });
    })
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Service Worker: Serving from cache:', event.request.url);
        return cachedResponse;
      }

      // Clone the request for network fetch
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        // Cache the response in dynamic cache for future use
        caches.open(DYNAMIC_CACHE).then((cache) => {
          console.log('Service Worker: Caching new resource:', event.request.url);
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('Service Worker: Fetch failed:', error);
        
        // Return offline fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        
        // For other resources, just return the error
        throw error;
      });
    })
  );
});

// Handle background sync for potential future use
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Future implementation for syncing data when online
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push message received:', data);
    
    const options = {
      body: data.body,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Update cache version when needed
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    console.log('Service Worker: Updating cache...');
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_FILES);
      })
    );
  }
});