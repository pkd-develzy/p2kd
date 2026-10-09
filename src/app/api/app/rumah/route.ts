import { NextResponse } from "next/server";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";
import { RumahCoklitService } from "@/lib/rumah-coklit-service";

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang mendaftarkan rumah." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { qrToken, alamat, rt, rw, nomorRumah, keteranganLokasi, koordinatLat, koordinatLng } = body;

    if (!qrToken || !alamat || !rt || !rw) {
      return NextResponse.json(
        { success: false, message: "QR Token, Alamat, RT, dan RW wajib diisi." },
        { status: 400 }
      );
    }

    const result = await RumahCoklitService.registerOrUpdateRumah({
      qrToken,
      alamat,
      rt,
      rw,
      nomorRumah,
      keteranganLokasi,
      koordinatLat,
      koordinatLng,
      petugasUsername: user.username,
      petugasNama: user.nama || user.username,
      tps: user.assignedTps,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error registering rumah:", err);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan data rumah." },
      { status: 500 }
    );
  }
}
