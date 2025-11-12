// Service Worker for PWA
// This is a placeholder - next-pwa will generate the actual service worker

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Cache strategy will be handled by next-pwa
  event.respondWith(fetch(event.request));
});

