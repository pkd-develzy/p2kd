import { NextResponse } from "next/server";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";
import { RumahCoklitService } from "@/lib/rumah-coklit-service";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang modul Coklit." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rwParam = searchParams.get("rw") || undefined;
    const tpsParam = searchParams.get("tps") || user.assignedTps;

    const tasks = await RumahCoklitService.getPetugasTasks(tpsParam, rwParam);

    return NextResponse.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar tugas Coklit." },
      { status: 500 }
    );
  }
}
