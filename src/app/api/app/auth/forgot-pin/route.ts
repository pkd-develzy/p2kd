import { NextResponse } from "next/server";
import { TelegramAuthService } from "@/lib/telegram-auth-service";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { success: false, message: "Username atau NIK petugas wajib diisi." },
        { status: 400 }
      );
    }

    const token = TelegramAuthService.createResetToken(username.trim(), "PIN");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://p2kdkalisalak.my.id";
    const resetUrl = `${baseUrl}/reset-auth?token=${token}`;

    const message = `🔒 <b>PERMINTAAN RESET 6-DIGIT PIN PETUGAS</b>\n\n` +
      `Halo Petugas P2KD Kalisalak (<b>${username.trim()}</b>),\n` +
      `Kami menerima permintaan pengaturan ulang PIN Keamanan akun Anda.\n\n` +
      `Silakan klik tautan resmi di bawah ini untuk membuat 6-Digit PIN baru:\n` +
      `👉 <a href="${resetUrl}">${resetUrl}</a>\n\n` +
      `⚠️ <b>INFORMASI KEAMANAN:</b>\n` +
      `• Tautan ini berlaku selama <b>15 MENIT</b>.\n` +
      `• Tautan ini adalah <b>SATU KALI PAKAI</b>.\n` +
      `• Jangan pernah memberikan tautan ini kepada orang lain.\n\n` +
      `<i>Sekretariat Panitia Pemilihan Kepala Desa Kalisalak 2026 (@pantarlih_bot)</i>`;

    // Kirim notifikasi via bot telegram resmi
    await sendTelegramNotification(message, {
      inline_keyboard: [
        [
          { text: "🔐 Buka Formulir Reset PIN (15 Menit)", url: resetUrl }
        ]
      ]
    });

    return NextResponse.json({
      success: true,
      message: "Tautan pemulihan 15 menit telah dikirim ke Telegram resmi @pantarlih_bot.",
      resetUrl,
    });
  } catch (err) {
    console.error("Error in forgot-pin route:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memproses permintaan reset PIN." },
      { status: 500 }
    );
  }
}
