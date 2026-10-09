import { NextResponse } from "next/server";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";
import { RumahCoklitService } from "@/lib/rumah-coklit-service";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang mengelola KK." },
        { status: 403 }
      );
    }

    const { id: rumahId } = await context.params;
    const body = await req.json();
    const { noKk, kepalaKeluargaNama, rt, rw, alamat } = body;

    if (!noKk || !kepalaKeluargaNama) {
      return NextResponse.json(
        { success: false, message: "Nomor KK dan Nama Kepala Keluarga wajib diisi." },
        { status: 400 }
      );
    }

    const result = await RumahCoklitService.linkKkToRumah({
      rumahId,
      noKk,
      kepalaKeluargaNama,
      rt,
      rw,
      alamat,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error linking KK:", err);
    return NextResponse.json(
      { success: false, message: "Gagal menautkan Kartu Keluarga ke rumah." },
      { status: 500 }
    );
  }
}
