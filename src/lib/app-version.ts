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
  appVersion: "2.25.01",
  buildNumber: "2026100801",
  gitCommit: "7b4e9f1a",
  buildDate: "2026-10-08T09:30:00+07:00",
  environment: "production",
  apiVersion: "v2.0-core",
  databaseSchemaVersion: "2026.10.08_master_statistik_v2",
  minSupportedVersion: "2.25.00",
  latestVersion: "2.25.01",
  apkDownloadUrl: "/P2KD-Desa-Kalisalak-v2.25.01.apk",
  apkFileName: "P2KD-Desa-Kalisalak-v2.25.01.apk",
  apkSizeBytes: 6737290,
  apkSha256: "1FD8514FC5A2EB876E069B99332EFACE9CB995B860453F9274A6C759AC23C311",
  releaseNotes: [
    "Sinkronisasi arsitektur master database statistik_pemilih berbasis PostgreSQL trigger.",
    "Implementasi TanStack Query & Dexie encrypted local storage cache.",
    "Perbaikan telemetri audit log Android APK (pencatatan user-agent & perangkat native).",
    "Pencegahan load 10.000 data sekaligus dengan server-side keyset pagination.",
    "Bust cache Service Worker v2.25.01-opt.",
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
