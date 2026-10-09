import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";

interface NotificationPengumuman {
  id: string;
  judul: string;
  ringkasan?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
}

interface NotificationAduan {
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
}

interface NotificationVisit {
  id: string;
  qr_token?: string | null;
  petugas_nama?: string | null;
  total_anggota?: number | null;
  status_kunjungan?: string | null;
  waktu_kunjungan?: string | null;
  created_at?: string | null;
}

interface NotificationItemData {
  id: string;
  title: string;
  body: string;
  category: string;
  timestamp: string;
  read: boolean;
  deepLink: string;
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

    const { data: rawAduanList } = await aduanQuery;
    const aduanList = (rawAduanList as NotificationAduan[]) || [];

    // 2. Ambil pengumuman resmi
    let pengumumanList: NotificationPengumuman[] = [];
    try {
      pengumumanList = (await SupabaseDbService.fetchPengumuman()) as NotificationPengumuman[];
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
    const { data: rawVisits } = await visitQuery;
    const visits = (rawVisits as NotificationVisit[]) || [];

    // Konstruksi daftar notifikasi dinamis
    const notifications: NotificationItemData[] = [];

    // Notifikasi dari pengumuman
    pengumumanList.slice(0, 5).forEach((p) => {
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
    aduanList.slice(0, 10).forEach((a) => {
      notifications.push({
        id: `notif-aduan-${a.id || a.nomor_aduan || "aduan"}`,
        title: `⚠️ Aduan Warga RT ${a.rt || "-"}/RW ${a.rw || "-"}`,
        body: `${a.nama_pelapor || "Warga"}: ${a.isi_aduan || a.jenis_aduan || "-"} (${a.status || "MENUNGGU"})`,
        category: "ADUAN",
        timestamp: a.tanggal || a.created_at || new Date().toISOString(),
        read: a.status === "SELESAI",
        deepLink: "activity/aduan",
      });
    });

    // Notifikasi dari progres kunjungan / sinkronisasi
    visits.slice(0, 5).forEach((v) => {
      notifications.push({
        id: `notif-visit-${v.id}`,
        title: `✅ Coklit Tersimpan: Rumah ${v.qr_token || "QR"}`,
        body: `${v.petugas_nama || "Petugas"} mencatat ${v.total_anggota || 0} jiwa. Status: ${v.status_kunjungan || "SELESAI"}.`,
        category: "SINKRONISASI",
        timestamp: v.waktu_kunjungan || v.created_at || new Date().toISOString(),
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error fetching notifications:", errorMsg);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar notifikasi: " + errorMsg },
      { status: 500 }
    );
  }
}
