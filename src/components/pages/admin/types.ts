export interface Voter {
  id: string;
  nik: string;
  nikMasked: string;
  kk: string;
  kkMasked?: string;
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
  tahap?: "DPS" | "DPT" | "DPTB";
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
  isActivated?: boolean;
  hasChangedPassword?: boolean;
  lastLoginAt?: string;
  loginCount?: number;
}

export interface AuditLog {
  id: string;
  waktu: string;
  createdAt?: string;
  user: string;
  role: string;
  aksi: string;
  entity: string;
  target: string;
  detail: string;
  ipAddress: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  kategori?: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  signature?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
}

export interface DbStatus {
  provider: string;
  configured: boolean;
  connected: boolean;
  latencyMs: number | null;
  mode: string;
  maskedConnectionString?: string;
  cloudStats?: {
    pemilihCount?: number;
    anggotaCount?: number;
    tpsCount?: number;
    petugasCount?: number;
  };
  localStats?: {
    calonDps?: number;
    dps?: number;
    dpt?: number;
    pemilihTambahan?: number;
    coklitSelesai?: number;
    totalPemilih?: number;
    totalAktif?: number;
    totalLaki?: number;
    totalPerempuan?: number;
    totalTms?: number;
    totalDps?: number;
    totalDpt?: number;
    totalWilayah?: number;
    totalTps?: number;
    totalAduan?: number;
    totalPetugas?: number;
    totalAnggota?: number;
    totalAudit?: number;
    breakdownWilayah?: Array<{
      rw: string;
      nama: string;
      lokasi: string;
      total: number;
      laki: number;
      perempuan: number;
      kuotaMaksimal: number;
      rt?: string;
    }>;
    tpsStats?: Array<{
      id?: string;
      tps?: string;
      nomorTps?: string;
      namaTps: string;
      lokasi?: string;
      total: number;
      aktif?: number;
      laki?: number;
      perempuan?: number;
      tms?: number;
      kuotaMaksimal?: number;
      rt?: string;
      rw?: string;
    }>;
  };
  tahapan?: {
    isDptLocked: boolean;
    lockHashSignature?: string;
    nomorBeritaAcara?: string;
  };
}

export type DbStatusData = DbStatus;

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

export interface KandidatKades {
  id: string;
  nomorUrut: number;
  namaLengkap: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  tempatTanggalLahir: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  tagline: string;
  visi: string;
  misi: string[];
  programUnggulan: string[];
  fotoUrl: string;
  warnaTema: string;
  statusVerifikasi: string;
}

export type TabType =
  | "dashboard"
  | "pemilih"
  | "dpt"
  | "coklit"
  | "akun"
  | "aduan"
  | "tps"
  | "print"
  | "export"
  | "lock"
  | "anggota"
  | "calon"
  | "audit"
  | "pengaturan_web"
  | "petugas_dpt"
  | "berita";


