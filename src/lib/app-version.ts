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
  appVersion: "1.8.1",
  buildNumber: "2026101011",
  gitCommit: "2b4e89f",
  buildDate: "2026-10-10T11:00:00+07:00",
  environment: "production",
  apiVersion: "v2.0-core",
  databaseSchemaVersion: "2026.10.10_coklit_v181",
  minSupportedVersion: "1.0.0",
  latestVersion: "1.8.1",
  apkDownloadUrl: "https://github.com/pkd-develzy/build.apk_p2kd/releases/latest/download/PETUGAS_P2KD.apk",
  apkFileName: "PETUGAS_P2KD.apk",
  apkSizeBytes: 37715968,
  apkSha256: "PETUGAS_P2KD_OFFICIAL_RELEASE_V181",
  releaseNotes: [
    "Pembaruan Resmi Aplikasi PETUGAS P2KD v1.8.1 Pilkades Kalisalak.",
    "Tema visual baru: Putih - Biru Dongker Berwibawa (Executive White & Deep Navy).",
    "Integrasi WhatsApp Resmi Sekretariat P2KD (0851-7154-2025).",
    "Alur Coklit Cerdas: Verifikasi [COCOK] vs [TIDAK COCOK / PERBAIKI DATA] dengan checklist elemen keliru.",
    "Buka batasan 100 penduduk sehingga seluruh pemilih RW/TPS binaan masuk lengkap.",
    "Penyesuaian struktur wilayah murni RT 01 s/d RT 03 untuk setiap RW.",
    "Pemberian izin edit NIK & No KK pada perbaikan data lapangan.",
    "Penghapusan informasi kuota stiker dari beranda mobile (khusus peran cetak admin web).",
    "Dukungan unggah file foto profil asli dari galeri HP (PNG/JPG).",
    "Penyematan sistem latar belakang otomatis tanpa keharusan sinkronisasi manual.",
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
