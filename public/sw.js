const CACHE_PREFIX = "sukie-pos-";
const CACHE_NAME = `${CACHE_PREFIX}v4`;
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./favicon.svg",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);

      const manifestResponse = await fetch("./asset-manifest.json");
      if (!manifestResponse.ok) throw new Error("Could not load the production asset manifest.");
      const manifest = await manifestResponse.json();
      const assets = Object.values(manifest)
        .flatMap((entry) => [entry.file, ...(entry.css || []), ...(entry.assets || [])])
        .filter(Boolean)
        .map((path) => new URL(path, self.registration.scope).href)
        .filter((url) => new URL(url).origin === self.location.origin);

      await cache.addAll([...new Set(assets)]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedPage = await caches.match("./index.html");
        return cachedPage || caches.match("./");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (response.ok && response.type === "basic") {
                return caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response));
              }
              return undefined;
            })
            .catch(() => undefined)
        );
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (response.ok && response.type === "basic") {
          const responseToCache = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache)));
        }
        return response;
      });
    })
  );
});
