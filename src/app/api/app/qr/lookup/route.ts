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
    const token = searchParams.get("token") || searchParams.get("qr") || "";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token QR C6 wajib disertakan." },
        { status: 400 }
      );
    }

    const result = await RumahCoklitService.validateAndLookupQr(token);

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: result.message || "QR Code tidak terdaftar dalam database resmi.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in QR lookup:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memproses validasi QR Code." },
      { status: 500 }
    );
  }
}
