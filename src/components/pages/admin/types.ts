export interface Voter {
  id: string;
  nik: string;
  nikMasked: string;
  kk: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  statusPerkawinan: "B" | "S" | "P";
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  tps: string;
  statusAktif: "AKTIF" | "TMS" | "MUTASI_KELUAR";
  tahap?: "DPS" | "DPT";
  alasanTms?: string;
  disabilitas?: string;
  coklitStatus?: "BELUM_COKLIT" | "SESUAI" | "UBAH_DATA" | "TMS" | "BARU";
  coklitTanggal?: string;
  coklitCatatan?: string;
  coklitPetugas?: string;
  updatedAt: string;
}

export interface Aduan {
  id: string;
  nomorAduan: string;
  namaPelapor: string;
  nik: string;
  nikMasked: string;
  kontakPelapor: string;
  rt: string;
  rw: string;
  jenisAduan: "BELUM_TERDAFTAR" | "DATA_SALAH" | "LAPOR_TMS" | "PINDAH_TPS" | "LAINNYA";
  isiAduan: string;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  catatanPetugas?: string;
  tanggal: string;
}

export interface TPSItem {
  id: string;
  kodeTps: string;
  nomorTps: string;
  namaTps: string;
  namaTabung?: string;
  lokasi: string;
  alamat: string;
  rt: string;
  rw: string;
  kuotaMaksimal: number;
  status: "AKTIF" | "NONAKTIF";
  totalPemilih?: number;
  laki?: number;
  perempuan?: number;
  sisaKuota?: number;
  persentaseTerisi?: number;
}

export type SeksiP2KDType =
  | "PIMPINAN"
  | "SEKSI_PEMILIH"
  | "SEKSI_PENJARINGAN"
  | "SEKSI_PENYARINGAN"
  | "SEKSI_PUNGUT_HITUNG"
  | "SEKSI_LOGISTIK_PUBLIKASI"
  | "PANTARLIH_LAPANGAN";

export interface AnggotaP2KD {
  id: string;
  namaLengkap: string;
  nik: string;
  jabatan: string;
  seksi: SeksiP2KDType;
  seksiLabel: string;
  username: string;
  role: string;
  kontakWa: string;
  alamatDusun: string;
  assignedTps?: string;
  status: "AKTIF" | "NONAKTIF";
  skPenetapan: string;
  fotoUrl?: string;
}

export interface AuditLog {
  id: string;
  waktu: string;
  user: string;
  role: string;
  aksi: string;
  entity: string;
  target: string;
  detail: string;
  ipAddress: string;
}

export interface DbStatus {
  provider: string;
  configured: boolean;
  connected: boolean;
  latencyMs: number | null;
  mode: string;
  maskedConnectionString: string;
  stats?: {
    totalPemilih: number;
    totalAktif: number;
    totalTms: number;
    totalTps: number;
    totalAduan: number;
  };
}

export interface VoterFormData {
  nik: string;
  kk: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  statusPerkawinan: "B" | "S" | "P";
  alamat: string;
  rt: string;
  rw: string;
  tps: string;
  statusAktif: "AKTIF" | "TMS";
  tahap?: "DPS" | "DPT";
  alasanTms: string;
}

export interface UserProfile {
  username: string;
  nama: string;
  role: string;
  seksi?: SeksiP2KDType;
  assignedTps?: string; // e.g. "TPS 001" or "001"
  isSuperAdmin: boolean;
}

export type TabType =
  | "dashboard"
  | "pemilih"
  | "dpt"
  | "coklit"
  | "aduan"
  | "tps"
  | "print"
  | "export"
  | "lock"
  | "anggota"
  | "audit"
  | "pengaturan_web"
  | "petugas_dpt";

