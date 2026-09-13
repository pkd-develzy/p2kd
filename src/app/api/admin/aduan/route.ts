import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    await dataStore.ensureSynced();
    const list = dataStore.getAduanList(status);

    return NextResponse.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar aduan masyarakat." },
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
    const { id, status, catatan, autoUpdateMaster } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "ID aduan dan status verifikasi wajib dikirim." },
        { status: 400 }
      );
    }

    const resolved = await dataStore.resolveAduan(
      id,
      status,
      catatan || "",
      session.user.nama || session.user.username,
      autoUpdateMaster !== false
    );

    if (!resolved) {
      return NextResponse.json(
        { success: false, message: "Aduan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Aduan ${resolved.nomorAduan} berhasil diproses (${status}).`,
      data: resolved,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui status aduan." },
      { status: 500 }
    );
  }
}
