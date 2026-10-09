import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response!;
  }

  const user = session.user;
  const rwMatch = (user.assignedTps || "").match(/\d+/);
  const assignedRw = rwMatch ? `RW ${rwMatch[0].padStart(2, "0")}` : "SEMUA";

  return NextResponse.json({
    success: true,
    user: {
      username: user.username,
      nama: user.nama,
      role: user.role,
      seksi: user.seksi,
      jabatan: user.jabatan,
      assignedTps: user.assignedTps,
      assignedRw,
      isSuperAdmin: user.isSuperAdmin,
    },
  });
}
