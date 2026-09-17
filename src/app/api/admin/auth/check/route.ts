import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return NextResponse.json(
      { success: false, authenticated: false, message: "Tidak ada sesi aktif." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: session.user,
  });
}
