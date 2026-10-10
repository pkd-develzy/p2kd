/**
 * Master Identitas App Version, Build Identity, dan Integritas APK Android
 * P2KD Desa Kalisalak
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
  appVersion: "1.9.1",
  buildNumber: "2026101012",
  gitCommit: "v191-prod",
  buildDate: "2026-10-10T12:00:00+07:00",
  environment: "production",
  apiVersion: "v2.0-core",
  databaseSchemaVersion: "2026.10.10_coklit_v191",
  minSupportedVersion: "1.0.0",
  latestVersion: "1.9.1",
  apkDownloadUrl: "https://github.com/pkd-develzy/build.apk_p2kd/releases/latest/download/PETUGAS_P2KD.apk",
  apkFileName: "PETUGAS_P2KD.apk",
  apkSizeBytes: 49073152,
  apkSha256: "PETUGAS_P2KD_OFFICIAL_RELEASE_V191",
  releaseNotes: [
    "Pembaruan Resmi Aplikasi PETUGAS P2KD v1.9.1 Pilkades Kalisalak.",
    "Fitur Detail Pemilih Instan: Ketuk data warga untuk melihat seluruh rincian informasi lengkap (Read-Only).",
    "Form Edit Data Langsung: Form perbaikan data langsung terbuka tanpa perlu mencentang elemen terlebih dahulu.",
    "Perhitungan Umur Cerdas: Usia otomatis dihitung presisi dari tanggal lahir secara real-time (tidak lagi 0 Th).",
    "Normalisasi Status Perkawinan: Standardisasi istilah lapangan resmi (Belum Kawin, Kawin, Cerai Hidup, Cerai Mati).",
    "Kalender Tanggal Lahir Modern: Pemilih tanggal lahir visual interaktif berbasis kalender Material 3 bebas kesalahan penulisan.",
    "Welcome Screen Kaligrafi Elegan: Animasi teks berjalan 'Selamat Datang Petugas' dengan tipografi kaligrafi berkelas ala iOS/Apple.",
  ],
};

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
 * Memeriksa status update untuk client tertentu
 */
export function evaluateAppVersionStatus(clientVersion: string) {
  const isBelowMin = compareVersions(clientVersion, APP_BUILD_INFO.minSupportedVersion) < 0;
  const isBelowLatest = compareVersions(clientVersion, APP_BUILD_INFO.latestVersion) < 0;

  return {
    clientVersion,
    latestVersion: APP_BUILD_INFO.latestVersion,
    minSupportedVersion: APP_BUILD_INFO.minSupportedVersion,
    isLatest: !isBelowLatest,
    updateAvailable: isBelowLatest,
    updateRequired: isBelowMin,
    apkDownloadUrl: APP_BUILD_INFO.apkDownloadUrl,
    apkFileName: APP_BUILD_INFO.apkFileName,
    apkSizeBytes: APP_BUILD_INFO.apkSizeBytes,
    apkSha256: APP_BUILD_INFO.apkSha256,
  };
}
