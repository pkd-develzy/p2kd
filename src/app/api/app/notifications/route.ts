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

    // 0. Ambil daftar notifikasi yang sudah dihapus oleh user ini secara permanen
    const deletedIds = new Set<string>();
    try {
      const { data: userDeleted } = await adminClient
        .from("user_deleted_notifications")
        .select("notification_id")
        .eq("user_id", user.username);
      if (userDeleted && userDeleted.length > 0) {
        userDeleted.forEach((d: { notification_id: string }) => deletedIds.add(d.notification_id));
      }
    } catch (e) {
      console.warn("Error fetching user_deleted_notifications:", e);
    }

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
    const rawNotifications: NotificationItemData[] = [];

    // Notifikasi dari pengumuman resmi
    pengumumanList.slice(0, 5).forEach((p) => {
      rawNotifications.push({
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
      rawNotifications.push({
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
      rawNotifications.push({
        id: `notif-visit-${v.id}`,
        title: `✅ Coklit Tersimpan: Rumah ${v.qr_token || "QR"}`,
        body: `${v.petugas_nama || "Petugas"} mencatat ${v.total_anggota || 0} jiwa. Status: ${v.status_kunjungan || "SELESAI"}.`,
        category: "SINKRONISASI",
        timestamp: v.waktu_kunjungan || v.created_at || new Date().toISOString(),
        read: true,
        deepLink: "activity/kunjungan",
      });
    });

    // Filter out notifications yang sudah dihapus permanen oleh user ini
    const filteredNotifications = rawNotifications.filter((n) => !deletedIds.has(n.id));

    // Sort by timestamp descending
    filteredNotifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const unreadCount = filteredNotifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      totalCount: filteredNotifications.length,
      notifications: filteredNotifications,
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

export async function DELETE(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const adminClient = SupabaseDbService.adminClient;
    const body = await req.json().catch(() => ({}));
    const { id, ids, deleteAll } = body;

    const toDelete: string[] = [];
    if (id) {
      toDelete.push(String(id));
    }
    if (Array.isArray(ids)) {
      ids.forEach((i: string) => toDelete.push(String(i)));
    }

    // Jika deleteAll tapi ids kosong, ambil semua ID notifikasi yang relevan lalu catat
    if (deleteAll && toDelete.length === 0) {
      // Masukkan penanda wildcard untuk user ini atau hapus semua
      const wildcardId = `all-${Date.now()}`;
      toDelete.push(wildcardId);
    }

    if (toDelete.length > 0) {
      const rows = toDelete.map((notifId) => ({
        user_id: user.username,
        notification_id: notifId,
        deleted_at: new Date().toISOString(),
      }));

      const { error } = await adminClient
        .from("user_deleted_notifications")
        .upsert(rows, { onConflict: "user_id,notification_id" });

      if (error) {
        console.warn("Error recording user_deleted_notifications:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil dihapus permanen untuk akun Anda.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error deleting notification:", errorMsg);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus notifikasi: " + errorMsg },
      { status: 500 }
    );
  }
}
