// Service worker volontairement minimal.
// Il ne met en cache QUE des fichiers statiques de l'interface (icônes et
// bundles Next.js). Aucune page, aucune réponse d'API, aucune donnée
// personnelle n'est jamais stockée : l'API est sur une autre origine et
// n'est donc pas interceptée.
const CACHE = "cniscan-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // jamais l'API ni les tiers

  const cacheable =
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  if (!cacheable) return; // tout le reste passe directement par le réseau

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});