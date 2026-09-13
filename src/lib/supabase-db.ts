import { getSupabaseAdmin } from "./supabase";
import {
  MasterPemilih,
  MasterAduan,
  MasterTPS,
  MasterKandidat,
  MasterTpsVoteCount,
  MasterAnggotaP2KD,
  MasterBalonPenjaringan,
  AuditLogItem,
  SystemTahapan,
  MasterPengumuman,
  PublicWebConfig,
  MasterPetugasDpt,
} from "./data-store";
import { maskNIK, maskKK } from "./encryption";

interface SupabaseTpsRow {
  id: string;
  kode_tps: string;
  nomor_tps: string;
  nama_tps: string;
  nama_tabung?: string | null;
  lokasi: string;
  alamat: string;
  rt?: string | null;
  rw?: string | null;
  kuota_maksimal: number;
  status: string;
}

interface SupabasePemilihRow {
  id: string;
  nik: string;
  no_kk: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  status_perkawinan: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  tps: string;
  status_aktif: string;
  alasan_tms?: string | null;
  coklit_status?: string | null;
  coklit_tanggal?: string | null;
  coklit_catatan?: string | null;
  coklit_petugas?: string | null;
  tahap?: string | null;
  updated_at?: string | null;
}

interface SupabaseAnggotaRow {
  id: string;
  nama_lengkap: string;
  nik: string;
  jabatan: string;
  seksi: string;
  seksi_label: string;
  username: string;
  role: string;
  kontak_wa: string;
  alamat_dusun: string;
  assigned_tps?: string | null;
  status: string;
  sk_penetapan: string;
  foto_url?: string | null;
  password_hash?: string | null;
}

interface SupabaseBalonRow {
  id: string;
  nama_lengkap: string;
  nik: string;
  tempat_tanggal_lahir: string;
  alamat_domisili: string;
  pendidikan_terakhir: string;
  pekerjaan: string;
  tanggal_pendaftaran: string;
  status_berkas: string;
  kelengkapan?: MasterBalonPenjaringan["kelengkapan"] | null;
  catatan_penjaringan?: string | null;
}

interface SupabaseKandidatRow {
  id: string;
  nomor_urut: number;
  nama_lengkap: string;
  gelar_depan?: string | null;
  gelar_belakang?: string | null;
  tempat_tanggal_lahir: string;
  pendidikan_terakhir: string;
  pekerjaan: string;
  tagline: string;
  visi: string;
  misi?: string[] | null;
  program_unggulan?: string[] | null;
  foto_url: string;
  warna_tema?: string | null;
  status_verifikasi: string;
}

interface SupabaseVoteCountRow {
  id: string;
  tps_id?: string | null;
  nomor_tps: string;
  nama_tps: string;
  lokasi: string;
  total_dpt: number;
  suara_masuk: number;
  suara_sah: number;
  suara_tidak_sah: number;
  suara_kandidat?: Record<number, number> | null;
  status_pleno_tps: string;
  waktu_input?: string | null;
  petugas_input?: string | null;
}

interface SupabaseAduanRow {
  id: string;
  nomor_aduan: string;
  nama_pelapor: string;
  nik: string;
  nik_masked?: string | null;
  kontak_pelapor: string;
  rt: string;
  rw: string;
  jenis_aduan: string;
  isi_aduan: string;
  status: string;
  catatan_petugas?: string | null;
  tanggal: string;
  tanggal_disetujui?: string | null;
}

interface SupabaseAuditRow {
  id: string;
  aksi: string;
  entity?: string | null;
  user_name: string;
  role: string;
  detail: string;
  ip_address?: string | null;
  created_at?: string | null;
}

interface SupabasePengumumanRow {
  id: string;
  nomor: string;
  judul: string;
  kategori: string;
  tanggal: string;
  ringkasan: string;
  file_url: string;
  file_name: string;
  file_size: string;
  created_at?: string | null;
  updated_at?: string | null;
}

interface SupabasePetugasDptRow {
  id: string;
  nomor_registrasi?: string;
  nik: string;
  nik_masked?: string | null;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  no_kk: string;
  no_kk_masked?: string | null;
  alamat: string;
  rt: string;
  rw: string;
  dusun?: string;
  desa?: string;
  nomor_wa?: string;
  nomor_whatsapp?: string;
  is_calon_kades: boolean;
  keterangan_calon_kades?: string | null;
  is_tim_sukses: boolean;
  keterangan_tim_sukses?: string | null;
  is_kepentingan_calon?: boolean;
  is_memiliki_kepentingan?: boolean;
  keterangan_kepentingan?: string | null;
  persetujuan_pernyataan?: boolean;
  surat_pernyataan_signed?: boolean;
  tanda_tangan_url?: string;
  surat_pernyataan_url?: string;
  status?: string;
  status_verifikasi?: string;
  catatan_panitia?: string | null;
  catatan_verifikasi?: string | null;
  assigned_wilayah?: string | null;
  tanggal_pendaftaran: string;
  updated_at?: string | null;
  created_at?: string | null;
}

interface SupabaseWebConfigRow {
  id: string;
  nama_desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  lokasi_utama: string;
  lokasi_maps_url: string;
  periode_masa_bakti: string;
  hari_h_tanggal: string;
  running_text: string;
  is_running_text_active: boolean;
  is_cek_hak_pilih_open: boolean;
  is_profil_calon_visible: boolean;
  is_real_count_public: boolean;
  is_aduan_open: boolean;
  kontak_wa_p2kd: string;
  jam_layanan: string;
  alamat_sekretariat: string;
  total_rw: number;
  total_rt: number;
}

interface SupabaseTahapanRow {
  id: string;
  kode_tahapan: string;
  nama_tahapan: string;
  kategori: string;
  status: string;
  is_locked?: boolean | null;
  nomor_berita_acara?: string | null;
  locked_by?: string | null;
  lock_hash?: string | null;
  updated_at?: string | null;
}

/**
 * Direct Live Supabase Cloud Database Client
 * Reads and writes directly to Supabase project
 */
export class SupabaseDbService {
  private static adminClient = getSupabaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static cachedResult: any = null;
  private static lastCacheTimestamp = 0;
  private static CACHE_TTL = 60000; // 60 detik cache dalam memory

  public static invalidateCache() {
    this.lastCacheTimestamp = 0;
    this.cachedResult = null;
  }

  public static async fetchAllData(forceRefresh = false) {
    try {
      const now = Date.now();
      if (!forceRefresh && this.cachedResult && now - this.lastCacheTimestamp < this.CACHE_TTL) {
        return this.cachedResult;
      }

      const client = this.adminClient;

      // 1. Fetch TPS
      const { data: tpsData, error: tpsErr } = await client.from("tps").select("*").order("nomor_tps");
      // 2. Fetch Pemilih (Full 7.787 Records via chunked ranges)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let allPemilih: any[] = [];
      const CHUNK_SIZE = 1000;
      let offset = 0;
      while (true) {
        const { data: chunk, error: chunkErr } = await client
          .from("pemilih")
          .select("*")
          .order("nama_lengkap")
          .range(offset, offset + CHUNK_SIZE - 1);

        if (chunkErr) {
          console.error("Error fetching pemilih chunk at offset", offset, chunkErr);
          break;
        }
        if (!chunk || chunk.length === 0) break;
        allPemilih = allPemilih.concat(chunk);
        if (chunk.length < CHUNK_SIZE) break;
        offset += CHUNK_SIZE;
      }
      const pemilihData = allPemilih;
      // 3. Fetch Anggota P2KD
      const { data: anggotaData, error: agtErr } = await client.from("anggota_p2kd").select("*");
      // 4. Fetch Balon
      const { data: balonData } = await client.from("balon_penjaringan").select("*");
      // 5. Fetch Kandidat
      const { data: kandidatData } = await client.from("kandidat_kades").select("*").order("nomor_urut");
      // 6. Fetch Real Count
      const { data: realCountData } = await client.from("tps_vote_counts").select("*").order("nomor_tps");
      // 7. Fetch Aduan
      const { data: aduanData } = await client.from("aduan_pemilih").select("*").order("created_at", { ascending: false });
      // 8. Fetch Tahapan
      const { data: tahapanData } = await client.from("tahapan").select("*");
      // 9. Fetch Pengumuman
      const { data: pengumumanData } = await client.from("pengumuman").select("*").order("created_at", { ascending: false });
      // 10. Fetch Web Config
      const { data: webConfigData } = await client.from("web_config").select("*").limit(1);
      // 11. Fetch Audit
      const { data: auditData } = await client.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      // 12. Fetch Petugas DPT
      let petugasData: SupabasePetugasDptRow[] | null = null;
      try {
        const { data: pData } = await client.from("pendaftaran_petugas_dpt").select("*").order("tanggal_pendaftaran", { ascending: false });
        petugasData = pData as SupabasePetugasDptRow[];
      } catch (e) {
        console.warn("⚠️ Fetch pendaftaran_petugas_dpt optional fallback:", e);
      }

      if (tpsErr || agtErr) {
        console.warn("⚠️ Database fetch notice:", { tpsErr, agtErr });
      }

      const tpsList: MasterTPS[] = ((tpsData as SupabaseTpsRow[]) || []).map((t) => ({
        id: t.id,
        kodeTps: t.kode_tps,
        nomorTps: t.nomor_tps,
        namaTps: t.nama_tps,
        namaTabung: t.nama_tabung || t.nama_tps,
        lokasi: t.lokasi,
        alamat: t.alamat,
        rt: t.rt || "01",
        rw: t.rw || "01",
        kuotaMaksimal: t.kuota_maksimal,
        status: (t.status as "AKTIF" | "NONAKTIF") || "AKTIF",
      })).sort((a, b) => {
        const numA = parseInt((a.rw || a.nomorTps || "").replace(/\D/g, ""), 10) || 0;
        const numB = parseInt((b.rw || b.nomorTps || "").replace(/\D/g, ""), 10) || 0;
        return numA - numB;
      });

      const pemilihList: MasterPemilih[] = ((pemilihData as SupabasePemilihRow[]) || []).map((p) => ({
        id: p.id,
        nik: p.nik,
        nikMasked: maskNIK(p.nik),
        kk: p.no_kk,
        namaLengkap: p.nama_lengkap,
        tempatLahir: p.tempat_lahir,
        tanggalLahir: p.tanggal_lahir,
        jenisKelamin: String(p.jenis_kelamin || "L").toUpperCase().startsWith("L") ? "L" : "P",
        statusPerkawinan: (p.status_perkawinan as "B" | "S" | "P") || "S",
        alamat: p.alamat,
        rt: p.rt,
        rw: p.rw,
        desa: p.desa,
        kecamatan: p.kecamatan,
        tps: p.tps,
        statusAktif: (p.status_aktif as MasterPemilih["statusAktif"]) || "AKTIF",
        alasanTms: p.alasan_tms || undefined,
        coklitStatus: (p.coklit_status as MasterPemilih["coklitStatus"]) || "BELUM_COKLIT",
        coklitTanggal: p.coklit_tanggal || undefined,
        coklitCatatan: p.coklit_catatan || undefined,
        coklitPetugas: p.coklit_petugas || undefined,
        tahap: (p.tahap as "DPS" | "DPT") || "DPS",
        updatedAt: p.updated_at || new Date().toISOString(),
      }));

      const anggotaList: MasterAnggotaP2KD[] = ((anggotaData as SupabaseAnggotaRow[]) || []).map((a) => ({
        id: a.id,
        namaLengkap: a.nama_lengkap,
        nik: a.nik,
        jabatan: a.jabatan,
        seksi: a.seksi as MasterAnggotaP2KD["seksi"],
        seksiLabel: a.seksi_label,
        username: a.username,
        role: a.role,
        kontakWa: a.kontak_wa,
        alamatDusun: a.alamat_dusun,
        assignedTps: a.assigned_tps || "SEMUA",
        status: (a.status as "AKTIF" | "NONAKTIF") || "AKTIF",
        skPenetapan: a.sk_penetapan,
        fotoUrl: a.foto_url || undefined,
        passwordHash: a.password_hash || undefined,
      }));

      const balonList: MasterBalonPenjaringan[] = ((balonData as SupabaseBalonRow[]) || []).map((b) => ({
        id: b.id,
        namaLengkap: b.nama_lengkap,
        nik: b.nik,
        tempatTanggalLahir: b.tempat_tanggal_lahir,
        alamatDomisili: b.alamat_domisili,
        pendidikanTerakhir: b.pendidikan_terakhir,
        pekerjaan: b.pekerjaan,
        tanggalPendaftaran: b.tanggal_pendaftaran,
        statusBerkas: (b.status_berkas as MasterBalonPenjaringan["statusBerkas"]) || "BELUM_LENGKAP",
        kelengkapan: b.kelengkapan || {
          suratLamaran: true,
          ktpDanKk: true,
          ijazahLegalisir: true,
          skck: true,
          bebasNarkoba: true,
          keteranganSehat: true,
          keteranganPengadilan: true,
          pernyataanSetia: true,
        },
        catatanPenjaringan: b.catatan_penjaringan || "",
      }));

      const kandidatList: MasterKandidat[] = ((kandidatData as SupabaseKandidatRow[]) || []).map((k) => ({
        id: k.id,
        nomorUrut: k.nomor_urut,
        namaLengkap: k.nama_lengkap,
        gelarDepan: k.gelar_depan || "",
        gelarBelakang: k.gelar_belakang || "",
        tempatTanggalLahir: k.tempat_tanggal_lahir,
        pendidikanTerakhir: k.pendidikan_terakhir,
        pekerjaan: k.pekerjaan,
        tagline: k.tagline,
        visi: k.visi,
        misi: Array.isArray(k.misi) ? k.misi : [],
        programUnggulan: Array.isArray(k.program_unggulan) ? k.program_unggulan : [],
        fotoUrl: k.foto_url,
        warnaTema: k.warna_tema || "#2563eb",
        statusVerifikasi: (k.status_verifikasi as MasterKandidat["statusVerifikasi"]) || "DITETAPKAN",
      }));

      const tpsVoteCounts: MasterTpsVoteCount[] = ((realCountData as SupabaseVoteCountRow[]) || []).map((r) => ({
        tpsId: r.tps_id || r.id,
        nomorTps: r.nomor_tps,
        namaTps: r.nama_tps,
        lokasi: r.lokasi,
        totalDpt: r.total_dpt,
        suaraMasuk: r.suara_masuk,
        suaraSah: r.suara_sah,
        suaraTidakSah: r.suara_tidak_sah,
        suaraKandidat: (r.suara_kandidat as Record<number, number>) || {},
        statusPlenoTps: (r.status_pleno_tps as "BELUM" | "SELESAI") || "BELUM",
        waktuInput: r.waktu_input || undefined,
        petugasInput: r.petugas_input || undefined,
      }));

      const aduanList: MasterAduan[] = ((aduanData as SupabaseAduanRow[]) || []).map((a) => ({
        id: a.id,
        nomorAduan: a.nomor_aduan,
        namaPelapor: a.nama_pelapor,
        nik: a.nik,
        nikMasked: a.nik_masked || maskNIK(a.nik),
        kontakPelapor: a.kontak_pelapor,
        rt: a.rt,
        rw: a.rw,
        jenisAduan: (a.jenis_aduan as MasterAduan["jenisAduan"]) || "BELUM_TERDAFTAR",
        isiAduan: a.isi_aduan,
        status: (a.status as MasterAduan["status"]) || "MENUNGGU",
        catatanPetugas: a.catatan_petugas || undefined,
        tanggal: a.tanggal,
        tanggalDisetujui: a.tanggal_disetujui || undefined,
      }));

      const auditLogs: AuditLogItem[] = ((auditData as SupabaseAuditRow[]) || []).map((l) => ({
        id: l.id,
        aksi: l.aksi,
        entity: l.entity || "SYSTEM",
        user: l.user_name,
        role: l.role,
        target: l.entity || "SYSTEM",
        detail: l.detail,
        ipAddress: l.ip_address || "127.0.0.1",
        waktu: new Date(l.created_at || Date.now()).toLocaleString("id-ID"),
      }));

      let tahapanState: SystemTahapan | null = null;
      if (tahapanData && tahapanData.length > 0) {
        const dptTahapan = (tahapanData as SupabaseTahapanRow[]).find((t) => t.kode_tahapan === "THP-PENETAPAN-DPT");
        tahapanState = {
          dpsStatus: "SELESAI",
          dpshpStatus: "AKTIF",
          dptStatus: dptTahapan?.status === "SELESAI" ? "DIKUNCI" : "DRAFT",
          isDptLocked: Boolean(dptTahapan?.is_locked),
          nomorBeritaAcara: dptTahapan?.nomor_berita_acara || "BA/01/P2KD-KLS/VIII/2026",
          lockedBy: dptTahapan?.locked_by || undefined,
          lockTimestamp: dptTahapan?.updated_at || undefined,
          lockHashSignature: dptTahapan?.lock_hash || undefined,
        };
      }

      const pengumumanList: MasterPengumuman[] = ((pengumumanData as SupabasePengumumanRow[]) || []).map((p) => ({
        id: p.id,
        nomor: p.nomor,
        judul: p.judul,
        kategori: p.kategori,
        tanggal: p.tanggal,
        ringkasan: p.ringkasan,
        fileUrl: p.file_url,
        fileName: p.file_name,
        fileSize: p.file_size,
        createdAt: p.created_at || undefined,
        updatedAt: p.updated_at || undefined,
      }));

      let webConfig: PublicWebConfig | null = null;
      if (webConfigData && webConfigData.length > 0) {
        const c = webConfigData[0] as SupabaseWebConfigRow;
        webConfig = {
          namaDesa: c.nama_desa,
          kecamatan: c.kecamatan,
          kabupaten: c.kabupaten,
          provinsi: c.provinsi,
          lokasiUtama: c.lokasi_utama,
          lokasiMapsUrl: c.lokasi_maps_url,
          periodeMasaBakti: c.periode_masa_bakti,
          hariHTanggal: c.hari_h_tanggal,
          runningText: c.running_text,
          isRunningTextActive: Boolean(c.is_running_text_active),
          isCekHakPilihOpen: Boolean(c.is_cek_hak_pilih_open),
          isProfilCalonVisible: Boolean(c.is_profil_calon_visible),
          isRealCountPublic: Boolean(c.is_real_count_public),
          isAduanOpen: Boolean(c.is_aduan_open),
          kontakWaP2kd: c.kontak_wa_p2kd,
          jamLayanan: c.jam_layanan,
          alamatSekretariat: c.alamat_sekretariat,
          totalRw: c.total_rw || 13,
          totalRt: c.total_rt || 39,
          skP2KD: (c as unknown as Record<string, string>).sk_p2kd || "Keputusan BPD Desa Kalisalak No. 04/BPD-KLS/VII/2026",
          skPenetapanBalon: (c as unknown as Record<string, string>).sk_penetapan_balon || "Keputusan P2KD No. 05/P2KD-KLS/VIII/2026",
          skPenetapanCalon: (c as unknown as Record<string, string>).sk_penetapan_calon || "Keputusan P2KD No. 06/P2KD-KLS/IX/2026",
          skPenetapanDPT: (c as unknown as Record<string, string>).sk_penetapan_dpt || "Berita Acara & Keputusan P2KD No. 07/BA-DPT/X/2026",
          perbupPilkades: (c as unknown as Record<string, string>).perbup_pilkades || "Perda No. 2/2015 & Perbup Tegal No. 27/2018 jo PP No. 16/2026",
        };
      }

      const petugasDptList: MasterPetugasDpt[] = ((petugasData as SupabasePetugasDptRow[]) || []).map((p) => ({
        id: p.id,
        nomorRegistrasi: p.nomor_registrasi || `PTG-${p.id.slice(0, 8)}`,
        nik: p.nik,
        nikMasked: p.nik_masked || maskNIK(p.nik),
        namaLengkap: p.nama_lengkap,
        tempatLahir: p.tempat_lahir,
        tanggalLahir: p.tanggal_lahir,
        jenisKelamin: (p.jenis_kelamin as "L" | "P") || "L",
        noKk: p.no_kk,
        noKkMasked: p.no_kk_masked || maskKK(p.no_kk),
        alamat: p.alamat,
        rt: p.rt,
        rw: p.rw,
        dusun: p.dusun || p.desa || "Kalisalak",
        nomorWa: p.nomor_whatsapp || p.nomor_wa || "",
        isCalonKades: Boolean(p.is_calon_kades),
        keteranganCalonKades: p.keterangan_calon_kades || undefined,
        isTimSukses: Boolean(p.is_tim_sukses),
        keteranganTimSukses: p.keterangan_tim_sukses || undefined,
        isKepentinganCalon: Boolean(p.is_memiliki_kepentingan ?? p.is_kepentingan_calon),
        keteranganKepentingan: p.keterangan_kepentingan || undefined,
        persetujuanPernyataan: Boolean(p.surat_pernyataan_signed ?? p.persetujuan_pernyataan),
        tandaTanganUrl: p.surat_pernyataan_url || p.tanda_tangan_url || "",
        status: ((p.status_verifikasi || p.status || "MENUNGGU_VERIFIKASI") as MasterPetugasDpt["status"]),
        catatanPanitia: p.catatan_verifikasi || p.catatan_panitia || undefined,
        assignedWilayah: p.assigned_wilayah || (p.rw ? `RW ${p.rw}` : undefined),
        tanggalPendaftaran: p.tanggal_pendaftaran,
        updatedAt: p.updated_at || p.created_at || p.tanggal_pendaftaran,
      }));

      const resultObj = {
        success: true,
        data: {
          tpsList,
          pemilihList,
          anggotaList,
          balonList,
          petugasDptList,
          kandidatList,
          tpsVoteCounts,
          aduanList,
          pengumumanList,
          webConfig,
          auditLogs,
          tahapanState,
        },
      };
      this.cachedResult = resultObj;
      this.lastCacheTimestamp = Date.now();
      return resultObj;
    } catch (err) {
      console.error("Gagal sinkronisasi dengan Supabase Cloud:", err);
      return { success: false, error: err };
    }
  }

  /**
   * Ultra-Fast Single NIK Lookup directly from indexed Postgres (< 20ms)
   */
  public static async findPemilihDirect(nik: string): Promise<MasterPemilih | null> {
    try {
      const clean = String(nik || "").replace(/[^0-9]/g, "");
      if (clean.length !== 16) return null;

      const { data, error } = await this.adminClient
        .from("pemilih")
        .select("*")
        .eq("nik", clean)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      const p = data as SupabasePemilihRow;
      return {
        id: p.id,
        nik: p.nik,
        nikMasked: maskNIK(p.nik),
        kk: p.no_kk,
        namaLengkap: p.nama_lengkap,
        tempatLahir: p.tempat_lahir,
        tanggalLahir: p.tanggal_lahir,
        jenisKelamin: String(p.jenis_kelamin || "L").toUpperCase().startsWith("L") ? "L" : "P",
        statusPerkawinan: (p.status_perkawinan as "B" | "S" | "P") || "S",
        alamat: p.alamat,
        rt: p.rt,
        rw: p.rw,
        desa: p.desa,
        kecamatan: p.kecamatan,
        tps: p.tps,
        statusAktif: (p.status_aktif as MasterPemilih["statusAktif"]) || "AKTIF",
        alasanTms: p.alasan_tms || undefined,
        coklitStatus: (p.coklit_status as MasterPemilih["coklitStatus"]) || "BELUM_COKLIT",
        coklitTanggal: p.coklit_tanggal || undefined,
        coklitCatatan: p.coklit_catatan || undefined,
        coklitPetugas: p.coklit_petugas || undefined,
        tahap: (p.tahap as "DPS" | "DPT") || "DPS",
        updatedAt: p.updated_at || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Promosi / Pindahkan Pemilih dari DPS ke DPT (atau kembalikan ke DPS).
   */
  public static async promotePemilihToDpt(
    ids: string[],
    user = "Petugas P2KD",
    targetTahap: "DPS" | "DPT" = "DPT"
  ): Promise<{ success: boolean; count: number }> {
    try {
      if (!ids || ids.length === 0) return { success: false, count: 0 };

      const { data, error } = await this.adminClient
        .from("pemilih")
        .update({
          tahap: targetTahap,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids)
        .select("id");

      if (error) {
        console.error("Error updating pemilih tahap in Supabase:", error);
        return { success: false, count: 0 };
      }

      this.invalidateCache();

      // Log Audit
      await this.adminClient.from("audit_logs").insert({
        user_name: user,
        role: "ADMIN / SEKSI PEMILIH",
        aksi: targetTahap === "DPT" ? "VERIFIKASI_MASUK_DPT" : "KEMBALIKAN_KE_DPS",
        entity: "PEMILIH",
        target: `${ids.length} Pemilih`,
        detail: `Berhasil mengubah status tahap ${ids.length} pemilih menjadi ${targetTahap}.`,
        ip_address: "127.0.0.1",
      });

      return { success: true, count: (data || []).length };
    } catch (err) {
      console.error("Exception promotePemilihToDpt:", err);
      return { success: false, count: 0 };
    }
  }

  /**
   * Update Status Coklit Pemilih di Supabase Cloud
   */
  public static async updateCoklitStatus(
    voterId: string,
    status: "SESUAI" | "UBAH_DATA" | "TMS" | "BELUM_COKLIT",
    catatan = "",
    petugas = "Koordinator RW"
  ): Promise<boolean> {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const payload: Record<string, unknown> = {
        coklit_status: status,
        coklit_tanggal: status === "BELUM_COKLIT" ? null : todayStr,
        coklit_catatan: catatan || null,
        coklit_petugas: status === "BELUM_COKLIT" ? null : petugas,
        updated_at: new Date().toISOString(),
      };

      if (status === "TMS") {
        payload.status_aktif = "TMS";
        payload.alasan_tms = catatan || "Dinyatakan TMS saat Coklit Lapangan";
      } else if (status === "SESUAI" || status === "UBAH_DATA") {
        payload.status_aktif = "AKTIF";
        payload.tahap = "DPT"; // Otomatis promosikan ke DPT
      }

      const { error } = await this.adminClient
        .from("pemilih")
        .update(payload)
        .eq("id", voterId);

      if (error) {
        console.error("Supabase updateCoklitStatus error:", error);
        return false;
      }

      this.invalidateCache();

      // Audit log
      await this.adminClient.from("audit_logs").insert({
        user_name: petugas,
        role: "KOORDINATOR_RW / PETUGAS",
        aksi: "COKLIT_STATUS_UPDATE",
        entity: "PEMILIH",
        target: voterId,
        detail: `Status Coklit diubah menjadi ${status}. Catatan: ${catatan || "-"}`,
        ip_address: "127.0.0.1",
      });

      return true;
    } catch (err) {
      console.error("Exception in updateCoklitStatus:", err);
      return false;
    }
  }

  /**
   * Cari data pemilih untuk verifikasi scan QR Code C6
   */
  public static async findPemilihForC6Verification(id?: string, nik?: string): Promise<MasterPemilih | null> {
    try {
      const client = this.adminClient;
      let query = client.from("pemilih").select("*").limit(1);

      if (id) {
        query = query.eq("id", id);
      } else if (nik) {
        query = query.eq("nik", nik);
      } else {
        return null;
      }

      const { data, error } = await query.maybeSingle();
      if (error || !data) return null;

      const p = data as SupabasePemilihRow;
      return {
        id: p.id,
        nik: p.nik,
        nikMasked: p.nik ? `${p.nik.slice(0, 1)}*************${p.nik.slice(-2)}` : "****************",
        kk: p.no_kk,
        namaLengkap: p.nama_lengkap,
        tempatLahir: p.tempat_lahir,
        tanggalLahir: p.tanggal_lahir,
        jenisKelamin: String(p.jenis_kelamin || "L").toUpperCase().startsWith("L") ? "L" : "P",
        statusPerkawinan: (p.status_perkawinan as "B" | "S" | "P") || "S",
        alamat: p.alamat,
        rt: p.rt,
        rw: p.rw,
        desa: p.desa,
        kecamatan: p.kecamatan,
        tps: p.tps,
        statusAktif: (p.status_aktif as MasterPemilih["statusAktif"]) || "AKTIF",
        alasanTms: p.alasan_tms || undefined,
        coklitStatus: (p.coklit_status as MasterPemilih["coklitStatus"]) || "BELUM_COKLIT",
        coklitTanggal: p.coklit_tanggal || undefined,
        coklitCatatan: p.coklit_catatan || undefined,
        coklitPetugas: p.coklit_petugas || undefined,
        tahap: (p.tahap as "DPS" | "DPT") || "DPS",
        updatedAt: p.updated_at || new Date().toISOString(),
      };
    } catch (err) {
      console.error("Error finding pemilih for C6 verify:", err);
      return null;
    }
  }

  // --- Async Write Operations to Supabase Cloud ---
  public static async insertAnggota(data: MasterAnggotaP2KD) {
    try {
      this.invalidateCache();
      await this.adminClient.from("anggota_p2kd").insert({
        id: data.id,
        nama_lengkap: data.namaLengkap,
        nik: data.nik,
        jabatan: data.jabatan,
        seksi: data.seksi,
        seksi_label: data.seksiLabel,
        username: data.username,
        role: data.role,
        kontak_wa: data.kontakWa,
        alamat_dusun: data.alamatDusun,
        assigned_tps: data.assignedTps,
        status: data.status,
        sk_penetapan: data.skPenetapan,
        foto_url: data.fotoUrl,
        password_hash: data.passwordHash,
      });
    } catch (err) {
      console.warn("Supabase insertAnggota background sync failed:", err);
    }
  }

  public static async updateAnggota(id: string, data: Partial<MasterAnggotaP2KD>) {
    try {
      this.invalidateCache();
      const updatePayload: Record<string, string | undefined> = {};
      if (data.namaLengkap) updatePayload.nama_lengkap = data.namaLengkap;
      if (data.nik) updatePayload.nik = data.nik;
      if (data.jabatan) updatePayload.jabatan = data.jabatan;
      if (data.seksi) updatePayload.seksi = data.seksi;
      if (data.seksiLabel) updatePayload.seksi_label = data.seksiLabel;
      if (data.username) updatePayload.username = data.username;
      if (data.role) updatePayload.role = data.role;
      if (data.kontakWa) updatePayload.kontak_wa = data.kontakWa;
      if (data.alamatDusun) updatePayload.alamat_dusun = data.alamatDusun;
      if (data.assignedTps) updatePayload.assigned_tps = data.assignedTps;
      if (data.status) updatePayload.status = data.status;
      if (data.fotoUrl !== undefined) updatePayload.foto_url = data.fotoUrl;
      if (data.passwordHash !== undefined) updatePayload.password_hash = data.passwordHash;

      await this.adminClient.from("anggota_p2kd").update(updatePayload).eq("id", id);
    } catch (err) {
      console.warn("Supabase updateAnggota background sync failed:", err);
    }
  }

  public static async deleteAnggota(id: string): Promise<boolean> {
    try {
      this.invalidateCache();
      const { error } = await this.adminClient.from("anggota_p2kd").delete().eq("id", id);
      if (error) {
        console.error("Supabase deleteAnggota error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase deleteAnggota background sync failed:", err);
      return false;
    }
  }

  public static async insertPemilih(data: MasterPemilih) {
    try {
      this.invalidateCache();
      await this.adminClient.from("pemilih").insert({
        id: data.id,
        nik: data.nik,
        no_kk: data.kk,
        nama_lengkap: data.namaLengkap,
        tempat_lahir: data.tempatLahir,
        tanggal_lahir: data.tanggalLahir,
        jenis_kelamin: data.jenisKelamin,
        status_perkawinan: data.statusPerkawinan,
        alamat: data.alamat,
        rt: data.rt,
        rw: data.rw,
        desa: data.desa,
        kecamatan: data.kecamatan,
        tps: data.tps,
        status_aktif: data.statusAktif,
        alasan_tms: data.alasanTms,
        coklit_status: data.coklitStatus || "BELUM_COKLIT",
      });
    } catch (err) {
      console.warn("Supabase insertPemilih sync failed:", err);
    }
  }

  public static async insertPemilihBatch(dataList: MasterPemilih[]) {
    try {
      this.invalidateCache();
      const chunkSize = 100;
      for (let i = 0; i < dataList.length; i += chunkSize) {
        const chunk = dataList.slice(i, i + chunkSize);
        const rows = chunk.map((data) => ({
          id: data.id,
          nik: data.nik,
          no_kk: data.kk,
          nama_lengkap: data.namaLengkap,
          tempat_lahir: data.tempatLahir,
          tanggal_lahir: data.tanggalLahir,
          jenis_kelamin: data.jenisKelamin,
          status_perkawinan: data.statusPerkawinan,
          alamat: data.alamat,
          rt: data.rt,
          rw: data.rw,
          desa: data.desa,
          kecamatan: data.kecamatan,
          tps: data.tps,
          status_aktif: data.statusAktif,
          alasan_tms: data.alasanTms,
          coklit_status: data.coklitStatus || "BELUM_COKLIT",
        }));
        await this.adminClient.from("pemilih").insert(rows);
      }
    } catch (err) {
      console.warn("Supabase insertPemilihBatch sync failed:", err);
    }
  }

  public static async updatePemilih(id: string, data: Partial<MasterPemilih>) {
    try {
      this.invalidateCache();
      const payload: Record<string, string | undefined> = { updated_at: new Date().toISOString() };
      if (data.namaLengkap) payload.nama_lengkap = data.namaLengkap;
      if (data.nik) payload.nik = data.nik;
      if (data.kk) payload.no_kk = data.kk;
      if (data.tps) payload.tps = data.tps;
      if (data.rt) payload.rt = data.rt;
      if (data.rw) payload.rw = data.rw;
      if (data.alamat) payload.alamat = data.alamat;
      if (data.statusAktif) payload.status_aktif = data.statusAktif;
      if (data.alasanTms !== undefined) payload.alasan_tms = data.alasanTms;
      if (data.coklitStatus) payload.coklit_status = data.coklitStatus;
      if (data.coklitTanggal !== undefined) payload.coklit_tanggal = data.coklitTanggal;
      if (data.coklitCatatan !== undefined) payload.coklit_catatan = data.coklitCatatan;
      if (data.coklitPetugas !== undefined) payload.coklit_petugas = data.coklitPetugas;

      await this.adminClient.from("pemilih").update(payload).eq("id", id);
    } catch (err) {
      console.warn("Supabase updatePemilih sync failed:", err);
    }
  }

  public static async deletePemilih(id: string): Promise<boolean> {
    try {
      this.invalidateCache();
      const { error } = await this.adminClient.from("pemilih").delete().eq("id", id);
      if (error) {
        console.error("Supabase deletePemilih error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase deletePemilih sync failed:", err);
      return false;
    }
  }

  public static async insertTps(data: MasterTPS) {
    try {
      this.invalidateCache();
      await this.adminClient.from("tps").insert({
        id: data.id,
        kode_tps: data.kodeTps,
        nomor_tps: data.nomorTps,
        nama_tps: data.namaTps,
        lokasi: data.lokasi,
        alamat: data.alamat,
        rt: data.rt,
        rw: data.rw,
        kuota_maksimal: data.kuotaMaksimal,
        status: data.status,
      });
    } catch (err) {
      console.warn("Supabase insertTps sync failed:", err);
    }
  }

  public static async updateTps(id: string, data: Partial<MasterTPS>) {
    try {
      this.invalidateCache();
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.kodeTps) payload.kode_tps = data.kodeTps;
      if (data.nomorTps) payload.nomor_tps = data.nomorTps;
      if (data.namaTps) payload.nama_tps = data.namaTps;
      if (data.lokasi) payload.lokasi = data.lokasi;
      if (data.alamat) payload.alamat = data.alamat;
      if (data.rt !== undefined) payload.rt = data.rt;
      if (data.rw !== undefined) payload.rw = data.rw;
      if (data.kuotaMaksimal !== undefined) payload.kuota_maksimal = data.kuotaMaksimal;
      if (data.status) payload.status = data.status;

      await this.adminClient.from("tps").update(payload).eq("id", id);
    } catch (err) {
      console.warn("Supabase updateTps sync failed:", err);
    }
  }

  public static async deleteTps(id: string): Promise<boolean> {
    try {
      this.invalidateCache();
      const { error } = await this.adminClient.from("tps").delete().eq("id", id);
      if (error) {
        console.error("Supabase deleteTps error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase deleteTps sync failed:", err);
      return false;
    }
  }

  public static async insertAuditLog(log: AuditLogItem) {
    try {
      await this.adminClient.from("audit_logs").insert({
        id: log.id,
        aksi: log.aksi,
        entity: log.entity,
        user_name: log.user,
        role: log.role,
        detail: log.detail,
        ip_address: log.ipAddress,
      });
    } catch (err) {
      console.warn("Supabase insertAuditLog sync failed:", err);
    }
  }

  public static async insertBalon(data: MasterBalonPenjaringan) {
    try {
      await this.adminClient.from("balon_penjaringan").insert({
        id: data.id,
        nama_lengkap: data.namaLengkap,
        nik: data.nik,
        tempat_tanggal_lahir: data.tempatTanggalLahir,
        alamat_domisili: data.alamatDomisili,
        pendidikan_terakhir: data.pendidikanTerakhir,
        pekerjaan: data.pekerjaan,
        tanggal_pendaftaran: data.tanggalPendaftaran,
        status_berkas: data.statusBerkas,
        kelengkapan: data.kelengkapan,
        catatan_penjaringan: data.catatanPenjaringan,
      });
    } catch (err) {
      console.warn("Supabase insertBalon sync failed:", err);
    }
  }

  public static async updateBalon(id: string, data: Partial<MasterBalonPenjaringan>) {
    try {
      const payload: Record<string, unknown> = {};
      if (data.namaLengkap) payload.nama_lengkap = data.namaLengkap;
      if (data.nik) payload.nik = data.nik;
      if (data.statusBerkas) payload.status_berkas = data.statusBerkas;
      if (data.kelengkapan) payload.kelengkapan = data.kelengkapan;
      if (data.catatanPenjaringan !== undefined) payload.catatan_penjaringan = data.catatanPenjaringan;

      await this.adminClient.from("balon_penjaringan").update(payload).eq("id", id);
    } catch (err) {
      console.warn("Supabase updateBalon sync failed:", err);
    }
  }

  public static async deleteBalon(id: string) {
    try {
      await this.adminClient.from("balon_penjaringan").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase deleteBalon sync failed:", err);
    }
  }

  public static async insertPetugasDpt(data: MasterPetugasDpt): Promise<boolean> {
    try {
      this.invalidateCache();

      // Ensure tanggal_pendaftaran is a valid ISO timestamp format for PostgreSQL timestamptz column
      let tanggalPendaftaranIso = new Date().toISOString();
      if (data.tanggalPendaftaran) {
        const parsed = Date.parse(data.tanggalPendaftaran);
        if (!isNaN(parsed)) {
          tanggalPendaftaranIso = new Date(parsed).toISOString();
        } else {
          // Attempt parsing locale date format like "13 Sep 2026, 16.51"
          const normalized = data.tanggalPendaftaran.replace(/,/g, "").replace(/\./g, ":");
          const p2 = Date.parse(normalized);
          if (!isNaN(p2)) {
            tanggalPendaftaranIso = new Date(p2).toISOString();
          }
        }
      }

      const payload = {
        id: data.id,
        nomor_registrasi: data.nomorRegistrasi,
        nik: data.nik,
        nik_masked: data.nikMasked,
        nama_lengkap: data.namaLengkap,
        tempat_lahir: data.tempatLahir,
        tanggal_lahir: data.tanggalLahir,
        jenis_kelamin: data.jenisKelamin,
        no_kk: data.noKk,
        no_kk_masked: data.noKkMasked,
        alamat: data.alamat,
        rt: data.rt,
        rw: data.rw,
        dusun: data.dusun || "Desa Kalisalak",
        desa: data.dusun || "Desa Kalisalak",
        nomor_wa: data.nomorWa,
        nomor_whatsapp: data.nomorWa,
        is_calon_kades: Boolean(data.isCalonKades),
        keterangan_calon_kades: data.keteranganCalonKades || null,
        is_tim_sukses: Boolean(data.isTimSukses),
        keterangan_tim_sukses: data.keteranganTimSukses || null,
        is_kepentingan_calon: Boolean(data.isKepentinganCalon),
        is_memiliki_kepentingan: Boolean(data.isKepentinganCalon),
        keterangan_kepentingan: data.keteranganKepentingan || null,
        persetujuan_pernyataan: Boolean(data.persetujuanPernyataan),
        surat_pernyataan_signed: Boolean(data.persetujuanPernyataan),
        tanda_tangan_url: data.tandaTanganUrl || null,
        surat_pernyataan_url: data.tandaTanganUrl || null,
        status: data.status,
        status_verifikasi: data.status,
        catatan_panitia: data.catatanPanitia || null,
        catatan_verifikasi: data.catatanPanitia || null,
        assigned_wilayah: data.assignedWilayah || null,
        tanggal_pendaftaran: tanggalPendaftaranIso,
        created_at: new Date().toISOString(),
        updated_at: data.updatedAt || new Date().toISOString(),
      };

      const { error } = await this.adminClient.from("pendaftaran_petugas_dpt").insert(payload);
      if (error) {
        console.error("Supabase insertPetugasDpt error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Supabase insertPetugasDpt exception:", err);
      return false;
    }
  }

  public static async updatePetugasDpt(id: string, data: Partial<MasterPetugasDpt>): Promise<boolean> {
    try {
      this.invalidateCache();
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (data.namaLengkap !== undefined) payload.nama_lengkap = data.namaLengkap;
      if (data.nik !== undefined) {
        payload.nik = data.nik;
        payload.nik_masked = data.nik.length >= 16 ? `${data.nik.slice(0, 1)}*************${data.nik.slice(-2)}` : data.nik;
      }
      if (data.noKk !== undefined) {
        payload.no_kk = data.noKk;
        payload.no_kk_masked = data.noKk.length >= 16 ? `${data.noKk.slice(0, 1)}*************${data.noKk.slice(-2)}` : data.noKk;
      }
      if (data.tempatLahir !== undefined) payload.tempat_lahir = data.tempatLahir;
      if (data.tanggalLahir !== undefined) payload.tanggal_lahir = data.tanggalLahir;
      if (data.jenisKelamin !== undefined) payload.jenis_kelamin = data.jenisKelamin;
      if (data.alamat !== undefined) payload.alamat = data.alamat;
      if (data.rt !== undefined) payload.rt = data.rt;
      if (data.rw !== undefined) payload.rw = data.rw;
      if (data.dusun !== undefined) payload.dusun = data.dusun;
      if (data.nomorWa !== undefined) {
        payload.nomor_wa = data.nomorWa;
        payload.nomor_whatsapp = data.nomorWa;
      }
      if (data.isCalonKades !== undefined) payload.is_calon_kades = data.isCalonKades;
      if (data.keteranganCalonKades !== undefined) payload.keterangan_calon_kades = data.keteranganCalonKades;
      if (data.isTimSukses !== undefined) payload.is_tim_sukses = data.isTimSukses;
      if (data.keteranganTimSukses !== undefined) payload.keterangan_tim_sukses = data.keteranganTimSukses;
      if (data.isKepentinganCalon !== undefined) {
        payload.is_kepentingan_calon = data.isKepentinganCalon;
        payload.is_memiliki_kepentingan = data.isKepentinganCalon;
      }
      if (data.keteranganKepentingan !== undefined) payload.keterangan_kepentingan = data.keteranganKepentingan;
      if (data.persetujuanPernyataan !== undefined) {
        payload.persetujuan_pernyataan = data.persetujuanPernyataan;
        payload.surat_pernyataan_signed = data.persetujuanPernyataan;
      }
      if (data.tandaTanganUrl !== undefined) {
        payload.tanda_tangan_url = data.tandaTanganUrl;
        payload.surat_pernyataan_url = data.tandaTanganUrl;
      }
      if (data.status !== undefined) {
        payload.status_verifikasi = data.status;
        payload.status = data.status;
      }
      if (data.catatanPanitia !== undefined) {
        payload.catatan_verifikasi = data.catatanPanitia;
        payload.catatan_panitia = data.catatanPanitia;
      }
      if (data.assignedWilayah !== undefined) {
        payload.assigned_wilayah = data.assignedWilayah;
      }

      const { error } = await this.adminClient.from("pendaftaran_petugas_dpt").update(payload).eq("id", id);
      if (error) {
        console.error("Supabase updatePetugasDpt error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Supabase updatePetugasDpt sync failed:", err);
      return false;
    }
  }

  public static async deletePetugasDpt(id: string): Promise<boolean> {
    try {
      this.invalidateCache();
      const { error } = await this.adminClient.from("pendaftaran_petugas_dpt").delete().eq("id", id);
      if (error) {
        console.error("Supabase deletePetugasDpt error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Supabase deletePetugasDpt sync failed:", err);
      return false;
    }
  }

  public static async insertKandidat(data: MasterKandidat) {
    try {
      await this.adminClient.from("kandidat_kades").insert({
        id: data.id,
        nomor_urut: data.nomorUrut,
        nama_lengkap: data.namaLengkap,
        gelar_depan: data.gelarDepan,
        gelar_belakang: data.gelarBelakang,
        tempat_tanggal_lahir: data.tempatTanggalLahir,
        pendidikan_terakhir: data.pendidikanTerakhir,
        pekerjaan: data.pekerjaan,
        tagline: data.tagline,
        visi: data.visi,
        misi: data.misi,
        program_unggulan: data.programUnggulan,
        foto_url: data.fotoUrl,
        warna_tema: data.warnaTema,
        status_verifikasi: data.statusVerifikasi,
      });
    } catch (err) {
      console.warn("Supabase insertKandidat sync failed:", err);
    }
  }

  public static async updateKandidat(id: string, data: Partial<MasterKandidat>) {
    try {
      const payload: Record<string, unknown> = {};
      if (data.namaLengkap) payload.nama_lengkap = data.namaLengkap;
      if (data.nomorUrut !== undefined) payload.nomor_urut = data.nomorUrut;
      if (data.visi) payload.visi = data.visi;
      if (data.misi) payload.misi = data.misi;
      if (data.programUnggulan) payload.program_unggulan = data.programUnggulan;
      if (data.fotoUrl) payload.foto_url = data.fotoUrl;
      if (data.statusVerifikasi) payload.status_verifikasi = data.statusVerifikasi;

      await this.adminClient.from("kandidat_kades").update(payload).eq("id", id);
    } catch (err) {
      console.warn("Supabase updateKandidat sync failed:", err);
    }
  }

  public static async deleteKandidat(id: string) {
    try {
      await this.adminClient.from("kandidat_kades").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase deleteKandidat sync failed:", err);
    }
  }

  public static async insertAduan(data: MasterAduan) {
    try {
      await this.adminClient.from("aduan_pemilih").insert({
        id: data.id,
        nomor_aduan: data.nomorAduan,
        nama_pelapor: data.namaPelapor,
        nik: data.nik,
        nik_masked: data.nikMasked,
        kontak_pelapor: data.kontakPelapor,
        rt: data.rt,
        rw: data.rw,
        jenis_aduan: data.jenisAduan,
        isi_aduan: data.isiAduan,
        status: data.status,
        tanggal: data.tanggal,
      });
    } catch (err) {
      console.warn("Supabase insertAduan sync failed:", err);
    }
  }

  public static async updateAduan(id: string, status: string, catatan?: string) {
    try {
      await this.adminClient.from("aduan_pemilih").update({
        status,
        catatan_petugas: catatan,
        tanggal_disetujui: status === "DISETUJUI" ? new Date().toLocaleDateString("id-ID") : null,
      }).eq("id", id);
    } catch (err) {
      console.warn("Supabase updateAduan sync failed:", err);
    }
  }

  public static async updateVoteCount(nomorTps: string, data: { suaraKandidat: Record<number, number>; suaraTidakSah: number; statusPlenoTps: string }) {
    try {
      this.invalidateCache();
      const suaraMasuk = Object.values(data.suaraKandidat).reduce((a, b) => a + b, 0) + data.suaraTidakSah;
      const suaraSah = Object.values(data.suaraKandidat).reduce((a, b) => a + b, 0);

      await this.adminClient.from("tps_vote_counts").upsert({
        id: `vote-${nomorTps}`,
        nomor_tps: nomorTps,
        suara_kandidat: data.suaraKandidat,
        suara_tidak_sah: data.suaraTidakSah,
        suara_sah: suaraSah,
        suara_masuk: suaraMasuk,
        status_pleno_tps: data.statusPlenoTps,
        waktu_input: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "nomor_tps" });
    } catch (err) {
      console.warn("Supabase updateVoteCount sync failed:", err);
    }
  }

  public static async lockDptTahapan(isLocked: boolean, nomorBeritaAcara: string, lockedBy?: string, lockHash?: string) {
    try {
      this.invalidateCache();
      await this.adminClient.from("tahapan").upsert({
        id: "thp-penetapan-dpt",
        kode_tahapan: "THP-PENETAPAN-DPT",
        nama_tahapan: "Penetapan Daftar Pemilih Tetap (DPT)",
        kategori: "PENETAPAN",
        is_locked: isLocked,
        status: isLocked ? "SELESAI" : "AKTIF",
        nomor_berita_acara: nomorBeritaAcara,
        locked_by: lockedBy,
        lock_hash: lockHash,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Supabase lockDptTahapan sync failed:", err);
    }
  }

  public static async insertPengumuman(data: MasterPengumuman) {
    try {
      await this.adminClient.from("pengumuman").insert({
        id: data.id,
        nomor: data.nomor,
        judul: data.judul,
        kategori: data.kategori,
        tanggal: data.tanggal,
        ringkasan: data.ringkasan,
        file_url: data.fileUrl,
        file_name: data.fileName,
        file_size: data.fileSize,
      });
    } catch (err) {
      console.warn("Supabase insertPengumuman sync failed:", err);
    }
  }

  public static async updatePengumuman(id: string, data: Partial<MasterPengumuman>) {
    try {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (data.nomor !== undefined) updatePayload.nomor = data.nomor;
      if (data.judul !== undefined) updatePayload.judul = data.judul;
      if (data.kategori !== undefined) updatePayload.kategori = data.kategori;
      if (data.tanggal !== undefined) updatePayload.tanggal = data.tanggal;
      if (data.ringkasan !== undefined) updatePayload.ringkasan = data.ringkasan;
      if (data.fileUrl !== undefined) updatePayload.file_url = data.fileUrl;
      if (data.fileName !== undefined) updatePayload.file_name = data.fileName;
      if (data.fileSize !== undefined) updatePayload.file_size = data.fileSize;

      await this.adminClient.from("pengumuman").update(updatePayload).eq("id", id);
    } catch (err) {
      console.warn("Supabase updatePengumuman sync failed:", err);
    }
  }

  public static async deletePengumuman(id: string) {
    try {
      await this.adminClient.from("pengumuman").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase deletePengumuman sync failed:", err);
    }
  }

  public static async fetchPengumuman(): Promise<MasterPengumuman[]> {
    try {
      const client = this.adminClient;
      const { data, error } = await client
        .from("pengumuman")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) return [];

      return (data as SupabasePengumumanRow[]).map((p) => ({
        id: p.id,
        nomor: p.nomor,
        judul: p.judul,
        kategori: p.kategori,
        tanggal: p.tanggal,
        ringkasan: p.ringkasan,
        fileUrl: p.file_url,
        fileName: p.file_name,
        fileSize: p.file_size,
        createdAt: p.created_at || undefined,
        updatedAt: p.updated_at || undefined,
      }));
    } catch (err) {
      console.warn("Supabase fetchPengumuman query failed:", err);
      return [];
    }
  }

  public static async saveWebConfig(data: PublicWebConfig) {
    try {
      await this.adminClient.from("web_config").upsert({
        id: "main_config",
        nama_desa: data.namaDesa,
        kecamatan: data.kecamatan,
        kabupaten: data.kabupaten,
        provinsi: data.provinsi,
        lokasi_utama: data.lokasiUtama,
        lokasi_maps_url: data.lokasiMapsUrl,
        periode_masa_bakti: data.periodeMasaBakti,
        hari_h_tanggal: data.hariHTanggal,
        running_text: data.runningText,
        is_running_text_active: data.isRunningTextActive,
        is_cek_hak_pilih_open: data.isCekHakPilihOpen,
        is_profil_calon_visible: data.isProfilCalonVisible,
        is_real_count_public: data.isRealCountPublic,
        is_aduan_open: data.isAduanOpen,
        kontak_wa_p2kd: data.kontakWaP2kd,
        jam_layanan: data.jamLayanan,
        alamat_sekretariat: data.alamatSekretariat,
        total_rw: data.totalRw,
        total_rt: data.totalRt,
        sk_p2kd: data.skP2KD,
        sk_penetapan_balon: data.skPenetapanBalon,
        sk_penetapan_calon: data.skPenetapanCalon,
        sk_penetapan_dpt: data.skPenetapanDPT,
        perbup_pilkades: data.perbupPilkades,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Supabase saveWebConfig sync failed:", err);
    }
  }
}
