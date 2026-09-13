import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    // Only Superadmin, Pimpinan, or Seksi Pemilih can promote voters
    const user = session.user;
    const isAuthorized = user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.seksi === "PIMPINAN" || user.seksi === "SEKSI_PEMILIH";
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang memindahkan tahap DPT/DPS." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ids, targetTahap = "DPT" } = body;
    const userName = user.nama || user.username || "Petugas P2KD";

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "ID pemilih tidak valid atau kosong." },
        { status: 400 }
      );
    }

    const result = await SupabaseDbService.promotePemilihToDpt(ids, userName, targetTahap);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Gagal memperbarui status tahap pemilih di server." },
        { status: 500 }
      );
    }

    await dataStore.ensureSynced(true);

    return NextResponse.json({
      success: true,
      count: result.count,
      targetTahap,
      message: `Berhasil memindahkan ${result.count} data pemilih ke ${targetTahap}.`,
    });
  } catch (err) {
    console.error("Error in POST /api/admin/pemilih/promosi-dpt:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
