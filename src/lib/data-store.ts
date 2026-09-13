import crypto from "crypto";
import { maskNIK, maskKK } from "./encryption";
import { SupabaseDbService } from "./supabase-db";
import { getAutoTabungByRtRw } from "./kalisalak-wilayah";

export interface MasterPemilih {
  id: string;
  nik: string; // Plain NIK for petugas view or encrypted in db
  nikMasked: string;
  kk: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  jenisKelamin: "L" | "P";
  statusPerkawinan: "B" | "S" | "P";
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  tps: string; // e.g. "001" or "TPS 001"
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

export interface MasterAduan {
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
  tanggalDisetujui?: string;
}

export interface PublicWebConfig {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  lokasiUtama: string;
  lokasiMapsUrl: string;
  periodeMasaBakti: string;
  hariHTanggal: string;
  runningText: string;
  isRunningTextActive: boolean;
  isCekHakPilihOpen: boolean;
  isProfilCalonVisible: boolean;
  isRealCountPublic: boolean;
  isAduanOpen: boolean;
  kontakWaP2kd: string;
  jamLayanan: string;
  alamatSekretariat: string;
  totalRw: number;
  totalRt: number;
  skP2KD?: string;
  skPenetapanBalon?: string;
  skPenetapanCalon?: string;
  skPenetapanDPT?: string;
  perbupPilkades?: string;
}

export interface MasterPengumuman {
  id: string;
  nomor: string;
  judul: string;
  kategori: string;
  tanggal: string;
  ringkasan: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterTPS {
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
}

export interface MasterKandidat {
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
  statusVerifikasi: "TERDAFTAR" | "MS" | "DITETAPKAN";
}

export interface MasterTpsVoteCount {
  tpsId: string;
  nomorTps: string;
  namaTps: string;
  lokasi: string;
  totalDpt: number;
  suaraMasuk: number;
  suaraSah: number;
  suaraTidakSah: number;
  suaraKandidat: Record<number, number>; // nomorUrut -> jumlah suara
  statusPlenoTps: "BELUM" | "SELESAI";
  waktuInput?: string;
  petugasInput?: string;
}

export interface MasterAnggotaP2KD {
  id: string;
  namaLengkap: string;
  nik: string;
  jabatan: string;
  seksi: "PIMPINAN" | "SEKSI_PEMILIH" | "SEKSI_PENJARINGAN" | "SEKSI_PENYARINGAN" | "SEKSI_PUNGUT_HITUNG" | "SEKSI_LOGISTIK_PUBLIKASI" | "PANTARLIH_LAPANGAN";
  seksiLabel: string;
  username: string;
  role: string;
  kontakWa: string;
  alamatDusun: string;
  assignedTps?: string;
  status: "AKTIF" | "NONAKTIF";
  skPenetapan: string;
  fotoUrl?: string;
  passwordHash?: string;
}

export interface MasterBalonPenjaringan {
  id: string;
  namaLengkap: string;
  nik: string;
  tempatTanggalLahir: string;
  alamatDomisili: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  tanggalPendaftaran: string;
  statusBerkas: "LENGKAP" | "BELUM_LENGKAP" | "DITOLAK";
  kelengkapan: {
    suratLamaran: boolean;
    ktpDanKk: boolean;
    ijazahLegalisir: boolean;
    skck: boolean;
    bebasNarkoba: boolean;
    keteranganSehat: boolean;
    keteranganPengadilan: boolean;
    pernyataanSetia: boolean;
  };
  catatanPenjaringan?: string;
}

export type PetugasStatus =
  | "MENUNGGU_VERIFIKASI"
  | "PERLU_KLARIFIKASI"
  | "LOLOS"
  | "TIDAK_LOLOS"
  | "DITETAPKAN";

export interface MasterPetugasDpt {
  id: string;
  nomorRegistrasi: string; // PTG-KLS-2026-00001
  nik: string;
  nikMasked: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  jenisKelamin: "L" | "P";
  noKk: string;
  noKkMasked: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  nomorWa: string;
  // Pertanyaan Wajib Netralitas & Kepentingan
  isCalonKades: boolean;
  keteranganCalonKades?: string;
  isTimSukses: boolean;
  keteranganTimSukses?: string;
  isKepentinganCalon: boolean;
  keteranganKepentingan?: string;
  // Surat Pernyataan & Tanda Tangan
  persetujuanPernyataan: boolean;
  tandaTanganUrl: string; // Base64 data PNG
  // Status Panitia & Verifikasi
  status: PetugasStatus;
  catatanPanitia?: string;
  assignedWilayah?: string; // e.g. "RW 01" / "RW 05"
  tanggalPendaftaran: string; // YYYY-MM-DD HH:mm:ss atau ISO
  updatedAt: string;
}

export interface AuditLogItem {
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

export interface SystemTahapan {
  dpsStatus: "SELESAI" | "AKTIF" | "DRAFT";
  dpshpStatus: "SELESAI" | "AKTIF" | "DRAFT";
  dptStatus: "DRAFT" | "FINAL" | "DIKUNCI";
  isDptLocked: boolean;
  lockTimestamp?: string;
  lockHashSignature?: string;
  lockedBy?: string;
  nomorBeritaAcara?: string;
}

// Runtime Dynamic Store (Exclusively Powered by Supabase Cloud Database)
class SystemDataStore {
  private static instance: SystemDataStore;

  private pemilihList: MasterPemilih[] = [];
  private aduanList: MasterAduan[] = [];
  private tpsList: MasterTPS[] = [];
  private kandidatList: MasterKandidat[] = [];
  private tpsVoteCounts: MasterTpsVoteCount[] = [];
  private anggotaList: MasterAnggotaP2KD[] = [];
  private balonList: MasterBalonPenjaringan[] = [];
  private pengumumanList: MasterPengumuman[] = [];
  private auditLogs: AuditLogItem[] = [];
  private isSupabaseSynced = false;
  private tahapanState: SystemTahapan = {
    dpsStatus: "SELESAI",
    dpshpStatus: "AKTIF",
    dptStatus: "DRAFT",
    isDptLocked: false,
    nomorBeritaAcara: "BA/01/P2KD-KLS/XII/2026",
  };

  private webConfig: PublicWebConfig = {
    namaDesa: "Kalisalak",
    kecamatan: "Margasari",
    kabupaten: "Tegal",
    provinsi: "Jawa Tengah",
    lokasiUtama: "Desa Kalisalak",
    lokasiMapsUrl: "https://www.google.com/maps/search/?api=1&query=Desa+Kalisalak+Margasari+Tegal",
    periodeMasaBakti: "2027 – 2035",
    hariHTanggal: "Rabu, 3 Februari 2027",
    runningText: "Pemberitahuan Resmi P2KD: Seluruh rangkaian pemungutan dan penghitungan suara Pilkades Desa Kalisalak diselenggarakan pada hari Rabu, 3 Februari 2027. Mohon membawa KTP-el dan Undangan Memilih.",
    isRunningTextActive: true,
    isCekHakPilihOpen: true,
    isProfilCalonVisible: true,
    isRealCountPublic: false,
    isAduanOpen: true,
    kontakWaP2kd: "087830188452",
    jamLayanan: "Senin – Kamis (08:00 – 13:00 WIB), Jum'at (08.00 - 11.00 WIB), Sabtu - Minggu (Libur)",
    alamatSekretariat: "Kantor Balai Desa Kalisalak, Jl. Raya Kalisalak No. 01, Kec. Margasari, Kab. Tegal",
    totalRw: 13,
    totalRt: 39,
    skP2KD: "Keputusan BPD Desa Kalisalak No. 04/BPD-KLS/VII/2026",
    skPenetapanBalon: "Keputusan P2KD No. 05/P2KD-KLS/VIII/2026",
    skPenetapanCalon: "Keputusan P2KD No. 06/P2KD-KLS/IX/2026",
    skPenetapanDPT: "Berita Acara & Keputusan P2KD No. 07/BA-DPT/X/2026",
    perbupPilkades: "Perda No. 2/2015 & Perbup Tegal No. 27/2018 jo PP No. 16/2026",
  };

  private petugasDptList: MasterPetugasDpt[] = [];

  private constructor() {
    this.syncWithSupabase();
  }

  public static getInstance(): SystemDataStore {
    if (!SystemDataStore.instance) {
      SystemDataStore.instance = new SystemDataStore();
    }
    return SystemDataStore.instance;
  }

  private syncPromise: Promise<void> | null = null;

  public async ensureSynced(forceRefresh = false): Promise<void> {
    if (!forceRefresh && this.isSupabaseSynced && this.anggotaList.length > 0 && this.pemilihList.length > 0) {
      return;
    }
    if (!this.syncPromise) {
      this.syncPromise = this.syncWithSupabase().finally(() => {
        this.syncPromise = null;
      });
    }
    await this.syncPromise;
  }

  public async syncWithSupabase() {
    try {
      const res = await SupabaseDbService.fetchAllData();
      if (res.success && res.data) {
        if (res.data.tpsList) this.tpsList = res.data.tpsList;
        if (res.data.pemilihList) this.pemilihList = res.data.pemilihList;
        if (res.data.anggotaList) this.anggotaList = res.data.anggotaList;
        if (res.data.balonList) this.balonList = res.data.balonList;
        if (res.data.kandidatList) this.kandidatList = res.data.kandidatList;
        if (res.data.tpsVoteCounts) this.tpsVoteCounts = res.data.tpsVoteCounts;
        if (res.data.aduanList) this.aduanList = res.data.aduanList;
        if (res.data.pengumumanList) this.pengumumanList = res.data.pengumumanList;
        if (res.data.auditLogs) this.auditLogs = res.data.auditLogs;
        if (res.data.tahapanState) this.tahapanState = res.data.tahapanState;
        if (res.data.webConfig) this.webConfig = { ...this.webConfig, ...res.data.webConfig };
        if (res.data.petugasDptList) this.petugasDptList = res.data.petugasDptList;
        this.isSupabaseSynced = true;
      }
    } catch (err) {
      console.warn("⚠️ Sinkronisasi Database tertunda:", err);
    }
  }

  public isCloudConnected() {
    return this.isSupabaseSynced;
  }

  // --- PENGUMUMAN METHODS ---
  public getPengumumanList(): MasterPengumuman[] {
    return [...this.pengumumanList];
  }

  public getPengumumanById(id: string): MasterPengumuman | undefined {
    return this.pengumumanList.find((p) => p.id === id);
  }

  public insertPengumuman(
    data: Omit<MasterPengumuman, "id"> & { id?: string },
    user = "Admin P2KD"
  ): MasterPengumuman {
    const newPengumuman: MasterPengumuman = {
      id: data.id || `ann-${Date.now()}`,
      nomor: data.nomor,
      judul: data.judul,
      kategori: data.kategori,
      tanggal: data.tanggal || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      ringkasan: data.ringkasan,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pengumumanList.unshift(newPengumuman);

    SupabaseDbService.insertPengumuman(newPengumuman).catch((err) =>
      console.warn("Supabase insertPengumuman async failed:", err)
    );

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "CREATE_PENGUMUMAN",
      entity: "PENGUMUMAN_RESMI",
      target: newPengumuman.judul,
      detail: `Menambahkan pengumuman resmi No: ${newPengumuman.nomor} (${newPengumuman.kategori}).`,
      ipAddress: "127.0.0.1",
    });

    return newPengumuman;
  }

  public updatePengumuman(
    id: string,
    data: Partial<MasterPengumuman>,
    user = "Admin P2KD"
  ): MasterPengumuman | null {
    const idx = this.pengumumanList.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    this.pengumumanList[idx] = {
      ...this.pengumumanList[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const updated = this.pengumumanList[idx];

    SupabaseDbService.updatePengumuman(id, updated).catch((err) =>
      console.warn("Supabase updatePengumuman async failed:", err)
    );

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "UPDATE_PENGUMUMAN",
      entity: "PENGUMUMAN_RESMI",
      target: updated.judul,
      detail: `Memperbarui pengumuman resmi ID: ${id} (${updated.nomor}).`,
      ipAddress: "127.0.0.1",
    });

    return updated;
  }

  public deletePengumuman(id: string, user = "Admin P2KD"): boolean {
    const existing = this.pengumumanList.find((p) => p.id === id);
    if (!existing) return false;

    this.pengumumanList = this.pengumumanList.filter((p) => p.id !== id);

    SupabaseDbService.deletePengumuman(id).catch((err) =>
      console.warn("Supabase deletePengumuman async failed:", err)
    );

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "DELETE_PENGUMUMAN",
      entity: "PENGUMUMAN_RESMI",
      target: existing.judul,
      detail: `Menghapus pengumuman resmi ID: ${id} (${existing.nomor}).`,
      ipAddress: "127.0.0.1",
    });

    return true;
  }

  // --- PUBLIC WEB CONFIG METHODS ---
  public getWebConfig(): PublicWebConfig {
    return { ...this.webConfig };
  }

  public updateWebConfig(data: Partial<PublicWebConfig>, user = "Admin P2KD"): PublicWebConfig {
    this.webConfig = {
      ...this.webConfig,
      ...data,
    };

    SupabaseDbService.saveWebConfig(this.webConfig).catch((err) =>
      console.warn("Supabase saveWebConfig async failed:", err)
    );

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "CONFIG_UPDATE",
      entity: "PENGATURAN_WEB",
      target: "Website Publik P2KD",
      detail: `Memperbarui konfigurasi website publik: Lokasi: ${this.webConfig.lokasiUtama}, RunningText: ${this.webConfig.isRunningTextActive ? "Aktif" : "Mati"}.`,
      ipAddress: "127.0.0.1",
    });

    return { ...this.webConfig };
  }

  // --- PEMILIH METHODS ---
  public getPemilihList(filter?: { tps?: string; status?: string; search?: string }) {
    let result = [...this.pemilihList];

    if (filter?.tps && filter.tps !== "SEMUA") {
      const targetTps = filter.tps.toLowerCase().trim();
      const targetNum = targetTps.replace(/\D/g, "");
      result = result.filter((p) => {
        const pTps = p.tps.toLowerCase();
        const pNum = pTps.replace(/\D/g, "");
        return (
          pTps.includes(targetTps) ||
          targetTps.includes(pTps) ||
          (targetNum && pNum && parseInt(targetNum, 10) === parseInt(pNum, 10))
        );
      });
    }

    if (filter?.status && filter.status !== "SEMUA") {
      result = result.filter((p) => p.statusAktif === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      const cleanDigits = q.replace(/\D/g, "");
      result = result.filter((p) => {
        const matchName = p.namaLengkap.toLowerCase().includes(q);
        const matchNik = p.nik.includes(q) || (cleanDigits && p.nik.replace(/\D/g, "").includes(cleanDigits));
        const matchKk = p.kk.includes(q) || (cleanDigits && p.kk.replace(/\D/g, "").includes(cleanDigits));
        const matchAlamat = p.alamat.toLowerCase().includes(q);
        const matchRt = p.rt.includes(q) || `rt ${p.rt}`.includes(q) || `rt.${p.rt}`.includes(q);
        const matchRw = p.rw.includes(q) || `rw ${p.rw}`.includes(q) || `rw.${p.rw}`.includes(q);
        const matchTps = p.tps.toLowerCase().includes(q);
        const matchLahir = p.tempatLahir.toLowerCase().includes(q) || p.tanggalLahir.includes(q);

        return matchName || matchNik || matchKk || matchAlamat || matchRt || matchRw || matchTps || matchLahir;
      });
    }

    return result;
  }

  public findPemilihByNik(nik: string) {
    if (!nik) return undefined;
    const clean = String(nik).replace(/\D/g, "").trim();
    return this.pemilihList.find((p) => p.nik.replace(/\D/g, "").trim() === clean || p.nik === nik);
  }

  public findPemilihById(id: string) {
    return this.pemilihList.find((p) => p.id === id);
  }

  public getPemilihById(id: string) {
    return this.findPemilihById(id);
  }

  public addPemilih(
    data: Omit<MasterPemilih, "id" | "nikMasked" | "updatedAt">,
    user = "Petugas P2KD"
  ) {
    if (this.tahapanState.isDptLocked) {
      throw new Error("DPT telah dikunci dan disegel. Tidak dapat menambah pemilih baru.");
    }

    const resolvedTps = data.tps || getAutoTabungByRtRw(data.rw, data.rt, this.tpsList);
    const newId = `pml-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newPemilih: MasterPemilih = {
      ...data,
      tps: resolvedTps,
      id: newId,
      nikMasked: maskNIK(data.nik),
      updatedAt: new Date().toISOString(),
    };

    this.pemilihList.push(newPemilih);

    // Sync to Supabase Cloud
    SupabaseDbService.insertPemilih(newPemilih);

    this.addAuditLog({
      user,
      role: "OPERATOR",
      aksi: "TAMBAH_PEMILIH",
      entity: "PEMILIH",
      target: `${newPemilih.namaLengkap} (${newPemilih.nikMasked})`,
      detail: `Menambahkan pemilih baru ke ${newPemilih.tps}.`,
      ipAddress: "127.0.0.1",
    });

    return newPemilih;
  }

  public updatePemilih(
    id: string,
    data: Partial<MasterPemilih>,
    user = "Petugas P2KD",
    alasan = "Perbaikan data manual oleh petugas"
  ) {
    if (this.tahapanState.isDptLocked) {
      throw new Error("DPT telah dikunci dan disegel. Tidak dapat mengubah data pemilih.");
    }

    const idx = this.pemilihList.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const existing = this.pemilihList[idx];
    const updated: MasterPemilih = {
      ...existing,
      ...data,
      nikMasked: data.nik ? maskNIK(data.nik) : existing.nikMasked,
      updatedAt: new Date().toISOString(),
    };

    this.pemilihList[idx] = updated;

    // Sync to Supabase Cloud
    SupabaseDbService.updatePemilih(id, data);

    this.addAuditLog({
      user,
      role: "OPERATOR",
      aksi: "UBAH_DATA_PEMILIH",
      entity: "PEMILIH",
      target: `${updated.namaLengkap} (${updated.nikMasked})`,
      detail: `Pembaruan data pemilih di ${updated.tps}. Alasan: ${alasan}`,
      ipAddress: "127.0.0.1",
    });

    return updated;
  }

  public setPemilihTms(
    id: string,
    alasan: string,
    user = "Petugas P2KD"
  ) {
    if (this.tahapanState.isDptLocked) {
      throw new Error("DPT telah dikunci. Tidak dapat menandai TMS.");
    }

    const idx = this.pemilihList.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    this.pemilihList[idx].statusAktif = "TMS";
    this.pemilihList[idx].alasanTms = alasan;
    this.pemilihList[idx].coklitStatus = "TMS";
    this.pemilihList[idx].updatedAt = new Date().toISOString();

    // Sync to Supabase Cloud
    SupabaseDbService.updatePemilih(id, { statusAktif: "TMS", alasanTms: alasan, coklitStatus: "TMS" });

    this.addAuditLog({
      user,
      role: "OPERATOR",
      aksi: "SET_TMS",
      entity: "PEMILIH",
      target: `${this.pemilihList[idx].namaLengkap} (${this.pemilihList[idx].nikMasked})`,
      detail: `Status pemilih diubah menjadi Tidak Memenuhi Syarat: ${alasan}.`,
      ipAddress: "127.0.0.1",
    });

    return this.pemilihList[idx];
  }

  public markTMS(id: string, alasan: string, user = "Petugas P2KD") {
    return this.setPemilihTms(id, alasan, user);
  }

  public async deletePemilih(id: string, user = "Petugas P2KD"): Promise<boolean> {
    const idx = this.pemilihList.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const target = this.pemilihList[idx];
    this.pemilihList.splice(idx, 1);

    // Sync to Supabase Cloud
    await SupabaseDbService.deletePemilih(id);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "DELETE_PEMILIH",
      entity: "PEMILIH",
      target: `${target.namaLengkap} (${target.nikMasked})`,
      detail: `Menghapus data pemilih secara permanen dari ${target.tps}.`,
      ipAddress: "127.0.0.1",
    });

    return true;
  }

  public mutasiTpsPemilih(
    id: string,
    tpsTujuan: string,
    alasan: string,
    user = "Petugas P2KD"
  ) {
    if (this.tahapanState.isDptLocked) {
      throw new Error("DPT telah dikunci. Tidak dapat memindahkan TPS.");
    }

    const idx = this.pemilihList.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const tpsAsal = this.pemilihList[idx].tps;
    this.pemilihList[idx].tps = tpsTujuan;
    this.pemilihList[idx].updatedAt = new Date().toISOString();

    // Sync to Supabase Cloud
    SupabaseDbService.updatePemilih(id, { tps: tpsTujuan });

    this.addAuditLog({
      user,
      role: "OPERATOR",
      aksi: "PINDAH_TPS",
      entity: "PEMILIH",
      target: `${this.pemilihList[idx].namaLengkap} (${this.pemilihList[idx].nikMasked})`,
      detail: `Mutasi pemilih dari ${tpsAsal} ke ${tpsTujuan}. Alasan: ${alasan}.`,
      ipAddress: "127.0.0.1",
    });

    return this.pemilihList[idx];
  }

  public updateCoklitStatus(
    id: string,
    status: "SESUAI" | "UBAH_DATA" | "TMS" | "BELUM_COKLIT",
    catatan = "",
    petugas = "Koordinator RW"
  ) {
    const idx = this.pemilihList.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const todayStr = new Date().toISOString().split("T")[0];
    this.pemilihList[idx].coklitStatus = status;
    this.pemilihList[idx].coklitTanggal = status === "BELUM_COKLIT" ? undefined : todayStr;
    this.pemilihList[idx].coklitCatatan = catatan || undefined;
    this.pemilihList[idx].coklitPetugas = status === "BELUM_COKLIT" ? undefined : petugas;
    this.pemilihList[idx].updatedAt = new Date().toISOString();

    if (status === "TMS") {
      this.pemilihList[idx].statusAktif = "TMS";
      this.pemilihList[idx].alasanTms = catatan || "Dinyatakan TMS saat Coklit Lapangan";
    } else if (status === "SESUAI" || status === "UBAH_DATA") {
      this.pemilihList[idx].statusAktif = "AKTIF";
      this.pemilihList[idx].tahap = "DPT";
    }

    // Sync to Supabase Cloud
    SupabaseDbService.updateCoklitStatus(id, status, catatan, petugas);

    this.addAuditLog({
      user: petugas,
      role: "KOORDINATOR_RW / PETUGAS",
      aksi: "COKLIT_STATUS_UPDATE",
      entity: "PEMILIH",
      target: `${this.pemilihList[idx].namaLengkap} (${this.pemilihList[idx].nikMasked})`,
      detail: `Status Coklit diubah menjadi ${status}. Catatan: ${catatan || "-"}`,
      ipAddress: "127.0.0.1",
    });

    return this.pemilihList[idx];
  }

  public pindahTPS(
    id: string,
    tpsBaru: string,
    rtBaru = "01",
    rwBaru = "01",
    user = "Petugas P2KD"
  ) {
    const idx = this.pemilihList.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    this.pemilihList[idx].tps = tpsBaru;
    this.pemilihList[idx].rt = rtBaru;
    this.pemilihList[idx].rw = rwBaru;
    this.pemilihList[idx].updatedAt = new Date().toISOString();

    // Sync to Supabase Cloud
    SupabaseDbService.updatePemilih(id, { tps: tpsBaru, rt: rtBaru, rw: rwBaru });

    this.addAuditLog({
      user,
      role: "OPERATOR",
      aksi: "PINDAH_TPS",
      entity: "PEMILIH",
      target: `${this.pemilihList[idx].namaLengkap} (${this.pemilihList[idx].nikMasked})`,
      detail: `Pemilih dipindahkan ke ${tpsBaru} RT ${rtBaru}/RW ${rwBaru}.`,
      ipAddress: "127.0.0.1",
    });

    return this.pemilihList[idx];
  }

  public batchImportPemilih(voters: Array<Omit<MasterPemilih, "id" | "nikMasked" | "updatedAt">>, user = "Petugas P2KD") {
    let totalSuccess = 0;
    let totalDuplicate = 0;

    for (const v of voters) {
      if (this.findPemilihByNik(v.nik)) {
        totalDuplicate++;
        continue;
      }
      this.addPemilih(v, user);
      totalSuccess++;
    }

    return { totalSuccess, totalDuplicate, totalInput: voters.length };
  }

  public getCoklitStats(tpsFilter?: string) {
    let voters = this.pemilihList.filter((p) => p.statusAktif === "AKTIF");
    if (tpsFilter && tpsFilter !== "SEMUA") {
      voters = voters.filter((p) => p.tps.toLowerCase().includes(tpsFilter.toLowerCase()));
    }

    const total = voters.length;
    const sesuai = voters.filter((p) => p.coklitStatus === "SESUAI").length;
    const ubahData = voters.filter((p) => p.coklitStatus === "UBAH_DATA").length;
    const tms = voters.filter((p) => p.coklitStatus === "TMS").length;
    const baru = voters.filter((p) => p.coklitStatus === "BARU").length;
    const belum = total - (sesuai + ubahData + tms + baru);

    return {
      total,
      sesuai,
      ubahData,
      tms,
      baru,
      belum: Math.max(0, belum),
      progress: total > 0 ? Math.round(((sesuai + ubahData + tms + baru) / total) * 100) : 0,
    };
  }

  // --- ADUAN METHODS ---
  public getAduanList(status?: string) {
    if (!status || status === "SEMUA") {
      return [...this.aduanList];
    }
    return this.aduanList.filter((a) => a.status === status);
  }

  public addAduan(data: {
    nama?: string;
    namaPelapor?: string;
    nik: string;
    kontak?: string;
    kontakPelapor?: string;
    rt: string;
    rw: string;
    jenis?: MasterAduan["jenisAduan"];
    jenisAduan?: MasterAduan["jenisAduan"];
    pesan?: string;
    isiAduan?: string;
  }) {
    const newId = `adu-${Date.now().toString(36)}`;
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const nomorAduan = `ADU-KLS-${randomNum}`;

    const namaPelapor = data.namaPelapor || data.nama || "Warga Kalisalak";
    const kontakPelapor = data.kontakPelapor || data.kontak || "-";
    const jenisAduan = data.jenisAduan || data.jenis || "BELUM_TERDAFTAR";
    const isiAduan = data.isiAduan || data.pesan || "-";

    const newAduan: MasterAduan = {
      id: newId,
      nomorAduan,
      namaPelapor,
      nik: data.nik,
      nikMasked: maskNIK(data.nik),
      kontakPelapor,
      rt: data.rt,
      rw: data.rw,
      jenisAduan,
      isiAduan,
      status: "MENUNGGU",
      tanggal: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    };

    this.aduanList.unshift(newAduan);

    // Sync to Supabase Cloud
    SupabaseDbService.insertAduan(newAduan);

    this.addAuditLog({
      user: namaPelapor,
      role: "WARGA_PUBLIK",
      aksi: "SUBMIT_ADUAN",
      entity: "ADUAN",
      target: nomorAduan,
      detail: `Masukan masyarakat jenis: ${jenisAduan}. RT ${data.rt}/RW ${data.rw}.`,
      ipAddress: "127.0.0.1",
    });

    return newAduan;
  }

  public resolveAduan(
    id: string,
    status: "DISETUJUI" | "DITOLAK",
    catatan: string,
    user = "Petugas P2KD",
    autoUpdateMaster = true
  ) {
    const idx = this.aduanList.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    this.aduanList[idx].status = status;
    this.aduanList[idx].catatanPetugas = catatan;
    this.aduanList[idx].tanggalDisetujui = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

    // Sync to Supabase Cloud
    SupabaseDbService.updateAduan(id, status, catatan);

    this.addAuditLog({
      user,
      role: "SEKSI_PEMILIH",
      aksi: status === "DISETUJUI" ? "VERIFIKASI_ADUAN_TERIMA" : "VERIFIKASI_ADUAN_TOLAK",
      entity: "ADUAN",
      target: `${this.aduanList[idx].nomorAduan} (${this.aduanList[idx].namaPelapor})`,
      detail: `Status tanggapan diubah menjadi ${status}. Catatan: ${catatan}. AutoUpdate: ${autoUpdateMaster}`,
      ipAddress: "127.0.0.1",
    });

    return this.aduanList[idx];
  }

  // --- TPS METHODS ---
  public getTpsList() {
    return [...this.tpsList];
  }

  public addTps(data: Omit<MasterTPS, "id">, user = "Petugas P2KD") {
    const newId = `tps-${Date.now().toString(36)}`;
    const newTps: MasterTPS = {
      ...data,
      id: newId,
    };
    this.tpsList.push(newTps);

    // Sync to Supabase Cloud
    SupabaseDbService.insertTps(newTps);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "TPS_CREATE",
      entity: "TPS",
      target: `${newTps.namaTps} (${newTps.nomorTps})`,
      detail: `Menambahkan TPS baru di ${newTps.lokasi}. Kuota: ${newTps.kuotaMaksimal}.`,
      ipAddress: "127.0.0.1",
    });

    return newTps;
  }

  public updateTps(id: string, data: Partial<MasterTPS>, user = "Petugas P2KD") {
    const idx = this.tpsList.findIndex((t) => t.id === id || t.nomorTps === id);
    if (idx === -1) return null;

    const updated = {
      ...this.tpsList[idx],
      ...data,
    };
    this.tpsList[idx] = updated;

    // Sync to Supabase Cloud
    SupabaseDbService.updateTps(this.tpsList[idx].id, data);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "TPS_UPDATE",
      entity: "TPS",
      target: `${updated.namaTps} (${updated.nomorTps})`,
      detail: `Pembaruan data master TPS di ${updated.lokasi}.`,
      ipAddress: "127.0.0.1",
    });

    return updated;
  }

  public async deleteTps(id: string, user = "admin_kalisalak"): Promise<{ success: boolean; message: string }> {
    const idx = this.tpsList.findIndex((t) => t.id === id);
    if (idx === -1) return { success: false, message: "TPS tidak ditemukan." };

    const target = this.tpsList[idx];
    const assignedVoters = this.pemilihList.filter((p) => p.tps === target.nomorTps);

    if (assignedVoters.length > 0) {
      return {
        success: false,
        message: `Gagal menghapus TPS ${target.nomorTps}: Masih terdapat ${assignedVoters.length} pemilih terdaftar di TPS ini.`,
      };
    }

    this.tpsList.splice(idx, 1);

    // Sync to Supabase Cloud
    await SupabaseDbService.deleteTps(target.id);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "TPS_DELETE",
      entity: "TPS",
      target: `${target.namaTps} (${target.nomorTps})`,
      detail: `Menghapus master TPS ${target.namaTps}.`,
      ipAddress: "127.0.0.1",
    });

    return { success: true, message: `TPS ${target.namaTps} berhasil dihapus.` };
  }

  // --- KANDIDAT METHODS ---
  public getKandidatList(): MasterKandidat[] {
    return [...this.kandidatList];
  }

  public addKandidat(data: Omit<MasterKandidat, "id">, user = "Panitia P2KD") {
    const newId = `knd-${Date.now().toString(36)}`;
    const newKandidat: MasterKandidat = {
      ...data,
      id: newId,
    };
    this.kandidatList.push(newKandidat);
    this.kandidatList.sort((a, b) => a.nomorUrut - b.nomorUrut);

    // Sync to Supabase Cloud
    SupabaseDbService.insertKandidat(newKandidat);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "KANDIDAT_CREATE",
      entity: "KANDIDAT",
      target: `No. ${newKandidat.nomorUrut} - ${newKandidat.namaLengkap}`,
      detail: `Penetapan calon Kades nomor urut ${newKandidat.nomorUrut}: ${newKandidat.namaLengkap}.`,
      ipAddress: "127.0.0.1",
    });

    return newKandidat;
  }

  public updateKandidat(id: string, data: Partial<MasterKandidat>, user = "Panitia P2KD") {
    const idx = this.kandidatList.findIndex((k) => k.id === id || k.nomorUrut === Number(id));
    if (idx === -1) return null;

    const updated = {
      ...this.kandidatList[idx],
      ...data,
    };
    this.kandidatList[idx] = updated;
    this.kandidatList.sort((a, b) => a.nomorUrut - b.nomorUrut);

    // Sync to Supabase Cloud
    SupabaseDbService.updateKandidat(this.kandidatList[idx].id, data);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "KANDIDAT_UPDATE",
      entity: "KANDIDAT",
      target: `No. ${updated.nomorUrut} - ${updated.namaLengkap}`,
      detail: `Pembaruan profil calon Kades nomor urut ${updated.nomorUrut}.`,
      ipAddress: "127.0.0.1",
    });

    return updated;
  }

  public deleteKandidat(id: string, user = "Panitia P2KD") {
    const idx = this.kandidatList.findIndex((k) => k.id === id || k.nomorUrut === Number(id));
    if (idx === -1) return false;

    const target = this.kandidatList[idx];
    this.kandidatList.splice(idx, 1);

    // Sync to Supabase Cloud
    SupabaseDbService.deleteKandidat(target.id);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "KANDIDAT_DELETE",
      entity: "KANDIDAT",
      target: `No. ${target.nomorUrut} - ${target.namaLengkap}`,
      detail: `Menghapus calon Kades nomor urut ${target.nomorUrut} (${target.namaLengkap}).`,
      ipAddress: "127.0.0.1",
    });

    return true;
  }

  // --- REAL COUNT METHODS ---
  public getTpsVoteCounts() {
    return [...this.tpsVoteCounts];
  }

  public updateTpsVoteCount(
    tpsIdOrNomor: string,
    data: {
      suaraMasuk?: number;
      suaraTidakSah: number;
      suaraKandidat: Record<number, number>;
      statusPlenoTps: "BELUM" | "SELESAI";
    },
    user = "Petugas KPPS"
  ) {
    const formattedNomor = tpsIdOrNomor.replace(/[^0-9]/g, "").padStart(3, "0");
    const idx = this.tpsVoteCounts.findIndex(
      (t) => t.tpsId === tpsIdOrNomor || t.nomorTps === formattedNomor || t.nomorTps === tpsIdOrNomor
    );
    if (idx === -1) return null;

    const existing = this.tpsVoteCounts[idx];
    const sah = Object.values(data.suaraKandidat).reduce((a, b) => a + Number(b || 0), 0);
    const masuk = data.suaraMasuk !== undefined ? data.suaraMasuk : sah + (Number(data.suaraTidakSah) || 0);
    const timestamp = new Date().toISOString();

    const updated: MasterTpsVoteCount = {
      ...existing,
      suaraMasuk: masuk,
      suaraSah: sah,
      suaraTidakSah: Number(data.suaraTidakSah) || 0,
      suaraKandidat: data.suaraKandidat,
      statusPlenoTps: data.statusPlenoTps,
      waktuInput: timestamp,
      petugasInput: user,
    };

    this.tpsVoteCounts[idx] = updated;

    // Sync to Supabase Cloud
    SupabaseDbService.updateVoteCount(existing.nomorTps, {
      suaraKandidat: data.suaraKandidat,
      suaraTidakSah: Number(data.suaraTidakSah) || 0,
      statusPlenoTps: data.statusPlenoTps,
    });

    this.addAuditLog({
      user,
      role: "PETUGAS_KPPS",
      aksi: "REAL_COUNT_SUBMIT",
      entity: "REAL_COUNT",
      target: `${updated.namaTps} (${updated.suaraMasuk} Suara)`,
      detail: `Input hasil pemungutan suara TPS: Sah = ${sah}, Rusak = ${data.suaraTidakSah}.`,
      ipAddress: "127.0.0.1",
    });

    return updated;
  }

  public getRealCountStats() {
    const totalDptDesa = this.tpsVoteCounts.reduce((acc, t) => acc + t.totalDpt, 0);
    const totalSuaraMasuk = this.tpsVoteCounts.reduce((acc, t) => acc + t.suaraMasuk, 0);
    const totalSuaraSah = this.tpsVoteCounts.reduce((acc, t) => acc + t.suaraSah, 0);
    const totalSuaraTidakSah = this.tpsVoteCounts.reduce((acc, t) => acc + t.suaraTidakSah, 0);
    const persentasePartisipasi = totalDptDesa > 0 ? Math.round((totalSuaraMasuk / totalDptDesa) * 100) : 0;
    const tpsMasukCount = this.tpsVoteCounts.filter((t) => t.statusPlenoTps === "SELESAI").length;

    const kandidatStats = this.kandidatList.map((k) => {
      const candidateVotes = this.tpsVoteCounts.reduce((acc, t) => {
        return acc + (t.suaraKandidat[k.nomorUrut] || 0);
      }, 0);

      const persentase = totalSuaraSah > 0 ? Math.round((candidateVotes / totalSuaraSah) * 1000) / 10 : 0;

      return {
        nomorUrut: k.nomorUrut,
        namaLengkap: k.namaLengkap,
        tagline: k.tagline,
        fotoUrl: k.fotoUrl,
        warnaTema: k.warnaTema,
        totalSuara: candidateVotes,
        persentaseSuara: persentase,
      };
    });

    return {
      totalDptDesa,
      totalSuaraMasuk,
      totalSuaraSah,
      totalSuaraTidakSah,
      persentasePartisipasi,
      tpsMasukCount,
      totalTpsCount: this.tpsVoteCounts.length,
      kandidatStats,
    };
  }

  // --- ANGGOTA P2KD METHODS ---
  public getAnggotaList(seksiFilter?: string, includeHidden = false) {
    let list = this.anggotaList;
    if (!includeHidden) {
      list = list.filter(
        (a) => a.username.toLowerCase() !== "develzy" && a.role !== "DEVELOPER"
      );
    }
    if (!seksiFilter || seksiFilter === "SEMUA") {
      return [...list];
    }
    return list.filter((a) => a.seksi === seksiFilter || a.role === seksiFilter);
  }

  public getAnggotaById(id: string) {
    return this.anggotaList.find((a) => a.id === id);
  }

  public addAnggota(data: Omit<MasterAnggotaP2KD, "id">, user = "admin_kalisalak") {
    const newId = `agt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newAnggota: MasterAnggotaP2KD = {
      ...data,
      id: newId,
    };
    this.anggotaList.push(newAnggota);

    // Sync to Supabase Cloud
    SupabaseDbService.insertAnggota(newAnggota);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "ANGGOTA_CREATE",
      entity: "ANGGOTA_P2KD",
      target: `${newAnggota.namaLengkap} (${newAnggota.jabatan})`,
      detail: `Menambahkan anggota panitia P2KD baru: ${newAnggota.namaLengkap}, Seksi: ${newAnggota.seksiLabel}, Username: ${newAnggota.username}.`,
      ipAddress: "127.0.0.1",
    });

    return newAnggota;
  }

  public updateAnggota(id: string, data: Partial<MasterAnggotaP2KD>, user = "admin_kalisalak") {
    const idx = this.anggotaList.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const existing = this.anggotaList[idx];
    const updated: MasterAnggotaP2KD = {
      ...existing,
      ...data,
    };
    this.anggotaList[idx] = updated;

    // Sync to Supabase Cloud
    SupabaseDbService.updateAnggota(id, data);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "ANGGOTA_UPDATE",
      entity: "ANGGOTA_P2KD",
      target: `${updated.namaLengkap} (${updated.jabatan})`,
      detail: `Memperbarui data profil / kredensial anggota P2KD ${updated.namaLengkap}.`,
      ipAddress: "127.0.0.1",
    });

    return updated;
  }

  public async deleteAnggota(id: string, user = "admin_kalisalak"): Promise<boolean> {
    const idx = this.anggotaList.findIndex((a) => a.id === id);
    if (idx === -1) return false;

    const target = this.anggotaList[idx];
    this.anggotaList.splice(idx, 1);

    // Sync to Supabase Cloud
    await SupabaseDbService.deleteAnggota(id);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "ANGGOTA_DELETE",
      entity: "ANGGOTA_P2KD",
      target: `${target.namaLengkap} (${target.jabatan})`,
      detail: `Menghapus anggota P2KD ${target.namaLengkap} dari daftar kepanitiaan.`,
      ipAddress: "127.0.0.1",
    });

    return true;
  }

  public resetPasswordAnggota(id: string, user = "admin_kalisalak") {
    const agt = this.getAnggotaById(id);
    if (!agt) return null;

    const defaultPass = "p2kd2026";
    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "PASSWORD_RESET",
      entity: "ANGGOTA_P2KD",
      target: `${agt.namaLengkap} (${agt.username})`,
      detail: `Mereset kata sandi akun ${agt.username} ke default '${defaultPass}'.`,
      ipAddress: "127.0.0.1",
    });

    return { success: true, username: agt.username, defaultPassword: defaultPass };
  }

  // --- SEKSI PENJARINGAN METHODS ---
  public getBalonList() {
    return [...this.balonList];
  }

  public getBalonById(id: string) {
    return this.balonList.find((b) => b.id === id);
  }

  public addBalon(data: Omit<MasterBalonPenjaringan, "id">, user = "seksi_penjaringan") {
    const newId = `bln-${Date.now().toString(36)}`;
    const newBalon: MasterBalonPenjaringan = {
      ...data,
      id: newId,
    };
    this.balonList.push(newBalon);

    // Sync to Supabase Cloud
    SupabaseDbService.insertBalon(newBalon);

    this.addAuditLog({
      user,
      role: "SEKSI_PENJARINGAN",
      aksi: "BALON_REGISTER",
      entity: "PENJARINGAN",
      target: newBalon.namaLengkap,
      detail: `Menerima pendaftaran berkas bakal calon Kades: ${newBalon.namaLengkap}, NIK: ${newBalon.nik}.`,
      ipAddress: "127.0.0.1",
    });

    return newBalon;
  }

  public updateBalon(id: string, data: Partial<MasterBalonPenjaringan>, user = "seksi_penjaringan") {
    const idx = this.balonList.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const existing = this.balonList[idx];
    const updated: MasterBalonPenjaringan = {
      ...existing,
      ...data,
    };
    this.balonList[idx] = updated;

    // Sync to Supabase Cloud
    SupabaseDbService.updateBalon(id, data);

    this.addAuditLog({
      user,
      role: "SEKSI_PENJARINGAN",
      aksi: "BALON_UPDATE",
      entity: "PENJARINGAN",
      target: updated.namaLengkap,
      detail: `Memperbarui data pendaftaran berkas bakal calon Kades: ${updated.namaLengkap}.`,
      ipAddress: "127.0.0.1",
    });

    return updated;
  }

  public deleteBalon(id: string, user = "seksi_penjaringan") {
    const idx = this.balonList.findIndex((b) => b.id === id);
    if (idx === -1) return false;

    const target = this.balonList[idx];
    this.balonList.splice(idx, 1);

    // Sync to Supabase Cloud
    SupabaseDbService.deleteBalon(id);

    this.addAuditLog({
      user,
      role: "SEKSI_PENJARINGAN",
      aksi: "BALON_DELETE",
      entity: "PENJARINGAN",
      target: target.namaLengkap,
      detail: `Menghapus data bakal calon Kades: ${target.namaLengkap}.`,
      ipAddress: "127.0.0.1",
    });

    return true;
  }

  public updateStatusBerkasBalon(
    id: string,
    kelengkapan: MasterBalonPenjaringan["kelengkapan"],
    statusBerkas: MasterBalonPenjaringan["statusBerkas"],
    catatan?: string,
    user = "seksi_penjaringan"
  ) {
    const idx = this.balonList.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    this.balonList[idx].kelengkapan = kelengkapan;
    this.balonList[idx].statusBerkas = statusBerkas;
    if (catatan !== undefined) this.balonList[idx].catatanPenjaringan = catatan;

    // Sync to Supabase Cloud
    SupabaseDbService.updateBalon(id, {
      kelengkapan,
      statusBerkas,
      catatanPenjaringan: catatan,
    });

    this.addAuditLog({
      user,
      role: "SEKSI_PENJARINGAN",
      aksi: "BALON_VERIFY",
      entity: "PENJARINGAN",
      target: `${this.balonList[idx].namaLengkap} (${statusBerkas})`,
      detail: `Verifikasi kelengkapan berkas administrasi balon Kades ${this.balonList[idx].namaLengkap}: Status ${statusBerkas}.`,
      ipAddress: "127.0.0.1",
    });

    return this.balonList[idx];
  }

  // --- PETUGAS PENDATAAN DPT (PANTARLIH / COKLIT) METHODS ---
  public getPetugasDptList(): MasterPetugasDpt[] {
    return [...this.petugasDptList];
  }

  public getPetugasDptById(id: string): MasterPetugasDpt | undefined {
    return this.petugasDptList.find((p) => p.id === id);
  }

  public getPetugasDptByRegAndWa(nomorRegistrasi: string, nomorWa: string): MasterPetugasDpt | undefined {
    const cleanReg = nomorRegistrasi.trim().toUpperCase();
    const cleanWa = nomorWa.replace(/\D/g, "");
    return this.petugasDptList.find((p) => {
      const matchReg = p.nomorRegistrasi.trim().toUpperCase() === cleanReg;
      const pWa = p.nomorWa.replace(/\D/g, "");
      const matchWa = pWa === cleanWa || pWa.endsWith(cleanWa) || cleanWa.endsWith(pWa);
      return matchReg && matchWa;
    });
  }

  public checkNikPetugasDptExists(nik: string): boolean {
    const clean = nik.replace(/\D/g, "");
    return this.petugasDptList.some((p) => p.nik.replace(/\D/g, "") === clean);
  }

  public generateNomorRegistrasiPetugas(): string {
    const prefix = "PTG-KLS-2026-";
    let maxSeq = 0;
    for (const p of this.petugasDptList) {
      if (p.nomorRegistrasi && p.nomorRegistrasi.startsWith(prefix)) {
        const numPart = p.nomorRegistrasi.replace(prefix, "");
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(5, "0")}`;
  }

  public async addPetugasDpt(
    data: Omit<MasterPetugasDpt, "id" | "nomorRegistrasi" | "updatedAt" | "nikMasked" | "noKkMasked">,
    user = "Masyarakat"
  ): Promise<MasterPetugasDpt> {
    const id = `ptg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nomorRegistrasi = this.generateNomorRegistrasiPetugas();
    const now = new Date().toISOString();

    const newPetugas: MasterPetugasDpt = {
      ...data,
      id,
      nomorRegistrasi,
      nikMasked: maskNIK(data.nik),
      noKkMasked: maskKK(data.noKk),
      updatedAt: now,
    };

    this.petugasDptList.unshift(newPetugas);

    // Sync to Supabase Cloud
    await SupabaseDbService.insertPetugasDpt(newPetugas);

    this.addAuditLog({
      user,
      role: "WARGA_PENDAFTAR",
      aksi: "PETUGAS_DPT_REGISTER",
      entity: "PETUGAS_DPT",
      target: `${newPetugas.namaLengkap} (${newPetugas.nomorRegistrasi})`,
      detail: `Pendaftaran Petugas Pendataan DPT: ${newPetugas.namaLengkap}, No. Reg: ${newPetugas.nomorRegistrasi}, Wilayah: RW ${newPetugas.rw}, Desa Kalisalak.`,
      ipAddress: "127.0.0.1",
    });

    return newPetugas;
  }

  public async updateStatusPetugasDpt(
    id: string,
    updateData: {
      status?: PetugasStatus;
      catatanPanitia?: string;
      assignedWilayah?: string;
    },
    user = "Panitia P2KD"
  ): Promise<MasterPetugasDpt | null> {
    const idx = this.petugasDptList.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const existing = this.petugasDptList[idx];
    const prevStatus = existing.status;
    const now = new Date().toISOString();

    const updated: MasterPetugasDpt = {
      ...existing,
      status: updateData.status !== undefined ? updateData.status : existing.status,
      catatanPanitia: updateData.catatanPanitia !== undefined ? updateData.catatanPanitia : existing.catatanPanitia,
      assignedWilayah: updateData.assignedWilayah !== undefined ? updateData.assignedWilayah : existing.assignedWilayah,
      updatedAt: now,
    };

    this.petugasDptList[idx] = updated;

    // Sync to Supabase Cloud
    await SupabaseDbService.updatePetugasDpt(id, {
      status: updated.status,
      catatanPanitia: updated.catatanPanitia,
      assignedWilayah: updated.assignedWilayah,
      updatedAt: now,
    });

    this.addAuditLog({
      user,
      role: "PANITIA_P2KD",
      aksi: "PETUGAS_DPT_VERIFIKASI",
      entity: "PETUGAS_DPT",
      target: `${updated.namaLengkap} (${updated.nomorRegistrasi})`,
      detail: `Memperbarui status pendaftar petugas ${updated.namaLengkap}: ${prevStatus} -> ${updated.status}${updateData.assignedWilayah ? `, Penugasan: ${updateData.assignedWilayah}` : ""}.`,
      ipAddress: "127.0.0.1",
    });

    return updated;
  }

  public async deletePetugasDpt(id: string, user = "Panitia P2KD"): Promise<boolean> {
    const idx = this.petugasDptList.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const target = this.petugasDptList[idx];
    this.petugasDptList.splice(idx, 1);

    await SupabaseDbService.deletePetugasDpt(id);

    this.addAuditLog({
      user,
      role: "PANITIA_P2KD",
      aksi: "PETUGAS_DPT_DELETE",
      entity: "PETUGAS_DPT",
      target: `${target.namaLengkap} (${target.nomorRegistrasi})`,
      detail: `Menghapus pendaftar petugas DPT: ${target.namaLengkap} (${target.nomorRegistrasi}).`,
      ipAddress: "127.0.0.1",
    });

    return true;
  }

  // --- DPT LOCK & AUDIT ---
  public getTahapanState() {
    return { ...this.tahapanState };
  }

  public lockDpt(lockedBy = "Ahmad Subagyo, S.Pd (Ketua P2KD)", nomorBeritaAcara?: string) {
    if (this.tahapanState.isDptLocked) {
      return this.tahapanState;
    }

    const timestamp = new Date().toISOString();
    const activeCount = this.pemilihList.filter((p) => p.statusAktif === "AKTIF").length;
    const ba = nomorBeritaAcara || `BA/${Date.now().toString().slice(-4)}/P2KD-KLS/VIII/2026`;
    const signaturePayload = `${timestamp}|${activeCount}|KALISALAK-DPT-2026|${lockedBy}|${ba}`;
    const signature = crypto.createHash("sha256").update(signaturePayload).digest("hex");

    this.tahapanState = {
      ...this.tahapanState,
      dptStatus: "DIKUNCI",
      isDptLocked: true,
      lockTimestamp: timestamp,
      lockHashSignature: signature,
      lockedBy,
      nomorBeritaAcara: ba,
    };

    // Sync to Supabase Cloud
    SupabaseDbService.lockDptTahapan(true, ba, lockedBy, signature);

    this.addAuditLog({
      user: lockedBy,
      role: "SUPER_ADMIN",
      aksi: "DPT_LOCK_FINAL",
      entity: "TAHAPAN",
      target: "DPT_FINAL_PLENO",
      detail: `Finalisasi dan Penguncian Berita Acara Pleno DPT Pilkades Kalisalak 2026 (${activeCount} Pemilih Aktif). Signature: ${signature.substring(0, 16)}...`,
      ipAddress: "127.0.0.1",
    });

    return this.tahapanState;
  }

  public lockDPT(lockedBy = "Ahmad Subagyo, S.Pd (Ketua P2KD)", nomorBeritaAcara?: string) {
    return this.lockDpt(lockedBy, nomorBeritaAcara);
  }

  public unlockDPT(user = "Ketua P2KD", alasan = "Revisi Pleno") {
    this.tahapanState = {
      ...this.tahapanState,
      dptStatus: "DRAFT",
      isDptLocked: false,
      lockTimestamp: undefined,
      lockHashSignature: undefined,
    };

    // Sync to Supabase Cloud
    SupabaseDbService.lockDptTahapan(false, this.tahapanState.nomorBeritaAcara || "BA/01/P2KD-KLS/VIII/2026", user, undefined);

    this.addAuditLog({
      user,
      role: "SUPER_ADMIN",
      aksi: "DPT_UNLOCK",
      entity: "TAHAPAN",
      target: "DPT_FINAL_PLENO",
      detail: `Pembukaan kembali status DPT untuk perbaikan: ${alasan}`,
      ipAddress: "127.0.0.1",
    });

    return this.tahapanState;
  }

  public getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }

  public addAuditLog(log: Omit<AuditLogItem, "id" | "waktu">) {
    const newLog: AuditLogItem = {
      ...log,
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      waktu: new Date().toLocaleString("id-ID"),
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }

    // Sync to Supabase Cloud
    SupabaseDbService.insertAuditLog(newLog);

    return newLog;
  }

  // --- STATS AGGREGATION ---
  public getStats() {
    const totalSemua = this.pemilihList.length;
    let totalAktif = 0;
    let totalLaki = 0;
    let totalPerempuan = 0;
    let totalTms = 0;

    this.pemilihList.forEach((p) => {
      if (p.statusAktif === "AKTIF") {
        totalAktif++;
        if (p.jenisKelamin === "L") totalLaki++;
        else if (p.jenisKelamin === "P") totalPerempuan++;
      } else if (p.statusAktif === "TMS") {
        totalTms++;
      }
    });

    const totalAduan = this.aduanList.length;
    const aduanMenunggu = this.aduanList.filter((a) => a.status === "MENUNGGU").length;
    const aduanSelesai = this.aduanList.filter((a) => a.status === "DISETUJUI").length;

    const totalAnggota = this.anggotaList.length;
    const totalBalon = this.balonList.length;

    const tpsStats = this.tpsList.map((t) => {
      const pInTps = this.pemilihList.filter(
        (p) =>
          p.statusAktif === "AKTIF" &&
          (p.tps === t.nomorTps || p.tps === t.namaTps || p.tps.includes(t.nomorTps))
      );
      const l = pInTps.filter((p) => p.jenisKelamin === "L").length;
      const p = pInTps.filter((p) => p.jenisKelamin === "P").length;
      return {
        id: t.id,
        nomorTps: t.nomorTps,
        namaTps: t.namaTps,
        lokasi: t.lokasi,
        total: pInTps.length,
        laki: l,
        perempuan: p,
        kuotaMaksimal: t.kuotaMaksimal,
      };
    }).sort((a, b) => {
      const numA = parseInt((a.nomorTps || a.namaTps || "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt((b.nomorTps || b.namaTps || "").replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

    const uniqueRwSet = new Set<string>();
    const uniqueRtSet = new Set<string>();

    this.pemilihList.forEach((p) => {
      if (p.rw) uniqueRwSet.add(p.rw.trim());
      if (p.rt && p.rw) uniqueRtSet.add(`${p.rw.trim()}-${p.rt.trim()}`);
    });

    this.tpsList.forEach((t) => {
      if (t.rw) uniqueRwSet.add(t.rw.trim());
    });

    const totalRw = uniqueRwSet.size || 13;
    const totalRt = uniqueRtSet.size || 39;
    const totalTps = this.tpsList.length;

    const totalPetugas = this.petugasDptList.length;
    const petugasMenunggu = this.petugasDptList.filter((p) => p.status === "MENUNGGU_VERIFIKASI").length;
    const petugasKlarifikasi = this.petugasDptList.filter((p) => p.status === "PERLU_KLARIFIKASI").length;
    const petugasLolos = this.petugasDptList.filter((p) => p.status === "LOLOS").length;
    const petugasDitetapkan = this.petugasDptList.filter((p) => p.status === "DITETAPKAN").length;

    return {
      totalSemua,
      totalAktif,
      totalLaki,
      totalPerempuan,
      totalTms,
      totalAduan,
      aduanMenunggu,
      aduanSelesai,
      totalAnggota,
      totalBalon,
      totalPetugas,
      petugasMenunggu,
      petugasKlarifikasi,
      petugasLolos,
      petugasDitetapkan,
      totalTps,
      totalRw,
      totalRt,
      tpsStats,
      tahapan: this.getTahapanState(),
    };
  }
}

export const dataStore = SystemDataStore.getInstance();
