/**
 * Master Regulasi Pilkades Kabupaten Tegal
 * Sumber Hukum Acuan:
 * 1. Undang-Undang Nomor 6 Tahun 2014 tentang Desa
 * 2. Peraturan Pemerintah Nomor 43 Tahun 2014 jo PP Nomor 47 Tahun 2015
 * 3. Peraturan Menteri Dalam Negeri Nomor 112 Tahun 2014 jo Permendagri Nomor 65 Tahun 2017
 * 4. Peraturan Daerah Kabupaten Tegal Nomor 6 Tahun 2015 tentang Kepala Desa, Perangkat Desa dan BPD
 * 5. Peraturan Bupati Tegal Nomor 27 Tahun 2018 tentang Kepala Desa (Perbup Induk)
 * 6. Peraturan Bupati Tegal Nomor 31 Tahun 2019 tentang Perubahan Atas Perbup Tegal Nomor 27 Tahun 2018
 */

export interface RegulationMeta {
  id: string;
  nomor: string;
  tahun: number;
  tentang: string;
  tingkat: "NASIONAL" | "PROVINSI" | "KABUPATEN";
  instansi: string;
  tanggalPenetapan: string;
  statusHukum: "BERLAKU_PENUH" | "BERLAKU_DENGAN_PERUBAHAN" | "MENGUBAH" | "DICABUT";
  catatanLampiran: string;
}

export const REGULASI_KABUPATEN_TEGAL: Record<string, RegulationMeta> = {
  PERDA_6_2015: {
    id: "PERDA_6_2015",
    nomor: "Peraturan Daerah Kabupaten Tegal Nomor 6 Tahun 2015",
    tahun: 2015,
    tentang: "Kepala Desa, Perangkat Desa dan Badan Permusyawaratan Desa",
    tingkat: "KABUPATEN",
    instansi: "DPRD dan Bupati Tegal",
    tanggalPenetapan: "2015-11-20",
    statusHukum: "BERLAKU_PENUH",
    catatanLampiran: "Dasar hukum pokok pembentukan P2KD dan tahapan Pilkades di Kabupaten Tegal.",
  },
  PERBUP_27_2018: {
    id: "PERBUP_27_2018",
    nomor: "Peraturan Bupati Tegal Nomor 27 Tahun 2018",
    tahun: 2018,
    tentang: "Petunjuk Pelaksanaan Peraturan Daerah Kabupaten Tegal Nomor 6 Tahun 2015 tentang Tata Cara Pemilihan Kepala Desa",
    tingkat: "KABUPATEN",
    instansi: "Pemerintah Kabupaten Tegal",
    tanggalPenetapan: "2018-05-08",
    statusHukum: "BERLAKU_DENGAN_PERUBAHAN",
    catatanLampiran: "Aturan induk yang memuat 48 Lampiran Resmi (Lampiran I s.d. XLVIII) format surat, formulir, berita acara, dan SK Pilkades.",
  },
  PERBUP_31_2019: {
    id: "PERBUP_31_2019",
    nomor: "Peraturan Bupati Tegal Nomor 31 Tahun 2019",
    tahun: 2019,
    tentang: "Perubahan Atas Peraturan Bupati Tegal Nomor 27 Tahun 2018 tentang Kepala Desa",
    tingkat: "KABUPATEN",
    instansi: "Pemerintah Kabupaten Tegal",
    tanggalPenetapan: "2019-06-24",
    statusHukum: "MENGUBAH",
    catatanLampiran: "Tidak memuat lampiran baru; seluruh format lampiran resmi tetap berpedoman pada Perbup Tegal Nomor 27 Tahun 2018.",
  },
};
