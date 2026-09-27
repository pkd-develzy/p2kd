import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Konversi timestamp atau format string waktu ke format resmi WIB (Waktu Indonesia Barat / Asia/Jakarta)
 */
export function formatWIB(rawDate: string | number | Date | undefined): string {
  if (!rawDate) return "-";

  const rawStr = String(rawDate).trim();
  if (rawStr.endsWith("WIB")) {
    return rawStr;
  }

  // Parse string id-ID UTC dari server: "27/9/2026, 23.15.13" atau "27/09/2026 23:15:13"
  const match = rawStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[,\s]+(\d{1,2})[.:](\d{1,2})[.:](\d{1,2})/);
  if (match) {
    const [, day, month, year, hour, minute, second] = match;
    const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
    if (!isNaN(utcDate.getTime())) {
      return utcDate.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).replace(/\./g, ":") + " WIB";
    }
  }

  // Parse ISO string atau epoch timestamp
  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    return d.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(/\./g, ":") + " WIB";
  }

  return rawStr + " WIB";
}

export type ClientAccessType = "APLIKASI_APK" | "BROWSER_WEB" | "APLIKASI_PWA";

export interface ClientSourceInfo {
  type: ClientAccessType;
  label: string; // e.g., "Aplikasi Android (APK v2.25.01)" vs "Browser Web (Google Chrome - Windows)"
  badgeLabel: string; // "Aplikasi APK" vs "Browser Web" vs "Web App (PWA)"
  isApp: boolean;
  isMobile: boolean;
  platform: string; // "Android Native", "Windows", "Apple iOS", "macOS", "Linux", etc.
  browserName: string; // "P2KD Mobile App", "Google Chrome", "Microsoft Edge", etc.
  deviceLabel: string; // "Smartphone Android (APK)", "Desktop PC / Laptop", etc.
  iconType: "apk" | "browser" | "pwa";
}

/**
 * Mendeteksi secara akurat apakah log audit atau request berasal dari:
 * 1. APLIKASI_APK: Aplikasi Android Native (.APK v2.25.01)
 * 2. BROWSER_WEB: Browser Desktop / Mobile (Chrome, Edge, Firefox, Safari, dll.)
 * 3. APLIKASI_PWA: Progressive Web App / Web App Standalone
 */
export function parseClientSource(data?: {
  userAgent?: string;
  browser?: string;
  device?: string;
  detail?: string;
}): ClientSourceInfo {
  const ua = (data?.userAgent || "").trim();
  const browserRaw = (data?.browser || "").trim();
  const deviceRaw = (data?.device || "").trim();
  const detailRaw = (data?.detail || "").trim();

  const combined = `${ua} ${browserRaw} ${deviceRaw} ${detailRaw}`.toLowerCase();

  // Indikator Aplikasi Android APK:
  // - P2KDApp / AndroidNative (diinjeksi langsung oleh MainActivity.java Android APK)
  // - WebView Android (; wv)
  // - Tag eksplisit di browser/device/detail ("APK", "Aplikasi Android", "P2KD Mobile")
  const isNativeApk =
    combined.includes("p2kdapp") ||
    combined.includes("androidnative") ||
    combined.includes("p2kd-android") ||
    combined.includes("p2kd mobile") ||
    combined.includes("aplikasi android") ||
    combined.includes("aplikasi (apk)") ||
    combined.includes("aplikasi apk") ||
    combined.includes("native apk") ||
    (combined.includes("; wv") && combined.includes("android")) ||
    (combined.includes("version/4.0") && combined.includes("chrome") && combined.includes("android"));

  const isPwa = !isNativeApk && (combined.includes("pwa") || combined.includes("display-mode: standalone") || combined.includes("standalone"));

  // Deteksi Platform / Sistem Operasi
  let platform = "Desktop";
  let isMobile = false;

  if (combined.includes("android")) {
    platform = isNativeApk ? "Android Native" : "Android OS";
    isMobile = true;
  } else if (combined.includes("iphone") || combined.includes("ipad") || combined.includes("ipod") || combined.includes("ios")) {
    platform = "Apple iOS";
    isMobile = true;
  } else if (combined.includes("windows nt 10") || combined.includes("windows 10") || combined.includes("windows 11") || combined.includes("win64") || combined.includes("windows")) {
    platform = "Windows PC";
  } else if (combined.includes("macintosh") || combined.includes("mac os") || combined.includes("macos")) {
    platform = "macOS";
  } else if (combined.includes("linux")) {
    platform = "Linux";
  }

  // Deteksi Browser
  let browserName = "Web Browser";
  if (isNativeApk) {
    browserName = "P2KD Mobile App (APK v2.25.01)";
  } else if (combined.includes("edg/")) {
    browserName = "Microsoft Edge";
  } else if (combined.includes("opr/") || combined.includes("opera")) {
    browserName = "Opera";
  } else if (combined.includes("samsungbrowser")) {
    browserName = "Samsung Internet";
  } else if (combined.includes("firefox") || combined.includes("fxios")) {
    browserName = "Mozilla Firefox";
  } else if (combined.includes("chrome") || combined.includes("crios")) {
    browserName = "Google Chrome";
  } else if (combined.includes("safari") && !combined.includes("chrome")) {
    browserName = "Apple Safari";
  }

  if (isNativeApk) {
    return {
      type: "APLIKASI_APK",
      label: "Aplikasi Android (APK v2.25.01)",
      badgeLabel: "Aplikasi Android (APK)",
      isApp: true,
      isMobile: true,
      platform: "Android Native",
      browserName: "P2KD Mobile App v2.25.01",
      deviceLabel: "Smartphone Android (APK)",
      iconType: "apk",
    };
  }

  if (isPwa) {
    return {
      type: "APLIKASI_PWA",
      label: `Aplikasi Web PWA (${platform})`,
      badgeLabel: "Aplikasi Web (PWA)",
      isApp: true,
      isMobile,
      platform,
      browserName: "PWA Standalone",
      deviceLabel: isMobile ? "Perangkat Mobile (PWA)" : "Desktop / Laptop (PWA)",
      iconType: "pwa",
    };
  }

  return {
    type: "BROWSER_WEB",
    label: `Browser Web (${browserName} - ${platform})`,
    badgeLabel: "Browser Web",
    isApp: false,
    isMobile,
    platform,
    browserName,
    deviceLabel: isMobile ? `Smartphone Mobile (${platform})` : `Desktop / Laptop (${platform})`,
    iconType: "browser",
  };
}

