import { NextResponse } from "next/server";
import { verifyAdminSession, isDeveloper } from "@/lib/auth-middleware";
import { dataStore } from "@/lib/data-store";
import { generateAuthToken } from "@/lib/encryption";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response || NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
  }

  if (!isDeveloper(session.user)) {
    return NextResponse.json(
      {
        success: false,
        message: "Akses Ditolak: Hanya akun Developer yang memiliki wewenang untuk mengeluarkan seluruh sesi login pengguna.",
      },
      { status: 403 }
    );
  }

  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const callerUser = session.user.nama || session.user.username;
  const callerUsername = session.user.username;

  // 1. Eksekusi pemutusan seluruh sesi login pengguna di seluruh sistem
  const epoch = await dataStore.revokeAllSessions(callerUser, callerUsername, clientIp);

  // 2. Buat token baru eksklusif untuk Developer pemanggil dengan iat terkini agar tidak ikut ter-logout
  const freshPayload = {
    username: session.user.username,
    nama: session.user.nama || session.user.username,
    role: session.user.role,
    seksi: session.user.seksi,
    jabatan: session.user.jabatan,
    assignedTps: session.user.assignedTps,
    isSuperAdmin: session.user.isSuperAdmin,
  };
  const newToken = generateAuthToken(freshPayload, 172800);

  // 3. Kirim sinyal keamanan ke Telegram P2KD
  const timeStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  void sendTelegramNotification(`
🚨 <b>KEAMANAN SISTEM: PEMUTUSAN SEMUA SESI PENGGUNA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Eksekutor :</b> <b>${callerUser}</b> (@${callerUsername})
📌 <b>Wewenang  :</b> Core System Developer
🕒 <b>Waktu     :</b> ${timeStr} WIB
🌐 <b>IP Client :</b> <code>${clientIp}</code>

⚠️ <i>Seluruh sesi login aktif anggota panitia di seluruh perangkat telah dihentikan secara serentak. Pengguna diwajibkan login ulang dengan kredensial sah.</i>
━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <i>Audit Trail Keamanan P2KD Kalisalak 2026/2027</i>
`.trim());

  const response = NextResponse.json({
    success: true,
    message: "Seluruh sesi login pengguna di seluruh perangkat telah berhasil diputus dan dikeluarkan.",
    data: {
      epoch,
      token: newToken,
      revokedAt: `${timeStr} WIB`,
      executor: callerUser,
    },
  });

  // Pasang token baru di cookie browser Developer
  response.cookies.set("admin_token", newToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 172800,
  });

  return response;
}
