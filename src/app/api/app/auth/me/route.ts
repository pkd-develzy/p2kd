import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";
import { SupabaseDbService } from "@/lib/supabase-db";

export async function GET(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response!;
  }

  const user = session.user;
  const rwMatch = (user.assignedTps || "").match(/\d+/);
  const assignedRw = rwMatch ? `RW ${rwMatch[0].padStart(2, "0")}` : "SEMUA";

  let fotoUrl: string | null = null;
  try {
    const s3 = SupabaseDbService.getServer3Client();
    const { data: dbRow } = await s3
      .from("anggota_p2kd")
      .select("foto_url")
      .eq("username", user.username)
      .maybeSingle();
    if (dbRow?.foto_url) {
      fotoUrl = dbRow.foto_url;
    }
  } catch {
    // fallback
  }

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
      fotoUrl,
      isSuperAdmin: user.isSuperAdmin,
    },
  });
}
