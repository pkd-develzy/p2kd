/**
 * Service Worker PWA Tingkat Enterprise - P2KD Kalisalak
 * Strategi:
 * 1. Cache-First untuk seluruh Next.js static chunks (/_next/static/*), fonts, icons, dan gambar
 * 2. Stale-While-Revalidate (SWR) untuk navigasi halaman (HTML) -> Muat instan sub-50ms
 * 3. Pre-caching untuk rute inti & shell aplikasi
 * 4. Bypass transparan untuk API (/api/*) & database queries
 */

const CACHE_NAME = "p2kd-kalisalak-v9";

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
            // Tampilan ramah dan modern saat benar-benar offline dan belum ada cache
            return new Response(
              `<!DOCTYPE html>
              <html lang="id">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
                  <title>Koneksi Terputus | P2KD Desa Kalisalak</title>
                  <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                      background: #090d16;
                      color: #f8fafc;
                      min-height: 100vh;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      padding: 24px 16px;
                      position: relative;
                      overflow-x: hidden;
                    }
                    .glow-1 {
                      position: absolute;
                      top: 15%;
                      left: 20%;
                      width: 300px;
                      height: 300px;
                      background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
                      filter: blur(60px);
                      pointer-events: none;
                    }
                    .glow-2 {
                      position: absolute;
                      bottom: 15%;
                      right: 20%;
                      width: 320px;
                      height: 320px;
                      background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
                      filter: blur(70px);
                      pointer-events: none;
                    }
                    .card {
                      position: relative;
                      z-index: 10;
                      width: 100%;
                      max-width: 480px;
                      background: rgba(15, 23, 42, 0.9);
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      border-radius: 24px;
                      padding: 36px 28px;
                      text-align: center;
                      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                      backdrop-filter: blur(16px);
                      -webkit-backdrop-filter: blur(16px);
                    }
                    .badge {
                      display: inline-flex;
                      align-items: center;
                      gap: 8px;
                      padding: 6px 14px;
                      border-radius: 9999px;
                      background: rgba(56, 189, 248, 0.1);
                      border: 1px solid rgba(56, 189, 248, 0.25);
                      color: #38bdf8;
                      font-size: 11px;
                      font-weight: 700;
                      letter-spacing: 0.08em;
                      text-transform: uppercase;
                      margin-bottom: 24px;
                    }
                    .badge-dot {
                      width: 7px;
                      height: 7px;
                      border-radius: 50%;
                      background: #38bdf8;
                      box-shadow: 0 0 8px #38bdf8;
                      animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                      0%, 100% { opacity: 1; transform: scale(1); }
                      50% { opacity: 0.3; transform: scale(0.85); }
                    }
                    .icon-box {
                      width: 76px;
                      height: 76px;
                      border-radius: 20px;
                      background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(16, 185, 129, 0.15));
                      border: 1px solid rgba(56, 189, 248, 0.25);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      margin: 0 auto 20px auto;
                      box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.3);
                    }
                    h1 {
                      font-size: 22px;
                      font-weight: 800;
                      color: #ffffff;
                      letter-spacing: -0.02em;
                      margin-bottom: 10px;
                      line-height: 1.3;
                    }
                    p {
                      font-size: 14px;
                      color: #94a3b8;
                      line-height: 1.6;
                      margin-bottom: 28px;
                    }
                    .btn-group {
                      display: grid;
                      grid-template-columns: 1fr;
                      gap: 12px;
                    }
                    @media (min-width: 440px) {
                      .btn-group {
                        grid-template-columns: 1fr 1fr;
                      }
                    }
                    .btn {
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      gap: 8px;
                      padding: 13px 20px;
                      border-radius: 14px;
                      font-size: 13px;
                      font-weight: 700;
                      cursor: pointer;
                      text-decoration: none;
                      transition: all 0.2s ease;
                      border: none;
                      font-family: inherit;
                    }
                    .btn-primary {
                      background: linear-gradient(135deg, #2563eb, #1d4ed8);
                      color: #ffffff;
                      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
                    }
                    .btn-primary:hover {
                      background: linear-gradient(135deg, #1d4ed8, #1e40af);
                      transform: translateY(-1px);
                    }
                    .btn-secondary {
                      background: rgba(255, 255, 255, 0.06);
                      color: #cbd5e1;
                      border: 1px solid rgba(255, 255, 255, 0.12);
                    }
                    .btn-secondary:hover {
                      background: rgba(255, 255, 255, 0.12);
                      color: #ffffff;
                      transform: translateY(-1px);
                    }
                    .status-line {
                      margin-top: 24px;
                      font-size: 11px;
                      color: #64748b;
                      border-top: 1px solid rgba(255, 255, 255, 0.08);
                      padding-top: 18px;
                    }
                  </style>
                </head>
                <body>
                  <div class="glow-1"></div>
                  <div class="glow-2"></div>
                  <div class="card">
                    <div class="badge">
                      <span class="badge-dot"></span>
                      <span>Mode Offline • P2KD Kalisalak</span>
                    </div>

                    <div class="icon-box">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                        <line x1="12" y1="20" x2="12.01" y2="20"></line>
                      </svg>
                    </div>

                    <h1>Koneksi Jaringan Terputus</h1>
                    <p id="recon-status">
                      Perangkat Anda saat ini tidak terhubung ke jaringan internet. Halaman ini memerlukan sambungan aktif untuk memverifikasi data terbaru.
                    </p>

                    <div class="btn-group">
                      <button class="btn btn-primary" onclick="location.reload()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                          <path d="M3 3v5h5"></path>
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                          <path d="M16 21h5v-5"></path>
                        </svg>
                        Hubungkan Kembali
                      </button>

                      <button class="btn btn-secondary" onclick="window.location.href='/'">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        Ke Beranda
                      </button>
                    </div>

                    <div class="status-line">
                      Sistem akan memuat ulang otomatis begitu internet tersambung kembali
                    </div>
                  </div>

                  <script>
                    window.addEventListener('online', function() {
                      var status = document.getElementById('recon-status');
                      if (status) status.innerText = 'Koneksi internet terdeteksi kembali! Memuat ulang sistem...';
                      setTimeout(function() { location.reload(); }, 600);
                    });
                  </script>
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
