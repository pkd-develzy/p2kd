import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";

interface NotifikasiPetugasRow {
  id: string;
  judul: string;
  pesan: string;
  kategori?: string | null;
  target_role?: string | null;
  target_tps?: string | null;
  author?: string | null;
  is_active?: boolean | null;
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

    // 1. Ambil Notifikasi Resmi Petugas dari Tabel Khusus (bukan pengumuman website publik!)
    let notifikasiPetugasList: NotifikasiPetugasRow[] = [];
    try {
      const { data: notifData } = await client
        .from("notifikasi_petugas")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(25);

      if (notifData && Array.isArray(notifData)) {
        notifikasiPetugasList = notifData;
      }
    } catch (errNotif) {
      console.warn("Error querying notifikasi_petugas:", errNotif);
    }

    // 2. Ambil aduan warga relevan untuk petugas TPS / Koordinator
    let aduanList: NotificationAduan[] = [];
    try {
      let aduanQuery = adminClient
        .from("aduan_pemilih")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (user.role === "pantarlih" && rwClean) {
        aduanQuery = aduanQuery.eq("rw", rwClean);
      }
      const { data: rawAduanList } = await aduanQuery;
      if (rawAduanList) aduanList = rawAduanList as NotificationAduan[];
    } catch (errAduan) {
      console.warn("Error querying aduan_pemilih:", errAduan);
    }

    // 3. Konstruksi daftar notifikasi terpadu khusus aplikasi native
    const rawNotifications: NotificationItemData[] = [];

    // Prioritas Utama: Notifikasi Khusus Aplikasi Native Petugas
    notifikasiPetugasList.forEach((n) => {
      // Cek apakah target sesuai dengan petugas (role atau assigned TPS)
      const targetRole = (n.target_role || "SEMUA").toUpperCase();
      const targetTps = (n.target_tps || "SEMUA").toUpperCase();

      const userRole = (user.role || "").toUpperCase();
      const userTps = (user.assignedTps || "SEMUA").toUpperCase();

      const roleMatch = targetRole === "SEMUA" || targetRole === userRole;
      const tpsMatch = targetTps === "SEMUA" || targetTps === userTps;

      if (roleMatch && tpsMatch) {
        rawNotifications.push({
          id: `petugas-${n.id}`,
          title: n.judul,
          body: n.pesan,
          category: (n.kategori || "INFORMASI").toUpperCase(),
          timestamp: n.created_at || new Date().toISOString(),
          read: false,
          deepLink: "activity/notifikasi",
        });
      }
    });

    // Notifikasi dari aduan warga yang ditugaskan
    aduanList.forEach((a) => {
      rawNotifications.push({
        id: `aduan-${a.id || a.nomor_aduan || Math.random()}`,
        title: `⚠️ Aduan Masuk RT ${a.rt || "-"}/RW ${a.rw || "-"}`,
        body: `${a.nama_pelapor || "Warga"}: ${a.isi_aduan || a.jenis_aduan || "-"} (${a.status || "MENUNGGU"})`,
        category: "ADUAN",
        timestamp: a.tanggal || a.created_at || new Date().toISOString(),
        read: a.status === "SELESAI",
        deepLink: "activity/aduan",
      });
    });

    // Filter out notifikasi yang sudah dihapus permanen oleh petugas
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

    if (deleteAll && toDelete.length === 0) {
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
