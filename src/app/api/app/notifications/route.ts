import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang mengakses notifikasi." },
        { status: 403 }
      );
    }

    const client = SupabaseDbService.getSeksi1Client();
    const adminClient = SupabaseDbService.adminClient;

    const rwMatch = (user.assignedTps || "").match(/\d+/);
    const rwClean = rwMatch ? rwMatch[0].padStart(2, "0") : undefined;

    // 1. Ambil aduan terkini untuk notifikasi
    let aduanQuery = adminClient
      .from("aduan_pemilih")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (user.role === "pantarlih" && rwClean) {
      aduanQuery = aduanQuery.eq("rw", rwClean);
    }

    const { data: aduanList } = await aduanQuery;

    // 2. Ambil pengumuman resmi
    let pengumumanList: any[] = [];
    try {
      pengumumanList = await SupabaseDbService.fetchPengumuman();
    } catch (e) {
      console.warn("Notifications: pengumuman warning:", e);
    }

    // 3. Ambil kunjungan terkini di TPS petugas
    let visitQuery = client
      .from("kunjungan_coklit")
      .select("*")
      .order("waktu_kunjungan", { ascending: false })
      .limit(10);

    if (user.role === "pantarlih" && user.assignedTps) {
      visitQuery = visitQuery.eq("tps", user.assignedTps);
    }
    const { data: visits } = await visitQuery;

    // Konstruksi daftar notifikasi dinamis
    const notifications: any[] = [];

    // Notifikasi dari pengumuman
    (pengumumanList || []).slice(0, 5).forEach((p: any) => {
      notifications.push({
        id: `notif-pengumuman-${p.id}`,
        title: `📢 Pengumuman: ${p.judul}`,
        body: p.ringkasan || "Informasi resmi panitia pemilihan kepala desa.",
        category: "PENGUMUMAN",
        timestamp: p.tanggal || p.created_at || new Date().toISOString(),
        read: false,
        deepLink: "activity/pengumuman",
      });
    });

    // Notifikasi dari aduan warga
    (aduanList || []).slice(0, 10).forEach((a: any) => {
      notifications.push({
        id: `notif-aduan-${a.id || a.nomor_aduan}`,
        title: `⚠️ Aduan Warga RT ${a.rt}/RW ${a.rw}`,
        body: `${a.nama_pelapor}: ${a.isi_aduan || a.jenis_aduan} (${a.status})`,
        category: "ADUAN",
        timestamp: a.tanggal || a.created_at,
        read: a.status === "SELESAI",
        deepLink: "activity/aduan",
      });
    });

    // Notifikasi dari progres kunjungan / sinkronisasi
    (visits || []).slice(0, 5).forEach((v: any) => {
      notifications.push({
        id: `notif-visit-${v.id}`,
        title: `✅ Coklit Tersimpan: Rumah ${v.qr_token}`,
        body: `${v.petugas_nama || "Petugas"} mencatat ${v.total_anggota} jiwa. Status: ${v.status_kunjungan}.`,
        category: "SINKRONISASI",
        timestamp: v.waktu_kunjungan || v.created_at,
        read: true,
        deepLink: "activity/kunjungan",
      });
    });

    // Sort by timestamp descending
    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      totalCount: notifications.length,
      notifications,
    });
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar notifikasi: " + err.message },
      { status: 500 }
    );
  }
}
