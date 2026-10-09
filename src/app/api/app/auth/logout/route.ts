import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated) {
    return NextResponse.json({ success: true, message: "Sesi telah keluar." });
  }

  // Session revoked client-side by deleting stored token
  return NextResponse.json({
    success: true,
    message: "Logout berhasil. Token sesi telah dicabut.",
  });
}
