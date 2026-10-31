// Rep Log service worker: app shell works offline; updates load in the background.
// Bump VERSION when you deploy changes so old caches are cleared.
const VERSION = "replog-v2";
const SHELL = [
  "./", "./index.html", "./styles.css", "./app.js", "./config.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache Supabase API calls: sync must always hit the server.
  if (url.hostname.endsWith(".supabase.co")) return;

  const cacheable = url.origin === location.origin || url.hostname === "cdn.jsdelivr.net" ||
    url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!cacheable) return;

  // App files: try the network first (so new versions show up immediately), fall back to the cache
  // after 3 s or when offline, so the app still opens instantly with no signal at the gym.
  // Fonts and the Supabase library: cache first, they never change.
  const appFile = url.origin === location.origin;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = req.mode === "navigate" ? "./index.html" : req;
    const cached = await cache.match(key, { ignoreSearch: req.mode === "navigate" });
    const network = fetch(req, appFile ? { cache: "no-cache" } : undefined).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(key, res.clone());
      return res;
    });
    if (!appFile) return cached || network;
    if (!cached) return network;
    return Promise.race([network.catch(() => cached), new Promise(r => setTimeout(() => r(cached), 3000))]);
  }));
});
