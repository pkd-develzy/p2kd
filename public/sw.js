const CACHE_NAME = "p2kd-kalisalak-v5";
const PRECACHE_ASSETS = [
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
  "/logo.png",
  "/logo.svg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Precache skipped for some assets:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests and http/https protocols
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith("http")
  ) {
    return;
  }

  // Pass through all live API requests and database requests directly without intercepting
  if (event.request.url.includes("/api/")) {
    return;
  }

  const url = new URL(event.request.url);

  // Cache-first strategy for static assets (icons, images, fonts, manifest)
  const isStaticAsset =
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/manifest.json";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response("", { status: 408, statusText: "Request Timeout" });
          });
      })
    );
    return;
  }

  // Network-first for navigation and pages, with safe fallback that ALWAYS returns a valid Response
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          response &&
          response.status === 200 &&
          response.type === "basic" &&
          (event.request.mode === "navigate" || url.pathname.startsWith("/_next/static/"))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(async () => {
        // Try to get from cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // If it's a navigation request and no cache exists, return offline fallback page
        if (event.request.mode === "navigate") {
          return new Response(
            `<!DOCTYPE html>
            <html lang="id">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Offline | P2KD Desa Kalisalak</title>
                <style>
                  body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #0f172a; color: #f8fafc; }
                  h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
                  p { font-size: 14px; color: #94a3b8; max-width: 400px; margin: 0 auto 24px; }
                  button { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; }
                </style>
              </head>
              <body>
                <h1>Koneksi Internet Terputus</h1>
                <p>Halaman ini belum tersedia di cache offline. Silakan periksa jaringan internet Anda dan coba lagi.</p>
                <button onclick="location.reload()">Muat Ulang Halaman</button>
              </body>
            </html>`,
            {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/html; charset=utf-8" },
            }
          );
        }

        // Return a valid Response so event.respondWith NEVER receives undefined
        return new Response("Network unavailable", {
          status: 503,
          statusText: "Network unavailable",
        });
      })
  );
});
