// Toki service worker: keeps a copy of the game so the app opens offline.
// Bump VERSION whenever the game files change so players get the new version.
const VERSION = 'toki-v11';
const OCR_CACHE = 'toki-ocr'; // the word-reading engine (Tesseract.js) fetched on first use, kept for offline use
const FILES = ['./', './index.html', './style.css', './data.js', './sprites.js', './game.js', './dict.js', './lex.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== OCR_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// network first for the game's own files (so updates arrive), cache as the fallback when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname === 'cdn.jsdelivr.net' && /tesseract/.test(url.pathname)) { // cache the reader once it was downloaded
    e.respondWith(caches.open(OCR_CACHE).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => { if (res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return; // fonts etc. come straight from the network when available
  e.respondWith(fetch(e.request).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))));
});
