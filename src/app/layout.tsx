import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Pilkades Desa Kalisalak | Kec. Margasari, Kab. Tegal",
  description: "Portal Resmi Pendaftaran, Hak Pilih & Coklit Pemilihan Kepala Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "P2KD Kalisalak",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://api.telegram.org" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Instantly silence and block all automatic PWA install popups / infobars
                  window.addEventListener('beforeinstallprompt', function(e) {
                    e.preventDefault();
                    return false;
                  }, true);

                  // 2. Strict PWA standalone redirect
                  var isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                              window.matchMedia('(display-mode: fullscreen)').matches ||
                              window.matchMedia('(display-mode: minimal-ui)').matches ||
                              window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                              (window.navigator && window.navigator.standalone === true) ||
                              (document.referrer && document.referrer.indexOf('android-app://') !== -1);
                  if (isPWA) {
                    document.documentElement.classList.add('is-pwa-app');
                    var p = window.location.pathname;
                    if (p !== '/admin' && !p.startsWith('/admin') && !p.startsWith('/verifikasi-c6') && !p.startsWith('/stiker-coklit')) {
                      window.location.replace('/admin');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600/20 selection:text-blue-900">
        <PwaRegistrar />
        <AppProviders>{children}</AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
