/**
 * Template & Generator Teks Hukum Resmi Pilkades Kabupaten Tegal
 * Berdasarkan Naskah Asli Peraturan Bupati Tegal Nomor 27 Tahun 2018
 * jo Peraturan Bupati Tegal Nomor 31 Tahun 2019
 *
 * Seluruh nomor dokumen WAJIB diinput manual / dikosongkan dengan garis titik-titik.
 */

import { formatNomorManual } from "@/regulations";

export interface DocumentContext {
  namaDesa: string;
  namaKecamatan: string;
  namaKabupaten: string;
  alamatSekretariat: string;
  kontakSekretariat: string;
  kodePos: string;
  tahun: number | string;
  namaKetua: string;
  namaSekretaris: string;
  tanggalDokumen?: string;
  tempatDitetapkan?: string;
}

export const DEFAULT_DOC_CONTEXT: DocumentContext = {
  namaDesa: "Kalisalak",
  namaKecamatan: "Margasari",
  namaKabupaten: "Tegal",
  alamatSekretariat: "Gedung Balai Desa Kalisalak, Jl. K. Abdul Latief, Kalisalak",
  kontakSekretariat: "0858-7958-4257",
  kodePos: "52463",
  tahun: "2026",
  namaKetua: "Khasanudin, S.Pd.SD",
  namaSekretaris: "Mashady, M.H.",
  tempatDitetapkan: "Kalisalak",
};

/**
 * Konsideran Hukum Standar Sesuai Perbup Tegal No 27 Tahun 2018 jo No 31 Tahun 2019
 */
export const KONSIDERAN_HUKUM_PILKADES = [
  "Undang-Undang Nomor 6 Tahun 2014 tentang Desa (Lembaran Negara Republik Indonesia Tahun 2014 Nomor 7, Tambahan Lembaran Negara Republik Indonesia Nomor 5495);",
  "Peraturan Pemerintah Nomor 43 Tahun 2014 tentang Peraturan Pelaksanaan Undang-Undang Nomor 6 Tahun 2014 tentang Desa sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 47 Tahun 2015;",
  "Peraturan Menteri Dalam Negeri Nomor 112 Tahun 2014 tentang Pemilihan Kepala Desa sebagaimana telah diubah dengan Peraturan Menteri Dalam Negeri Nomor 65 Tahun 2017;",
  "Peraturan Daerah Kabupaten Tegal Nomor 6 Tahun 2015 tentang Kepala Desa, Perangkat Desa dan Badan Permusyawaratan Desa (Lembaran Daerah Kabupaten Tegal Tahun 2015 Nomor 6);",
  "Peraturan Bupati Tegal Nomor 27 Tahun 2018 tentang Petunjuk Pelaksanaan Peraturan Daerah Kabupaten Tegal Nomor 6 Tahun 2015 tentang Tata Cara Pemilihan Kepala Desa sebagaimana telah diubah dengan Peraturan Bupati Tegal Nomor 31 Tahun 2019.",
];

/**
 * Format Kop Surat Resmi Panitia Pemilihan Kepala Desa (Perbup Tegal)
 */
export function getKopResmiP2KD(ctx: Partial<DocumentContext> = {}) {
  const merged = { ...DEFAULT_DOC_CONTEXT, ...ctx };
  return {
    baris1: "PANITIA PEMILIHAN KEPALA DESA",
    baris2: `DESA ${merged.namaDesa.toUpperCase()} KECAMATAN ${merged.namaKecamatan.toUpperCase()}`,
    baris3: `KABUPATEN ${merged.namaKabupaten.toUpperCase()}`,
    sekretariat: `Sekretariat: ${merged.alamatSekretariat} Telp: ${merged.kontakSekretariat} Kode Pos: ${merged.kodePos}`,
  };
}

/**
 * Struktur Format Lampiran XIII: Keputusan Panitia tentang Penetapan DPS
 */
export function getSkDpsText(
  nomorSkManual: string | undefined,
  totalLaki: number,
  totalPerempuan: number,
  ctx: Partial<DocumentContext> = {}
) {
  const c = { ...DEFAULT_DOC_CONTEXT, ...ctx };
  const total = totalLaki + totalPerempuan;
  const nomorDoc = formatNomorManual(nomorSkManual, "............................................................");

  return {
    judulSk: `KEPUTUSAN PANITIA PEMILIHAN KEPALA DESA\nDESA ${c.namaDesa.toUpperCase()} KECAMATAN ${c.namaKecamatan.toUpperCase()}\nKABUPATEN ${c.namaKabupaten.toUpperCase()}`,
    nomorSk: `NOMOR : ${nomorDoc}`,
    tentang: `TENTANG\nPENETAPAN DAFTAR PEMILIH SEMENTARA (DPS)\nPEMILIHAN KEPALA DESA ${c.namaDesa.toUpperCase()} KECAMATAN ${c.namaKecamatan.toUpperCase()}\nKABUPATEN ${c.namaKabupaten.toUpperCase()}\nTAHUN ${c.tahun}`,
    diktumKesatu: `Menetapkan Daftar Pemilih Sementara (DPS) Pemilihan Kepala Desa ${c.namaDesa} Kecamatan ${c.namaKecamatan} Kabupaten ${c.namaKabupaten} Tahun ${c.tahun} sebagaimana tercantum dalam Lampiran yang merupakan bagian tidak terpisahkan dari Keputusan ini.`,
    diktumKedua: `Jumlah pemilih dalam Daftar Pemilih Sementara (DPS) sebagaimana dimaksud pada Diktum KESATU sebanyak ${total.toLocaleString("id-ID")} orang, terdiri dari laki-laki ${totalLaki.toLocaleString("id-ID")} orang dan perempuan ${totalPerempuan.toLocaleString("id-ID")} orang.`,
    diktumKetiga: `Keputusan ini mulai berlaku pada tanggal ditetapkan.`,
  };
}

/**
 * Struktur Format Lampiran XVII: Keputusan Panitia tentang Penetapan DPT
 */
export function getSkDptText(
  nomorSkManual: string | undefined,
  totalLaki: number,
  totalPerempuan: number,
  ctx: Partial<DocumentContext> = {}
) {
  const c = { ...DEFAULT_DOC_CONTEXT, ...ctx };
  const total = totalLaki + totalPerempuan;
  const nomorDoc = formatNomorManual(nomorSkManual, "............................................................");

  return {
    judulSk: `KEPUTUSAN PANITIA PEMILIHAN KEPALA DESA\nDESA ${c.namaDesa.toUpperCase()} KECAMATAN ${c.namaKecamatan.toUpperCase()}\nKABUPATEN ${c.namaKabupaten.toUpperCase()}`,
    nomorSk: `NOMOR : ${nomorDoc}`,
    tentang: `TENTANG\nPENETAPAN DAFTAR PEMILIH TETAP (DPT)\nPEMILIHAN KEPALA DESA ${c.namaDesa.toUpperCase()} KECAMATAN ${c.namaKecamatan.toUpperCase()}\nKABUPATEN ${c.namaKabupaten.toUpperCase()}\nTAHUN ${c.tahun}`,
    diktumKesatu: `Menetapkan Daftar Pemilih Tetap (DPT) Pemilihan Kepala Desa ${c.namaDesa} Kecamatan ${c.namaKecamatan} Kabupaten ${c.namaKabupaten} Tahun ${c.tahun} sebagaimana tercantum dalam Lampiran yang merupakan bagian tidak terpisahkan dari Keputusan ini.`,
    diktumKedua: `Jumlah pemilih dalam Daftar Pemilih Tetap (DPT) sebagaimana dimaksud pada Diktum KESATU sebanyak ${total.toLocaleString("id-ID")} orang, terdiri dari laki-laki ${totalLaki.toLocaleString("id-ID")} orang dan perempuan ${totalPerempuan.toLocaleString("id-ID")} orang.`,
    diktumKetiga: `Daftar Pemilih Tetap (DPT) sebagaimana dimaksud pada Diktum KESATU bersifat final dan mengikat serta tidak dapat diubah kembali kecuali karena adanya putusan pengadilan yang telah memperoleh kekuatan hukum tetap.`,
    diktumKeempat: `Keputusan ini mulai berlaku pada tanggal ditetapkan.`,
  };
}

/**
 * Format Lampiran XXXVIII: Surat Undangan Pemilih (C6) & Tanda Terima
 */
export function getSuratUndanganModelText(nomorSuratManual?: string) {
  const nomorDoc = formatNomorManual(nomorSuratManual, "...... / Pan Pilkades / ...... / ......");
  return {
    nomorSurat: `Nomor : ${nomorDoc}`,
    lampiran: "Lampiran : -",
    perihal: "Perihal : Undangan Pemungutan Suara",
    kalimatPembuka: "Mengharap dengan hormat atas kehadiran Bapak/Ibu/Saudara/Saudari besok pada:",
    catatanHadir: "Keterangan : Hadir dengan membawa Surat Undangan ini dan KTP-el / Suket",
    tandaTerimaLabel: "Tanda Terima Surat Undangan Pemilihan Kepala Desa",
  };
}
