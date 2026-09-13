import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();
    const { id } = await params;
    const body = await req.json();
    const { tpsBaru, rtBaru, rwBaru } = body;

    if (!tpsBaru) {
      return NextResponse.json(
        { success: false, message: "TPS tujuan mutasi wajib dipilih." },
        { status: 400 }
      );
    }

    const existing = dataStore.getPemilihById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Data pemilih tidak ditemukan." },
        { status: 404 }
      );
    }

    const user = session.user;
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";

    // Strict TPS protection: field officers can only mutate voters within their assigned TPS
    if (isOfficer && user.assignedTps && user.assignedTps !== "SEMUA" && !existing.tps.includes(user.assignedTps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda tidak memiliki wewenang memutasikan pemilih di luar wilayah ${user.assignedTps}.`,
        },
        { status: 403 }
      );
    }

    const updated = await dataStore.pindahTPS(
      id,
      tpsBaru,
      rtBaru || "01",
      rwBaru || "01",
      user.nama || user.username
    );

    return NextResponse.json({
      success: true,
      message: `Pemilih berhasil dimutasi ke ${tpsBaru} (RT ${rtBaru || "01"}/RW ${rwBaru || "01"}).`,
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memproses mutasi pemilih." },
      { status: 500 }
    );
  }
}
