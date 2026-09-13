/**
 * kalisalak-wilayah.ts
 * Master data & helper wilayah Desa Kalisalak (13 RW & 39 RT)
 * Pemetaan otomatis Tabung Pemilihan (TPS 01 - TPS 07)
 */

export interface WilayahRwItem {
  rw: string;
  label: string;
  rtList: string[];
  defaultTpsNomor: string;
  defaultTpsNama: string;
}

export const DAFTAR_RW_KALISALAK: { value: string; label: string; defaultTps: string }[] = [
  { value: "01", label: "RW 01", defaultTps: "01" },
  { value: "02", label: "RW 02", defaultTps: "02" },
  { value: "03", label: "RW 03", defaultTps: "03" },
  { value: "04", label: "RW 04", defaultTps: "04" },
  { value: "05", label: "RW 05", defaultTps: "05" },
  { value: "06", label: "RW 06", defaultTps: "06" },
  { value: "07", label: "RW 07", defaultTps: "07" },
  { value: "08", label: "RW 08", defaultTps: "08" },
  { value: "09", label: "RW 09", defaultTps: "09" },
  { value: "10", label: "RW 10", defaultTps: "10" },
  { value: "11", label: "RW 11", defaultTps: "11" },
  { value: "12", label: "RW 12", defaultTps: "12" },
  { value: "13", label: "RW 13", defaultTps: "13" },
];

export const DAFTAR_RT_KALISALAK: { value: string; label: string }[] = [
  { value: "01", label: "RT 01" },
  { value: "02", label: "RT 02" },
  { value: "03", label: "RT 03" },
];

/**
 * Normalisasi format string RW / RT ke format 2 digit (contoh: "1" -> "01", "RW 02" -> "02")
 */
export function normalizeWilayahCode(val: string | number | undefined | null): string {
  if (!val) return "01";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "01";
  const num = parseInt(digits, 10);
  if (isNaN(num)) return "01";
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Pemetaan otomatis Wilayah TPS berdasarkan RW dan RT Desa Kalisalak
 * Di Desa Kalisalak, terdapat 13 TPS yang masing-masing melayani 13 RW secara presisi (1-to-1 mapping):
 * - RW 01 -> Wilayah RW 01 (TPS 01)
 * - RW 02 -> Wilayah RW 02 (TPS 02)
 * - RW 03 -> Wilayah RW 03 (TPS 03)
 * ...
 * - RW 13 -> Wilayah RW 13 (TPS 13)
 */
export function getAutoTabungByRtRw(
  rwVal: string | number,
  rtVal?: string | number,
  availableTpsList?: Array<{ id?: string; nomorTps?: string; namaTps?: string; kodeTps?: string }>
): string {
  const cleanRw = normalizeWilayahCode(rwVal);
  const rwNum = parseInt(cleanRw, 10);
  const targetTpsNomor = rwNum < 10 ? `0${rwNum}` : `${rwNum}`;

  // Jika ada availableTpsList, sesuaikan nama resmi dari database TPS
  if (availableTpsList && availableTpsList.length > 0) {
    const numInt = rwNum;
    const matched = availableTpsList.find(
      (t) =>
        (t.nomorTps && (t.nomorTps === targetTpsNomor || parseInt(t.nomorTps, 10) === numInt)) ||
        (t.namaTps && (t.namaTps.includes(`0${numInt}`) || t.namaTps.includes(` ${numInt}`))) ||
        (t.kodeTps && (t.kodeTps.includes(`0${numInt}`) || t.kodeTps.includes(` ${numInt}`)))
    );
    if (matched && matched.namaTps) return matched.namaTps;
  }

  return `Wilayah RW ${targetTpsNomor}`;
}
