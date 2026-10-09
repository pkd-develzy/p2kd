import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";
import { RumahCoklitService } from "@/lib/rumah-coklit-service";

interface VisitRecord {
  id: string;
  qr_token?: string | null;
  petugas_nama?: string | null;
  petugas_username?: string | null;
  total_anggota?: number | null;
  status_kunjungan?: string | null;
  nama_stiker_manual?: string | null;
  stiker_ditempel?: boolean | null;
  waktu_kunjungan?: string | null;
  created_at?: string | null;
  tps?: string | null;
  total_kk?: number | null;
  anggota_sesuai?: number | null;
  anggota_ubah_data?: number | null;
  anggota_tms?: number | null;
}

interface AduanRecord {
  id?: string | null;
  nomor_aduan?: string | null;
  nama_pelapor?: string | null;
  rt?: string | null;
  rw?: string | null;
  isi_aduan?: string | null;
  jenis_aduan?: string | null;
  status?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
  kontak_pelapor?: string | null;
}

interface PengumumanRecord {
  id: string;
  judul: string;
  ringkasan?: string | null;
  isi?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
  nomor?: string | null;
  kategori?: string | null;
  lampiranUrl?: string | null;
}

interface AuditRecord {
  id: string;
  aksi: string;
  modul: string;
  user_name: string;
  role: string;
  created_at: string;
}

interface UnifiedActivity {
  id: string;
  kategori: string;
  judul: string;
  deskripsi: string;
  status: string;
  waktu: string;
  aktor: string;
  tps?: string | null;
  qrToken?: string | null;
  metadata?: Record<string, unknown>;
}

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang mengakses aktivitas." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "SEMUA"; // SEMUA | SAYA | TUGAS | ADUAN | PENGUMUMAN
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const client = SupabaseDbService.getSeksi1Client();
    const adminClient = SupabaseDbService.adminClient;
    const server3Client = SupabaseDbService.getServer3Client();

    // 1. Ambil Kunjungan Lapangan Terakhir (Aktivitas Petugas)
    let visitQuery = client
      .from("kunjungan_coklit")
      .select("*")
      .order("waktu_kunjungan", { ascending: false })
      .limit(limit);

    if (user.role === "pantarlih" && user.assignedTps) {
      visitQuery = visitQuery.eq("tps", user.assignedTps);
    }

    const { data: rawVisitData, error: visitErr } = await visitQuery;
    if (visitErr) {
      console.warn("Activities: visit query warning:", visitErr.message);
    }
    const visitData = (rawVisitData as VisitRecord[]) || [];

    const rwMatch = (user.assignedTps || "").match(/\d+/);
    const assignedRw = rwMatch ? `RW ${rwMatch[0].padStart(2, "0")}` : undefined;
    const rwClean = rwMatch ? rwMatch[0].padStart(2, "0") : undefined;

    // 2. Ambil Aduan Pemilih Terkait Wilayah Petugas
    let aduanQuery = adminClient
      .from("aduan_pemilih")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (user.role === "pantarlih" && rwClean) {
      aduanQuery = aduanQuery.eq("rw", rwClean);
    }

    const { data: rawAduanData, error: aduanErr } = await aduanQuery;
    if (aduanErr) {
      console.warn("Activities: aduan query warning:", aduanErr.message);
    }
    const aduanData = (rawAduanData as AduanRecord[]) || [];

    // 3. Ambil Pengumuman Resmi
    let pengumumanList: PengumumanRecord[] = [];
    try {
      pengumumanList = (await SupabaseDbService.fetchPengumuman()) as PengumumanRecord[];
    } catch (e) {
      console.warn("Activities: pengumuman warning:", e);
    }

    // 4. Ambil Audit Log Terkait Operasi Terkini
    const { data: rawAuditData } = await server3Client
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    const auditData = (rawAuditData as AuditRecord[]) || [];

    // 5. Ambil Tugas Lapangan Berjalan
    let taskSummary = {
      totalRumah: 0,
      selesaiRumah: 0,
      perluFollowUp: 0,
      stikerTersedia: 0,
    };
    try {
      const tasksRes = await RumahCoklitService.getPetugasTasks(user.assignedTps, assignedRw);
      if (tasksRes.success && tasksRes.summary) {
        taskSummary = tasksRes.summary;
      }
    } catch (e) {
      console.warn("Activities: tasks summary warning:", e);
    }

    // Transformasi ke format aktivitas terpadu
    const activitiesList: UnifiedActivity[] = visitData.map((v) => ({
      id: v.id,
      kategori: "KUNJUNGAN",
      judul: `Coklit Rumah [${v.qr_token || "QR"}]`,
      deskripsi: `${v.petugas_nama || "Petugas"} mencatat ${v.total_anggota || 0} jiwa (${v.status_kunjungan || "SELESAI"}). Stiker: ${v.nama_stiker_manual || (v.stiker_ditempel ? "Ditempel" : "Belum")}`,
      status: v.status_kunjungan || "SELESAI",
      waktu: v.waktu_kunjungan || v.created_at || new Date().toISOString(),
      aktor: v.petugas_nama || v.petugas_username || "Petugas",
      tps: v.tps,
      qrToken: v.qr_token,
      metadata: {
        totalKk: v.total_kk,
        anggotaSesuai: v.anggota_sesuai,
        anggotaUbah: v.anggota_ubah_data,
        anggotaTms: v.anggota_tms,
      },
    }));

    const aduanFormatted: UnifiedActivity[] = aduanData.map((a) => ({
      id: a.id || a.nomor_aduan || "aduan",
      kategori: "ADUAN",
      judul: `Aduan Warga: ${a.nama_pelapor || "Warga"} (RT ${a.rt || "-"}/RW ${a.rw || "-"})`,
      deskripsi: a.isi_aduan || `Jenis: ${a.jenis_aduan || "-"}`,
      status: a.status || "MENUNGGU",
      waktu: a.tanggal || a.created_at || new Date().toISOString(),
      aktor: a.nama_pelapor || "Pelapor",
      tps: `RW ${a.rw || "-"}`,
      metadata: {
        nomorAduan: a.nomor_aduan,
        kontakPelapor: a.kontak_pelapor,
        jenisAduan: a.jenis_aduan,
      },
    }));

    const pengumumanFormatted: UnifiedActivity[] = pengumumanList.map((p) => ({
      id: p.id,
      kategori: "PENGUMUMAN",
      judul: p.judul,
      deskripsi: p.ringkasan || p.isi || "",
      status: "RESMI",
      waktu: p.tanggal || p.created_at || new Date().toISOString(),
      aktor: "Sekretariat P2KD",
      metadata: {
        nomor: p.nomor,
        kategori: p.kategori,
        lampiranUrl: p.lampiranUrl,
      },
    }));

    // Filter berdasarkan kategori jika diminta
    let mergedList: UnifiedActivity[] = [];
    if (category === "SAYA" || category === "KUNJUNGAN") {
      mergedList = activitiesList;
    } else if (category === "ADUAN") {
      mergedList = aduanFormatted;
    } else if (category === "PENGUMUMAN") {
      mergedList = pengumumanFormatted;
    } else {
      // SEMUA: Gabungkan dan urutkan berdasarkan waktu descending
      mergedList = [...activitiesList, ...aduanFormatted, ...pengumumanFormatted].sort(
        (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
      );
    }

    return NextResponse.json({
      success: true,
      category,
      summary: {
        totalAktivitas: activitiesList.length,
        totalAduan: aduanFormatted.length,
        totalPengumuman: pengumumanFormatted.length,
        tasks: taskSummary,
      },
      data: mergedList.slice(0, limit),
      auditSummary: auditData.slice(0, 5).map((log) => ({
        id: log.id,
        aksi: log.aksi,
        modul: log.modul,
        user: log.user_name,
        role: log.role,
        waktu: log.created_at,
      })),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error fetching activities hub:", errorMsg);
    return NextResponse.json(
      { success: false, message: "Gagal memuat pusat aktivitas: " + errorMsg },
      { status: 500 }
    );
  }
}
