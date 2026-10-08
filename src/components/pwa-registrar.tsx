"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PwaRegistrar() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Silent BeforeInstallPrompt handler (Disables annoying automatic install banner popups)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Mencegah popup install otomatis
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 2. Register Service Worker in background
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("P2KD PWA Service Worker Registered:", reg.scope);
          // Selalu periksa pembaruan Service Worker secara berkala
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("PWA Service Worker registration skipped:", err);
        });
    }

    // 3. Strict PWA Routing: All PWA instances (Desktop & Mobile) MUST go directly to /admin
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      document.referrer.includes("android-app://") ||
      document.documentElement.classList.contains("is-pwa-app");

    if (isStandalone) {
      document.documentElement.classList.add("is-pwa-app");
      // If PWA is on public page, immediately hard-redirect to /admin
      if (
        !pathname.startsWith("/admin") &&
        !pathname.startsWith("/verifikasi-c6") &&
        !pathname.startsWith("/stiker-coklit")
      ) {
        window.location.replace("/admin");
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [pathname]);

  return null;
}
