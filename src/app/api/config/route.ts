import { NextResponse } from "next/server";
import { dataStore, PublicWebConfig } from "@/lib/data-store";
import { verifyAdminSession, isDeveloper } from "@/lib/auth-middleware";

export async function GET() {
  try {
    await dataStore.ensureSynced();
    const config = dataStore.getWebConfig();
    return NextResponse.json(
      {
        success: true,
        data: config,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memuat konfigurasi website publik." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isAuthorized =
      isDeveloper(user) ||
      user.isSuperAdmin ||
      user.role === "SUPER_ADMIN" ||
      user.role?.toLowerCase() === "developer" ||
      user.username?.toLowerCase() === "develzy" ||
      user.seksi === "PIMPINAN" ||
      user.role === "PIMPINAN" ||
      user.role === "KETUA" ||
      user.role === "SEKRETARIS" ||
      user.seksi === "SEKRETARIS" ||
      user.seksi === "SEKSI_PENJARINGAN" ||
      user.seksi === "SEKSI_PENYARINGAN" ||
      user.role === "SEKSI_1" ||
      user.role === "SEKSI_2" ||
      user.role === "SEKSI_3";

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Hanya Pimpinan, Sekretaris, atau Seksi terkait P2KD yang berwenang mengubah konfigurasi ini.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { data } = body as { data: Partial<PublicWebConfig> };

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Data konfigurasi tidak valid." },
        { status: 400 }
      );
    }

    const userName = user.nama || user.username || "Admin P2KD";
    const updated = await dataStore.updateWebConfig(data, userName);

    return NextResponse.json({
      success: true,
      message: "Pengaturan website publik berhasil diperbarui secara realtime.",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menyimpan pengaturan." },
      { status: 500 }
    );
  }
}
