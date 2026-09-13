import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    // Only Superadmin / Pimpinan / Seksi Pemilih can import voters
    if (!session.user.isSuperAdmin && session.user.role !== "SUPER_ADMIN" && session.user.seksi !== "SEKSI_PEMILIH" && session.user.seksi !== "PIMPINAN") {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang mengimpor data pemilih massal." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { voters } = body;

    await dataStore.ensureSynced();

    if (!Array.isArray(voters) || voters.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data pemilih yang akan diimpor kosong atau tidak valid." },
        { status: 400 }
      );
    }

    const result = await dataStore.batchImportPemilih(voters, session.user.nama || session.user.username);

    return NextResponse.json({
      success: true,
      message: `Impor data selesai: ${result.totalSuccess} pemilih berhasil diimpor, ${result.totalDuplicate} data duplikat dilewati.`,
      data: result,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memproses impor data massal." },
      { status: 500 }
    );
  }
}
