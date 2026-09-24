/**
 * Service Worker PWA Tingkat Enterprise - P2KD Kalisalak
 * Strategi:
 * 1. Cache-First untuk seluruh Next.js static chunks (/_next/static/*), fonts, icons, dan gambar
 * 2. Stale-While-Revalidate (SWR) untuk navigasi halaman (HTML) -> Muat instan sub-50ms
 * 3. Pre-caching untuk rute inti & shell aplikasi
 * 4. Bypass transparan untuk API (/api/*) & database queries
 */

const CACHE_NAME = "p2kd-kalisalak-v7";

const PRECACHE_ASSETS = [
  "/",
  "/admin",
  "/dps",
  "/aduan",
  "/berita",
  "/bantuan",
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
  "/logo.svg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Precache asset minor skipped:", err);
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
  // Hanya tangani metode GET dan protokol http/https
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith("http")
  ) {
    return;
  }

  // Bypass langsung request API tanpa dicegat/di-cache di SW
  if (event.request.url.includes("/api/")) {
    return;
  }

  const url = new URL(event.request.url);

  // 1. STRATEGI CACHE-FIRST: Aset Statis, Font, Gambar, & Next.js Bundle (/_next/static/*)
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
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

  // 2. STRATEGI STALE-WHILE-REVALIDATE: Navigasi Halaman HTML
  // Menyajikan cache secara instan (0-latency feel), sambil memperbarui konten di background
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        // Ambil pembaruan dari jaringan di latar belakang
        const fetchPromise = fetch(event.request)
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
          .catch(async () => {
            if (cached) return cached;
            // Tampilan ramah saat benar-benar offline dan belum ada cache
            return new Response(
              `<!DOCTYPE html>
              <html lang="id">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Offline | P2KD Desa Kalisalak</title>
                  <style>
                    body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px 20px; background: #0f172a; color: #f8fafc; }
                    .card { max-width: 420px; margin: 0 auto; background: #1e293b; padding: 32px 24px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #334155; }
                    h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: #60a5fa; }
                    p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
                    button { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
                    button:hover { background: #1d4ed8; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h1>Sistem Offline</h1>
                    <p>Perangkat Anda sedang tidak terhubung ke jaringan internet. Halaman ini memerlukan koneksi untuk pertama kali dibuka.</p>
                    <button onclick="location.reload()">Coba Muat Ulang</button>
                  </div>
                </body>
              </html>`,
              {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              }
            );
          });

        // Jika halaman sudah ada di cache, kembalikan seketika tanpa menunggu jaringan!
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Fallback umum
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response("Network unavailable", {
        status: 503,
        statusText: "Network unavailable",
      });
    })
  );
});
