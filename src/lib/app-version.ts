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
  appVersion: "1.10.3",
  buildNumber: "2026101013",
  gitCommit: "v1103-prod",
  buildDate: "2026-10-10T20:30:00+07:00",
  environment: "production",
  apiVersion: "v2.0-core",
  databaseSchemaVersion: "2026.10.10_coklit_v1103",
  minSupportedVersion: "1.0.0",
  latestVersion: "1.10.3",
  apkDownloadUrl: "https://github.com/pkd-develzy/build.apk_p2kd/releases/latest/download/PETUGAS_P2KD.apk",
  apkFileName: "PETUGAS_P2KD.apk",
  apkSizeBytes: 49097728,
  apkSha256: "fbd69304880c3adf15d98d7da6ae67adb101fa988403e6a7ab597f4e7a81f733",
  releaseNotes: [
    "Pembaruan Resmi Aplikasi PETUGAS P2KD v1.10.3 Pilkades Kalisalak.",
    "Tema Visual Baru: Eksekutif Putih Bersih & Biru Dongker Berwibawa (Executive Clean White & Deep Navy).",
    "Welcome Screen Full Screen: Logo resmi di tengah dengan animasi teks berjalan menulis (Typewriter effect).",
    "Pembersihan Beranda: Tombol reload manual dihapus dari Beranda, digantikan sinkronisasi pintar otomatis.",
    "Banner Notifikasi/Pengumuman Bergambar di Beranda: Terintegrasi langsung dengan dashboard admin (otomatis tersembunyi jika tidak aktif).",
    "Fitur Pindah RW: Mendukung mutasi pemilih antar-RW dalam Desa Kalisalak (warga menikah/pindah domisili).",
    "Scanner QR Cerdas: Auto-provisioning otomatis sehingga QR Code stiker dari dashboard admin langsung dapat dipindai tanpa error.",
    "Kunci Wilayah Kalisalak: Alamat desa/dusun terkunci dan RT berupa pilihan dropdown RT 01 s/d RT 03.",
    "Pembacaan Versi Dinamis: Versi aplikasi dibaca langsung dari paket HP untuk mencegah notifikasi update berulang.",
    "Keamanan Perbankan (Banking Grade): Layar kunci cepat 6-digit PIN & Biometrik Sidik Jari gaya SeaBank.",
    "Kunci Otomatis (Auto-Lock): Aplikasi otomatis terkunci saat keluar/background untuk melindungi data kependudukan warga.",
    "Pemulihan Telegram: Lupa PIN & Lupa Password menggunakan Bot Telegram dengan Tautan Rahasia Satu Kali Pakai (15 menit).",
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
