const CACHE_NAME = 'worklog-v1';
const ASSETS = [
  '/WorkLog/',  // Match your GitHub repo name
  '/WorkLog/index.html',
  '/WorkLog/styles.css',
  '/WorkLog/script.js',
  '/WorkLog/manifest.json',  // Don't forget this!
  '/WorkLog/img/logo.png',
  '/WorkLog/img/icon-192.png',
  '/WorkLog/img/icon-512.png'
];

// Install event: Cache all essential files
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))  // Fixed: Added comma
  );
});

// Fetch event: Serve cached files when offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))  // Fixed: Added comma
  );
});