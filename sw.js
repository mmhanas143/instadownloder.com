// public/sw.js

const CACHE_NAME = 'instagram-downloader-v2'; // Increment version if you make changes
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    // Add paths to your most important icons
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
    // Add other critical assets if any
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Service Worker: Cache addAll failed:', err);
            })
    );
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Become available to all pages
});

self.addEventListener('fetch', event => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Cache hit - return response
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Service Worker: Fetch failed; returning offline fallback or error.', error);
                    // Optionally, return a fallback offline page if network fails for HTML pages
                    // if (event.request.mode === 'navigate') {
                    //    return caches.match('/offline.html');
                    // }
                });
            })
    );
});