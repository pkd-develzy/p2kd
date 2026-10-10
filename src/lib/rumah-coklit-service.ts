import { SupabaseDbService } from "./supabase-db";
import { notifyPetugasActivity } from "./telegram";

export type QrRumahStatus =
  | "UNASSIGNED"
  | "REGISTERED"
  | "VISITED"
  | "VERIFICATION_IN_PROGRESS"
  | "COMPLETED"
  | "FOLLOW_UP_REQUIRED";

export type RumahStatus =
  | "BELUM_DIDATA"
  | "TERDAFTAR"
  | "SELESAI"
  | "PERLU_TINDAK_LANJUT";

export type KunjunganStatus =
  | "SELESAI"
  | "BELUM_LENGKAP"
  | "PERLU_TINDAK_LANJUT";

export type VerifikasiStatus =
  | "SESUAI"
  | "UBAH_DATA"
  | "TMS"
  | "BELUM_DITEMUI"
  | "BELUM_DIVERIFIKASI";

export interface QrRumahItem {
  id: string;
  qrToken: string;
  status: QrRumahStatus;
  batchRef?: string | null;
  assignedTps?: string | null;
  assignedRw?: string | null;
  assignedPetugas?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RumahItem {
  id: string;
  qrId?: string | null;
  qrToken: string;
  nomorRumah?: string | null;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  tps?: string | null;
  koordinatLat?: number | null;
  koordinatLng?: number | null;
  keteranganLokasi?: string | null;
  statusPendataan: RumahStatus;
  petugasPendata?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KartuKeluargaItem {
  id: string;
  rumahId?: string | null;
  noKk: string;
  kepalaKeluargaNama: string;
  alamat?: string | null;
  rt?: string | null;
  rw?: string | null;
  statusKk: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnggotaKeluargaItem {
  id: string;
  nik: string;
  noKk: string;
  namaLengkap: string;
  jenisKelamin: string;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  statusPerkawinan?: string | null;
  alamat: string;
  rt: string;
  rw: string;
  tps: string;
  tahap: string;
  statusAktif: string;
  verifikasiStatus: VerifikasiStatus;
  verifikasiCatatan?: string | null;
  verifikasiPetugas?: string | null;
  verifikasiAt?: string | null;
  rumahId?: string | null;
  kkId?: string | null;
}

export interface KunjunganCoklitItem {
  id: string;
  rumahId: string;
  qrToken: string;
  petugasUsername: string;
  petugasNama: string;
  tps: string;
  waktuKunjungan: string;
  statusKunjungan: KunjunganStatus;
  totalKk: number;
  totalAnggota: number;
  anggotaSesuai: number;
  anggotaUbahData: number;
  anggotaTms: number;
  anggotaBelumDitemui: number;
  catatanKunjungan?: string | null;
  stikerDitempel: boolean;
  namaStikerManual?: string | null;
  idempotencyKey?: string | null;
  syncStatus: string;
  createdAt: string;
  updatedAt: string;
}

export class RumahCoklitService {
  private static getClient() {
    return SupabaseDbService.getSeksi1Client();
  }

  /**
   * Validasi dan Lookup QR Token Fisik Rumah
   */
  public static async validateAndLookupQr(rawToken: string): Promise<{
    success: boolean;
    valid: boolean;
    message?: string;
    qr?: QrRumahItem;
    rumah?: RumahItem | null;
    kks?: KartuKeluargaItem[];
    members?: AnggotaKeluargaItem[];
    kunjunganTerakhir?: KunjunganCoklitItem | null;
  }> {
    let token = (rawToken || "").trim();
    if (!token) {
      return { success: false, valid: false, message: "Token QR tidak boleh kosong." };
    }

    // Smart Token Extractor: Support direct token, URL query param (?qr= or ?token=), or URL path (/qr/...)
    const tokenMatch = token.match(/KLK-HM-\d{2}-[A-Za-z0-9]+/i);
    if (tokenMatch) {
      token = tokenMatch[0].toUpperCase();
    } else if (token.includes("qr=")) {
      token = decodeURIComponent(token.split("qr=")[1].split("&")[0]).trim().toUpperCase();
    } else if (token.includes("token=")) {
      token = decodeURIComponent(token.split("token=")[1].split("&")[0]).trim().toUpperCase();
    } else {
      token = token.toUpperCase();
    }

    const client = this.getClient();

    // 1. Cari di tabel qr_rumah
    const { data: qrRow, error: qrErr } = await client
      .from("qr_rumah")
      .select("*")
      .ilike("qr_token", token)
      .maybeSingle();

    if (qrErr || !qrRow) {
      return {
        success: false,
        valid: false,
        message: "QR Code C6 tidak terdaftar dalam database resmi P2KD Kalisalak. Pastikan menggunakan stiker resmi panitia.",
      };
    }

    const qr: QrRumahItem = {
      id: qrRow.id,
      qrToken: qrRow.qr_token,
      status: qrRow.status as QrRumahStatus,
      batchRef: qrRow.batch_ref,
      assignedTps: qrRow.assigned_tps,
      assignedRw: qrRow.assigned_rw,
      assignedPetugas: qrRow.assigned_petugas,
      createdAt: qrRow.created_at,
      updatedAt: qrRow.updated_at,
    };

    // 2. Cari rumah yang terhubung ke QR ini
    const { data: rumahRow } = await client
      .from("rumah")
      .select("*")
      .eq("qr_token", token)
      .maybeSingle();

    if (!rumahRow) {
      return {
        success: true,
        valid: true,
        qr,
        rumah: null,
        kks: [],
        members: [],
        kunjunganTerakhir: null,
      };
    }

    const rumah: RumahItem = {
      id: rumahRow.id,
      qrId: rumahRow.qr_id,
      qrToken: rumahRow.qr_token,
      nomorRumah: rumahRow.nomor_rumah,
      alamat: rumahRow.alamat,
      rt: rumahRow.rt,
      rw: rumahRow.rw,
      desa: rumahRow.desa || "Kalisalak",
      kecamatan: rumahRow.kecamatan || "Margasari",
      tps: rumahRow.tps,
      koordinatLat: rumahRow.koordinat_lat,
      koordinatLng: rumahRow.koordinat_lng,
      keteranganLokasi: rumahRow.keterangan_lokasi,
      statusPendataan: rumahRow.status_pendataan as RumahStatus,
      petugasPendata: rumahRow.petugas_pendata,
      createdAt: rumahRow.created_at,
      updatedAt: rumahRow.updated_at,
    };

    // 3. Cari seluruh KK yang terhubung ke rumah ini (1 Rumah -> Banyak KK)
    const { data: kkRows } = await client
      .from("kartu_keluarga")
      .select("*")
      .eq("rumah_id", rumah.id)
      .order("created_at", { ascending: true });

    const kks: KartuKeluargaItem[] = (kkRows || []).map((k: Record<string, unknown>) => ({
      id: String(k.id),
      rumahId: k.rumah_id ? String(k.rumah_id) : null,
      noKk: String(k.no_kk),
      kepalaKeluargaNama: String(k.kepala_keluarga_nama),
      alamat: k.alamat ? String(k.alamat) : null,
      rt: k.rt ? String(k.rt) : null,
      rw: k.rw ? String(k.rw) : null,
      statusKk: String(k.status_kk || "AKTIF"),
      createdAt: String(k.created_at),
      updatedAt: String(k.updated_at),
    }));

    // 4. Cari seluruh anggota keluarga (pemilih) di rumah ini
    const { data: memberRows } = await client
      .from("pemilih")
      .select("*")
      .eq("rumah_id", rumah.id)
      .neq("status_aktif", "TMS")
      .order("nama_lengkap", { ascending: true });

    const members: AnggotaKeluargaItem[] = (memberRows || []).map((m: Record<string, unknown>) => ({
      id: String(m.id),
      nik: String(m.nik),
      noKk: String(m.no_kk || ""),
      namaLengkap: String(m.nama_lengkap),
      jenisKelamin: String(m.jenis_kelamin || "L"),
      tempatLahir: m.tempat_lahir ? String(m.tempat_lahir) : null,
      tanggalLahir: m.tanggal_lahir ? String(m.tanggal_lahir) : null,
      statusPerkawinan: m.status_perkawinan ? String(m.status_perkawinan) : null,
      alamat: String(m.alamat || ""),
      rt: String(m.rt || "01"),
      rw: String(m.rw || "01"),
      tps: String(m.tps || ""),
      tahap: String(m.tahap || "CALON_DPS"),
      statusAktif: String(m.status_aktif || "AKTIF"),
      verifikasiStatus: (m.verifikasi_status || m.coklit_status || "BELUM_DIVERIFIKASI") as VerifikasiStatus,
      verifikasiCatatan: m.verifikasi_catatan ? String(m.verifikasi_catatan) : null,
      verifikasiPetugas: m.verifikasi_petugas ? String(m.verifikasi_petugas) : null,
      verifikasiAt: m.verifikasi_at ? String(m.verifikasi_at) : null,
      rumahId: m.rumah_id ? String(m.rumah_id) : null,
      kkId: m.kk_id ? String(m.kk_id) : null,
    }));

    // 5. Kunjungan terakhir
    const { data: kunjunganRow } = await client
      .from("kunjungan_coklit")
      .select("*")
      .eq("rumah_id", rumah.id)
      .order("waktu_kunjungan", { ascending: false })
      .limit(1)
      .maybeSingle();

    let kunjunganTerakhir: KunjunganCoklitItem | null = null;
    if (kunjunganRow) {
      kunjunganTerakhir = {
        id: kunjunganRow.id,
        rumahId: kunjunganRow.rumah_id,
        qrToken: kunjunganRow.qr_token,
        petugasUsername: kunjunganRow.petugas_username,
        petugasNama: kunjunganRow.petugas_nama,
        tps: kunjunganRow.tps,
        waktuKunjungan: kunjunganRow.waktu_kunjungan,
        statusKunjungan: kunjunganRow.status_kunjungan as KunjunganStatus,
        totalKk: kunjunganRow.total_kk,
        totalAnggota: kunjunganRow.total_anggota,
        anggotaSesuai: kunjunganRow.anggota_sesuai,
        anggotaUbahData: kunjunganRow.anggota_ubah_data,
        anggotaTms: kunjunganRow.anggota_tms,
        anggotaBelumDitemui: kunjunganRow.anggota_belum_ditemui,
        catatanKunjungan: kunjunganRow.catatan_kunjungan,
        stikerDitempel: kunjunganRow.stiker_ditempel,
        namaStikerManual: kunjunganRow.nama_stiker_manual,
        idempotencyKey: kunjunganRow.idempotency_key,
        syncStatus: kunjunganRow.sync_status,
        createdAt: kunjunganRow.created_at,
        updatedAt: kunjunganRow.updated_at,
      };
    }

    return {
      success: true,
      valid: true,
      qr,
      rumah,
      kks,
      members,
      kunjunganTerakhir,
    };
  }

  /**
   * Pendaftaran atau Identifikasi Fisik Rumah Baru dengan QR Token
   */
  public static async registerOrUpdateRumah(payload: {
    qrToken: string;
    alamat: string;
    rt: string;
    rw: string;
    nomorRumah?: string;
    keteranganLokasi?: string;
    koordinatLat?: number;
    koordinatLng?: number;
    petugasUsername: string;
    petugasNama: string;
    tps?: string;
  }): Promise<{ success: boolean; message: string; rumah?: RumahItem }> {
    const client = this.getClient();
    const token = payload.qrToken.trim().toUpperCase();

    // 1. Verifikasi QR terdaftar
    const { data: qrRow, error: qrErr } = await client
      .from("qr_rumah")
      .select("*")
      .eq("qr_token", token)
      .maybeSingle();

    if (qrErr || !qrRow) {
      return { success: false, message: "Token QR tidak sah atau tidak ditemukan di database." };
    }

    // 2. Format RT & RW standar
    const rtNum = (payload.rt || "01").replace(/\D/g, "").padStart(2, "0");
    const rwNum = (payload.rw || "01").replace(/\D/g, "").padStart(2, "0");
    const tpsVal = payload.tps || `Tabung Pemilihan ${rwNum}`;

    // 3. Upsert tabel rumah
    const { data: existingRumah } = await client
      .from("rumah")
      .select("*")
      .eq("qr_token", token)
      .maybeSingle();

    let rumahId = existingRumah?.id;

    if (existingRumah) {
      const { data: updated, error: updErr } = await client
        .from("rumah")
        .update({
          alamat: payload.alamat,
          rt: rtNum,
          rw: rwNum,
          nomor_rumah: payload.nomorRumah || existingRumah.nomor_rumah,
          keterangan_lokasi: payload.keteranganLokasi || existingRumah.keterangan_lokasi,
          koordinat_lat: payload.koordinatLat || existingRumah.koordinat_lat,
          koordinat_lng: payload.koordinatLng || existingRumah.koordinat_lng,
          petugas_pendata: payload.petugasNama,
          tps: tpsVal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rumahId)
        .select()
        .single();

      if (updErr || !updated) {
        return { success: false, message: "Gagal memperbarui data rumah: " + updErr?.message };
      }

      return {
        success: true,
        message: "Data identitas rumah berhasil diperbarui.",
        rumah: {
          id: updated.id,
          qrId: updated.qr_id,
          qrToken: updated.qr_token,
          nomorRumah: updated.nomor_rumah,
          alamat: updated.alamat,
          rt: updated.rt,
          rw: updated.rw,
          desa: updated.desa,
          kecamatan: updated.kecamatan,
          tps: updated.tps,
          statusPendataan: updated.status_pendataan as RumahStatus,
          petugasPendata: updated.petugas_pendata,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
        },
      };
    }

    // Insert rumah baru
    const { data: inserted, error: insErr } = await client
      .from("rumah")
      .insert({
        qr_id: qrRow.id,
        qr_token: token,
        alamat: payload.alamat,
        rt: rtNum,
        rw: rwNum,
        nomor_rumah: payload.nomorRumah || null,
        keterangan_lokasi: payload.keteranganLokasi || null,
        koordinat_lat: payload.koordinatLat || null,
        koordinat_lng: payload.koordinatLng || null,
        status_pendataan: "TERDAFTAR",
        petugas_pendata: payload.petugasNama,
        tps: tpsVal,
      })
      .select()
      .single();

    if (insErr || !inserted) {
      return { success: false, message: "Gagal mendaftarkan rumah baru: " + insErr?.message };
    }

    rumahId = inserted.id;

    // Perbarui status QR menjadi REGISTERED
    await client
      .from("qr_rumah")
      .update({
        status: "REGISTERED",
        assigned_rw: `RW ${rwNum}`,
        assigned_tps: tpsVal,
        assigned_petugas: payload.petugasNama,
        updated_at: new Date().toISOString(),
      })
      .eq("id", qrRow.id);

    return {
      success: true,
      message: "Rumah baru berhasil didaftarkan dan dikaitkan dengan QR C6.",
      rumah: {
        id: inserted.id,
        qrId: inserted.qr_id,
        qrToken: inserted.qr_token,
        nomorRumah: inserted.nomor_rumah,
        alamat: inserted.alamat,
        rt: inserted.rt,
        rw: inserted.rw,
        desa: inserted.desa,
        kecamatan: inserted.kecamatan,
        tps: inserted.tps,
        statusPendataan: inserted.status_pendataan as RumahStatus,
        petugasPendata: inserted.petugas_pendata,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      },
    };
  }

  /**
   * Menautkan Kartu Keluarga (KK) ke Rumah (Mendukung 1 Rumah memiliki banyak KK)
   */
  public static async linkKkToRumah(payload: {
    rumahId: string;
    noKk: string;
    kepalaKeluargaNama: string;
    rt?: string;
    rw?: string;
    alamat?: string;
  }): Promise<{ success: boolean; message: string; kk?: KartuKeluargaItem }> {
    const client = this.getClient();
    const cleanKk = payload.noKk.trim();

    if (!cleanKk || cleanKk.length < 6) {
      return { success: false, message: "Nomor KK tidak valid." };
    }

    // 1. Cek apakah KK sudah ada di master kartu_keluarga
    const { data: existingKk } = await client
      .from("kartu_keluarga")
      .select("*")
      .eq("no_kk", cleanKk)
      .maybeSingle();

    let kkId: string;
    let savedKk: Record<string, unknown>;

    if (existingKk) {
      // Tautkan KK ke rumah ini
      const { data: updated, error: updErr } = await client
        .from("kartu_keluarga")
        .update({
          rumah_id: payload.rumahId,
          kepala_keluarga_nama: payload.kepalaKeluargaNama || existingKk.kepala_keluarga_nama,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingKk.id)
        .select()
        .single();

      if (updErr || !updated) {
        return { success: false, message: "Gagal memperbarui relasi KK: " + updErr?.message };
      }
      kkId = updated.id;
      savedKk = updated;
    } else {
      // Insert KK baru yang ditautkan ke rumah ini
      const { data: inserted, error: insErr } = await client
        .from("kartu_keluarga")
        .insert({
          rumah_id: payload.rumahId,
          no_kk: cleanKk,
          kepala_keluarga_nama: payload.kepalaKeluargaNama || "Kepala Keluarga",
          alamat: payload.alamat || null,
          rt: payload.rt || "01",
          rw: payload.rw || "01",
        })
        .select()
        .single();

      if (insErr || !inserted) {
        return { success: false, message: "Gagal menambahkan KK: " + insErr?.message };
      }
      kkId = inserted.id;
      savedKk = inserted;
    }

    // 2. Hubungkan semua pemilih yang memiliki nomor KK ini ke rumah_id & kk_id
    await client
      .from("pemilih")
      .update({
        rumah_id: payload.rumahId,
        kk_id: kkId,
        updated_at: new Date().toISOString(),
      })
      .eq("no_kk", cleanKk);

    return {
      success: true,
      message: `KK (${cleanKk}) berhasil ditautkan ke rumah.`,
      kk: {
        id: String(savedKk.id),
        rumahId: savedKk.rumah_id ? String(savedKk.rumah_id) : null,
        noKk: String(savedKk.no_kk),
        kepalaKeluargaNama: String(savedKk.kepala_keluarga_nama),
        alamat: savedKk.alamat ? String(savedKk.alamat) : null,
        rt: savedKk.rt ? String(savedKk.rt) : null,
        rw: savedKk.rw ? String(savedKk.rw) : null,
        statusKk: String(savedKk.status_kk || "AKTIF"),
        createdAt: String(savedKk.created_at),
        updatedAt: String(savedKk.updated_at),
      },
    };
  }

  /**
   * Konfirmasi Kunjungan Coklit Rumah dan Verifikasi Anggota
   */
  public static async submitKunjunganCoklit(payload: {
    rumahId: string;
    qrToken: string;
    petugasUsername: string;
    petugasNama: string;
    tps: string;
    namaStikerManual?: string;
    catatanKunjungan?: string;
    stikerDitempel?: boolean;
    verifikasiAnggota: Array<{
      pemilihId: string;
      status: VerifikasiStatus;
      catatan?: string;
    }>;
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    message: string;
    kunjunganId?: string;
    statusKunjungan?: KunjunganStatus;
  }> {
    const client = this.getClient();

    // 1. Idempotency Check
    if (payload.idempotencyKey) {
      const { data: existingKunjungan } = await client
        .from("kunjungan_coklit")
        .select("id, status_kunjungan")
        .eq("idempotency_key", payload.idempotencyKey)
        .maybeSingle();

      if (existingKunjungan) {
        return {
          success: true,
          message: "Data kunjungan Coklit telah tercatat sebelumnya (idempotent).",
          kunjunganId: existingKunjungan.id,
          statusKunjungan: existingKunjungan.status_kunjungan as KunjunganStatus,
        };
      }
    }

    // 2. Hitung statistik verifikasi anggota
    let sesuaiCount = 0;
    let ubahCount = 0;
    let tmsCount = 0;
    let belumCount = 0;

    for (const v of payload.verifikasiAnggota) {
      if (v.status === "SESUAI") sesuaiCount++;
      else if (v.status === "UBAH_DATA") ubahCount++;
      else if (v.status === "TMS") tmsCount++;
      else belumCount++;
    }

    const totalAnggota = payload.verifikasiAnggota.length;
    // Status kunjungan: Jika ada anggota yang belum ditemui / perlu follow up
    const statusKunjungan: KunjunganStatus =
      belumCount > 0 ? "BELUM_LENGKAP" : "SELESAI";

    // Hitung total KK di rumah ini
    const { data: kkCountData } = await client
      .from("kartu_keluarga")
      .select("id", { count: "exact" })
      .eq("rumah_id", payload.rumahId);

    const totalKk = kkCountData?.length || 1;

    // 3. Simpan rekam kunjungan ke tabel kunjungan_coklit
    const { data: kunjunganRow, error: insErr } = await client
      .from("kunjungan_coklit")
      .insert({
        rumah_id: payload.rumahId,
        qr_token: payload.qrToken,
        petugas_username: payload.petugasUsername,
        petugas_nama: payload.petugasNama,
        tps: payload.tps,
        waktu_kunjungan: new Date().toISOString(),
        status_kunjungan: statusKunjungan,
        total_kk: totalKk,
        total_anggota: totalAnggota,
        anggota_sesuai: sesuaiCount,
        anggota_ubah_data: ubahCount,
        anggota_tms: tmsCount,
        anggota_belum_ditemui: belumCount,
        catatan_kunjungan: payload.catatanKunjungan || null,
        stiker_ditempel: payload.stikerDitempel ?? true,
        nama_stiker_manual: payload.namaStikerManual || null,
        idempotency_key: payload.idempotencyKey || null,
        sync_status: "SYNCED",
      })
      .select()
      .single();

    if (insErr || !kunjunganRow) {
      return { success: false, message: "Gagal menyimpan rekam kunjungan Coklit: " + insErr?.message };
    }

    const kunjunganId = kunjunganRow.id;

    // 4. Batch insert detail log ke kunjungan_anggota_log & perbarui baris pemilih
    const nowIso = new Date().toISOString();
    const logInserts = payload.verifikasiAnggota.map((v) => ({
      kunjungan_id: kunjunganId,
      pemilih_id: v.pemilihId,
      status_verifikasi: v.status,
      catatan: v.catatan || null,
    }));

    if (logInserts.length > 0) {
      await client.from("kunjungan_anggota_log").insert(logInserts);

      for (const v of payload.verifikasiAnggota) {
        let coklitColVal = "SUDAH";
        if (v.status === "UBAH_DATA") coklitColVal = "UBAH_DATA";
        else if (v.status === "TMS") coklitColVal = "TMS";
        else if (v.status === "BELUM_DITEMUI") coklitColVal = "BELUM_COKLIT";

        await client
          .from("pemilih")
          .update({
            verifikasi_status: v.status,
            verifikasi_catatan: v.catatan || null,
            verifikasi_petugas: payload.petugasNama,
            verifikasi_at: nowIso,
            coklit_status: coklitColVal,
            coklit_petugas: payload.petugasNama,
            coklit_tanggal: nowIso.split("T")[0],
            coklit_catatan: v.catatan || null,
            status_aktif: v.status === "TMS" ? "TMS" : "AKTIF",
            updated_at: nowIso,
          })
          .eq("id", v.pemilihId);
      }
    }

    // 5. Perbarui status rumah dan QR
    const qrTargetStatus: QrRumahStatus =
      statusKunjungan === "SELESAI" ? "COMPLETED" : "FOLLOW_UP_REQUIRED";

    await client
      .from("rumah")
      .update({
        status_pendataan: statusKunjungan === "SELESAI" ? "SELESAI" : "PERLU_TINDAK_LANJUT",
        updated_at: nowIso,
      })
      .eq("id", payload.rumahId);

    await client
      .from("qr_rumah")
      .update({
        status: qrTargetStatus,
        updated_at: nowIso,
      })
      .eq("qr_token", payload.qrToken);

    // 6. Notifikasi otomatis ke Telegram Panitia
    try {
      void notifyPetugasActivity({
        namaPetugas: payload.petugasNama,
        rolePetugas: `Pantarlih ${payload.tps}`,
        wilayahTps: payload.tps,
        aktivitas: "Konfirmasi Kunjungan Coklit Rumah",
        perubahanStatus: `RUMAH ➜ ${statusKunjungan} (${qrTargetStatus})`,
        targetWarga: payload.namaStikerManual
          ? `Nama Stiker (Manual): ${payload.namaStikerManual}`
          : `Rumah Token ${payload.qrToken}`,
        wilayah: `${payload.tps} • Total KK: ${totalKk}`,
        rincian: `Terverifikasi ${sesuaiCount} sesuai, ${ubahCount} ubah data, ${tmsCount} TMS, ${belumCount} belum ditemui. Catatan: ${
          payload.catatanKunjungan || "Stiker Coklit fisik tertempel."
        }`,
      }).catch(() => {});
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message: `Kunjungan Coklit berhasil dicatat. Status: ${statusKunjungan}.`,
      kunjunganId,
      statusKunjungan,
    };
  }

  /**
   * Mengambil data untuk halaman publik verifikasi stiker coklit (/stiker-coklit?qr=...)
   */
  public static async getPublicStikerData(qrTokenOrQuery: string): Promise<{
    success: boolean;
    message?: string;
    data?: {
      id: string;
      qrToken: string;
      statusQr: string;
      statusKunjungan: string;
      kepalaKeluarga: string;
      namaStikerManual: string;
      alamat: string;
      rt: string;
      rw: string;
      desa: string;
      kecamatan: string;
      kabupaten: string;
      mejaPendaftaran: string;
      tanggalCoklit: string;
      petugasPantarlih: string;
      totalKk: number;
      totalPemilihRumah: number;
      kks: Array<{ noKk: string; kepalaKeluarga: string }>;
      members: Array<{
        noUrut: number;
        id: string;
        namaLengkap: string;
        nikMasked: string;
        jenisKelamin: string;
        statusHakPilih: string;
        tahap: string;
        statusVerifikasi: string;
      }>;
      verifiedAt: string;
    };
  }> {
    const lookup = await this.validateAndLookupQr(qrTokenOrQuery);
    if (!lookup.success || !lookup.qr) {
      return { success: false, message: lookup.message || "QR Code stiker tidak valid." };
    }

    const qr = lookup.qr;
    const rumah = lookup.rumah;
    const kks = lookup.kks || [];
    const members = lookup.members || [];
    const kunjungan = lookup.kunjunganTerakhir;

    const rwNum = (rumah?.rw || qr.assignedRw || "01").replace(/\D/g, "").padStart(2, "0");
    const rtNum = (rumah?.rt || "01").replace(/\D/g, "").padStart(2, "0");

    const manualName = kunjungan?.namaStikerManual || kks[0]?.kepalaKeluargaNama || "Warga Terdaftar";

    return {
      success: true,
      data: {
        id: rumah?.id || qr.id,
        qrToken: qr.qrToken,
        statusQr: qr.status,
        statusKunjungan: kunjungan?.statusKunjungan || (rumah ? "TERDAFTAR" : "BELUM_DIKUNJUNGI"),
        kepalaKeluarga: manualName,
        namaStikerManual: manualName,
        alamat: rumah?.alamat ? `${rumah.alamat} (RT ${rtNum} / RW ${rwNum})` : `Wilayah RW ${rwNum}`,
        rt: rtNum,
        rw: rwNum,
        desa: "Kalisalak",
        kecamatan: "Margasari",
        kabupaten: "Tegal",
        mejaPendaftaran: `RW ${rwNum}`,
        tanggalCoklit: kunjungan?.waktuKunjungan
          ? new Date(kunjungan.waktuKunjungan).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "Belum Dicoklit",
        petugasPantarlih: kunjungan?.petugasNama || qr.assignedPetugas || `Pantarlih RW ${rwNum}`,
        totalKk: kks.length,
        totalPemilihRumah: members.length,
        kks: kks.map((k) => ({
          noKk: k.noKk ? `${k.noKk.slice(0, 3)}**********${k.noKk.slice(-3)}` : "****************",
          kepalaKeluarga: k.kepalaKeluargaNama,
        })),
        members: members.map((m, idx) => ({
          noUrut: idx + 1,
          id: m.id,
          namaLengkap: m.namaLengkap,
          nikMasked: m.nik ? `${m.nik.slice(0, 1)}*************${m.nik.slice(-2)}` : "****************",
          jenisKelamin: m.jenisKelamin === "L" || m.jenisKelamin.startsWith("L") ? "Laki-laki (L)" : "Perempuan (P)",
          statusHakPilih: m.tahap === "DPT" ? "Terdaftar di DPT" : "Daftar Pemilih Sementara (DPS)",
          tahap: m.tahap,
          statusVerifikasi: m.verifikasiStatus,
        })),
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Mengambil daftar tugas Coklit petugas lapangan berdasarkan TPS / RW
   */
  public static async getPetugasTasks(assignedTps?: string, assignedRw?: string) {
    const client = this.getClient();
    let rwFilter = assignedRw;
    if (!rwFilter && assignedTps && assignedTps !== "SEMUA") {
      const match = assignedTps.match(/\d+/);
      if (match) rwFilter = `RW ${match[0].padStart(2, "0")}`;
    }

    // 1. Ambil rumah di wilayah tugas
    let rumahQuery = client.from("rumah").select("*").order("created_at", { ascending: false });
    if (rwFilter && rwFilter !== "SEMUA") {
      const rwNum = rwFilter.replace(/\D/g, "").padStart(2, "0");
      rumahQuery = rumahQuery.eq("rw", rwNum);
    }
    const { data: rumahList } = await rumahQuery.limit(200);

    // 2. Ambil token QR UNASSIGNED siap pakai untuk wilayah tugas
    let qrQuery = client
      .from("qr_rumah")
      .select("*", { count: "exact" })
      .eq("status", "UNASSIGNED")
      .order("created_at", { ascending: true });
    if (rwFilter && rwFilter !== "SEMUA") {
      const rwDigits = rwFilter.replace(/\D/g, "").padStart(2, "0");
      qrQuery = qrQuery.or(`assigned_rw.eq.${rwFilter},assigned_rw.eq.RW ${rwDigits},assigned_rw.is.null`);
    }
    const { data: unassignedQrs, count: qrCount } = await qrQuery.limit(100);

    // 3. Hitung jumlah pemilih terdaftar di wilayah tugas
    let totalPemilihWilayah = 0;
    if (rwFilter && rwFilter !== "SEMUA") {
      const rwDigits = rwFilter.replace(/\D/g, "").padStart(2, "0");
      const rwNum = parseInt(rwDigits, 10);
      const { count: pmlCount } = await client
        .from("pemilih")
        .select("id", { count: "exact", head: true })
        .or(`rw.eq.${rwDigits},rw.eq.${rwNum},tps.ilike.%RW ${rwDigits}%,tps.ilike.%TPS ${rwDigits}%`);
      totalPemilihWilayah = pmlCount || 0;
    } else {
      const { count: pmlCount } = await client
        .from("pemilih")
        .select("id", { count: "exact", head: true });
      totalPemilihWilayah = pmlCount || 0;
    }

    // 4. Hitung ringkasan status
    const totalRumah = rumahList?.length || 0;
    const selesaiRumah = (rumahList || []).filter((r: Record<string, unknown>) => r.status_pendataan === "SELESAI").length;
    const perluFollowUp = (rumahList || []).filter((r: Record<string, unknown>) => r.status_pendataan === "PERLU_TINDAK_LANJUT").length;

    return {
      success: true,
      assignedRw: rwFilter || "SEMUA",
      summary: {
        totalRumah,
        selesaiRumah,
        perluFollowUp,
        stikerTersedia: qrCount ?? (unassignedQrs?.length || 0),
        totalPemilihWilayah,
      },
      rumahList: (rumahList || []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        qrToken: String(r.qr_token || ""),
        alamat: String(r.alamat || ""),
        rt: String(r.rt || ""),
        rw: String(r.rw || ""),
        statusPendataan: String(r.status_pendataan || "BELUM_DIDATA"),
        petugasPendata: r.petugas_pendata ? String(r.petugas_pendata) : null,
        updatedAt: String(r.updated_at),
      })),
      unassignedQrs: (unassignedQrs || []).map((q: Record<string, unknown>) => ({
        id: String(q.id),
        qrToken: String(q.qr_token),
        batchRef: q.batch_ref ? String(q.batch_ref) : null,
        assignedRw: q.assigned_rw ? String(q.assigned_rw) : null,
      })),
    };
  }
}
