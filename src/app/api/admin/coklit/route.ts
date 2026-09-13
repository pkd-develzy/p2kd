import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();
    const { searchParams } = new URL(req.url);
    let tps = searchParams.get("tps") || undefined;
    const status = searchParams.get("status") || undefined; // "ALL", "BELUM", "SESUAI", "UBAH_DATA", "TMS"
    const search = searchParams.get("search") || undefined;

    const user = session.user;
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";

    if (isOfficer && user.assignedTps && user.assignedTps !== "SEMUA") {
      tps = user.assignedTps;
    }

    let list = dataStore.getPemilihList({ tps, search });

    if (status && status !== "ALL") {
      if (status === "BELUM") {
        list = list.filter((p) => !p.coklitStatus || p.coklitStatus === "BELUM_COKLIT");
      } else {
        list = list.filter((p) => p.coklitStatus === status);
      }
    }

    const stats = dataStore.getCoklitStats(tps);

    return NextResponse.json({
      success: true,
      total: list.length,
      stats,
      data: list,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data Coklit lapangan." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const body = await req.json();
    const { voterId, status, catatan } = body;

    if (!voterId || !status) {
      return NextResponse.json(
        { success: false, message: "ID Pemilih dan Status Coklit wajib disertakan." },
        { status: 400 }
      );
    }

    const user = session.user;
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";

    // Strict TPS protection: field officers can only coklit voters in their assigned TPS
    if (isOfficer && user.assignedTps && user.assignedTps !== "SEMUA") {
      await dataStore.ensureSynced();
      const targetVoter = dataStore.getPemilihById(voterId);
      if (targetVoter && !targetVoter.tps.includes(user.assignedTps)) {
        return NextResponse.json(
          {
            success: false,
            message: `Akses Ditolak: Anda hanya berwenang melakukan coklit pemilih di wilayah ${user.assignedTps}.`,
          },
          { status: 403 }
        );
      }
    }

    const userName = user.nama || user.username || "Koordinator RW";

    // Direct Supabase update
    await SupabaseDbService.updateCoklitStatus(voterId, status, catatan || "", userName);

    // Also update in-memory dataStore
    const updated = dataStore.updateCoklitStatus(
      voterId,
      status,
      catatan || "",
      userName
    );

    return NextResponse.json({
      success: true,
      message: `Status Coklit berhasil diperbarui (${status}).`,
      data: updated,
    });
  } catch (err) {
    console.error("Error in PUT /api/admin/coklit:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui status Coklit." },
      { status: 500 }
    );
  }
}
