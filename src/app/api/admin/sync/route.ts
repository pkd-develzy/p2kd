import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import {
  verifyAdminSession,
  canAccessVoterData,
  isDeveloper,
  isKetuaP2KD,
  isSeksiPemilih,
} from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Hanya panitia yang memiliki hak akses data kependudukan dan pemilih.",
        },
        { status: 403 }
      );
    }

    // Tentukan cakupan hak akses wilayah:
    // Developer, Ketua P2KD, dan Seksi 1 memiliki hak akses penuh desa (all 13 RWs).
    // Petugas Pantarlih RW dibatasi HANYA pada RW / TPS binaannya sendiri!
    const isUniversal = isDeveloper(user) || isKetuaP2KD(user) || isSeksiPemilih(user);
    const wilayahScope = isUniversal ? undefined : user.assignedTps || undefined;

    const { searchParams } = new URL(req.url);
    const syncType = searchParams.get("type") || "initial";

    // 1. Initial Batch Sync for Voters
    if (syncType === "initial") {
      const batch = Math.max(0, parseInt(searchParams.get("batch") || "0", 10));
      const limit = Math.min(1000, Math.max(100, parseInt(searchParams.get("limit") || "1000", 10)));
      const offset = batch * limit;

      const batchResult = await SupabaseDbService.fetchPemilihBatch(offset, limit, wilayahScope);

      return NextResponse.json({
        success: true,
        batch,
        offset,
        limit,
        total: batchResult.total,
        hasMore: batchResult.hasMore,
        data: batchResult.data,
        serverTimestamp: new Date().toISOString(),
        wilayahScope: wilayahScope || "SEMUA",
      });
    }

    // 2. Metadata Sync (TPS, Anggota, Aduan, Berita, Kandidat, Pengumuman, dll)
    if (syncType === "meta") {
      const allDataRes = await SupabaseDbService.fetchAllData();
      const serverTimestamp = new Date().toISOString();

      if (!allDataRes.success || !allDataRes.data) {
        return NextResponse.json(
          { success: false, message: "Gagal memuat metadata aplikasi dari server." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: allDataRes.data,
        serverTimestamp,
      });
    }

    // 3. Incremental Sync (Hanya data yang berubah sejak timestamp terakhir)
    if (syncType === "incremental") {
      const since = searchParams.get("since") || new Date(Date.now() - 3600000).toISOString();
      const changes = await SupabaseDbService.fetchPemilihChanges(since, wilayahScope);

      return NextResponse.json({
        success: true,
        updated: changes.updated,
        deletedIds: changes.deletedIds,
        serverTimestamp: changes.serverTimestamp,
        wilayahScope: wilayahScope || "SEMUA",
      });
    }

    return NextResponse.json(
      { success: false, message: `Tipe sinkronisasi '${syncType}' tidak valid.` },
      { status: 400 }
    );
  } catch (err) {
    console.error("Error in GET /api/admin/sync:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal pada proses sinkronisasi server." },
      { status: 500 }
    );
  }
}
