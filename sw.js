const CACHE_NAME = 'worklog-v1';
const ASSETS = [
  '/WorkLog/',  // Match your repo name
  '/WorkLog/index.html',
  '/WorkLog/styles.css',
  '/WorkLog/script.js',
  '/WorkLog/img/logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
});