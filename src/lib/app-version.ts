/**
 * Master Identitas App Version, Build Identity, dan Integritas APK Android
 * P2KD Desa Kalisalak (Realtime Synchronized via GitHub Releases API)
 */

export interface AppBuildIdentity {
  appVersion: string;
  buildNumber: string;
  gitCommit: string;
  buildDate: string;
  environment: "production" | "staging" | "development";
  apiVersion: string;
  databaseSchemaVersion: string;
  minSupportedVersion: string;
  latestVersion: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSizeBytes: number;
  apkSha256: string;
  releaseNotes: string[];
}

export const APP_BUILD_INFO: AppBuildIdentity = {
  appVersion: "1.10.4",
  buildNumber: "2026101014",
  gitCommit: "v1104-prod",
  buildDate: "2026-10-10T22:15:00+07:00",
  environment: "production",
  apiVersion: "v2.0-core",
  databaseSchemaVersion: "2026.10.10_coklit_v1104",
  minSupportedVersion: "1.0.0",
  latestVersion: "1.10.4",
  apkDownloadUrl: "https://github.com/pkd-develzy/build.apk_p2kd/releases/latest/download/PETUGAS_P2KD.apk",
  apkFileName: "PETUGAS_P2KD.apk",
  apkSizeBytes: 49256703,
  apkSha256: "PETUGAS_P2KD_OFFICIAL_RELEASE_V1104",
  releaseNotes: [
    "Pembaruan Resmi Aplikasi PETUGAS P2KD Pilkades Kalisalak.",
    "Perbaikan Integrasi Bot Telegram: Tautan langsung ke bot resmi @pantarlih_bot untuk penautan akun dan pemulihan PIN & kata sandi.",
    "Deteksi Versi Realtime Otomatis: Versi aplikasi kini dibaca secara dinamis dari GitHub Releases tanpa perlu hardcode berulang.",
    "Tombol Pemulihan Langsung: Tautan rahasia satu kali pakai (15 menit) via bot Telegram resmi.",
    "Tema Visual Eksekutif: Bersih, Mewah, & Berwibawa (Executive Clean White & Deep Navy).",
    "Pusat Notifikasi Khusus: Dashboard Admin terpisah eksklusif untuk menyiarkan instruksi ke aplikasi petugas.",
    "Kunci Otomatis (Background Auto-Lock): Aplikasi otomatis terkunci dan wajib verifikasi PIN/sidik jari saat kembali dari latar belakang.",
    "Konfirmasi Tombol Kembali: Mencegah aplikasi langsung keluar secara tidak sengaja.",
  ],
};

let cachedBuildInfo: AppBuildIdentity = APP_BUILD_INFO;
let lastFetchTime = 0;

/**
 * Mengambil informasi rilis terbaru secara REALTIME langsung dari GitHub Releases API.
 * Menghilangkan kebutuhan untuk mengedit kode terus menerus setiap rilis APK baru!
 */
export async function getRealtimeAppBuildInfo(): Promise<AppBuildIdentity> {
  const now = Date.now();
  // Cache ringan 60 detik untuk mencegah rate-limit
  if (now - lastFetchTime < 60000 && cachedBuildInfo) {
    return cachedBuildInfo;
  }

  try {
    const res = await fetch("https://api.github.com/repos/pkd-develzy/build.apk_p2kd/releases/latest", {
      headers: {
        "User-Agent": "P2KD-Kalisalak-Server",
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      const rawTag = String(data.tag_name || "").replace(/^v/i, "").trim();
      if (rawTag) {
        const apkAsset = Array.isArray(data.assets)
          ? data.assets.find((a: { name: string }) => a.name.endsWith(".apk"))
          : null;

        const downloadUrl =
          apkAsset?.browser_download_url ||
          "https://github.com/pkd-develzy/build.apk_p2kd/releases/latest/download/PETUGAS_P2KD.apk";
        const sizeBytes = apkAsset?.size || 49256703;

        let notes: string[] = [];
        if (typeof data.body === "string" && data.body.trim()) {
          notes = data.body
            .split("\n")
            .map((l: string) => l.replace(/^[-*•]\s*/, "").trim())
            .filter((l: string) => l.length > 0 && !l.startsWith("#"));
        }

        cachedBuildInfo = {
          ...APP_BUILD_INFO,
          appVersion: rawTag,
          latestVersion: rawTag,
          apkDownloadUrl: downloadUrl,
          apkSizeBytes: sizeBytes,
          releaseNotes: notes.length > 0 ? notes : APP_BUILD_INFO.releaseNotes,
          buildDate: data.published_at || new Date().toISOString(),
        };
        lastFetchTime = now;
      }
    }
  } catch (e) {
    console.warn("Realtime GitHub releases fetch warning, using fallback:", e);
  }

  return cachedBuildInfo;
}

/**
 * Normalisasi versi ke angka array untuk perbandingan semver
 */
function parseVersion(v: string): number[] {
  const clean = v.replace(/^[^\d]*/, "").replace(/[^\d.].*$/, "");
  return clean.split(".").map((n) => parseInt(n, 10) || 0);
}

/**
 * Membandingkan 2 versi: -1 jika a < b, 0 jika a == b, 1 jika a > b
 */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const maxLen = Math.max(pa.length, pb.length);
  for (let i = 0; i < maxLen; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/**
 * Mendeteksi versi client dari header atau User-Agent APK
 */
export function detectClientAppVersion(
  userAgent?: string | null,
  headerVersion?: string | null
): { version: string; isNativeApk: boolean } {
  if (headerVersion && headerVersion.trim()) {
    return { version: headerVersion.trim(), isNativeApk: true };
  }

  const ua = (userAgent || "").toLowerCase();
  const isNativeApk =
    ua.includes("p2kdapp") ||
    ua.includes("androidnative") ||
    (ua.includes("; wv") && ua.includes("android"));

  if (isNativeApk) {
    const match = ua.match(/p2kdapp\/([0-9.]+)/i);
    if (match && match[1]) {
      return { version: match[1], isNativeApk: true };
    }
    return { version: APP_BUILD_INFO.appVersion, isNativeApk: true };
  }

  return { version: `${APP_BUILD_INFO.appVersion}-web`, isNativeApk: false };
}

/**
 * Memeriksa status update untuk client tertentu berbasis info realtime
 */
export function evaluateAppVersionStatus(clientVersion: string, buildInfo: AppBuildIdentity = APP_BUILD_INFO) {
  const isBelowMin = compareVersions(clientVersion, buildInfo.minSupportedVersion) < 0;
  const isBelowLatest = compareVersions(clientVersion, buildInfo.latestVersion) < 0;

  return {
    clientVersion,
    latestVersion: buildInfo.latestVersion,
    minSupportedVersion: buildInfo.minSupportedVersion,
    isLatest: !isBelowLatest,
    updateAvailable: isBelowLatest,
    updateRequired: isBelowMin,
    apkDownloadUrl: buildInfo.apkDownloadUrl,
    apkFileName: buildInfo.apkFileName,
    apkSizeBytes: buildInfo.apkSizeBytes,
    apkSha256: buildInfo.apkSha256,
  };
}
