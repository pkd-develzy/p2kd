import { NextResponse } from "next/server";
import { TelegramAuthService } from "@/lib/telegram-auth-service";
import { getSupabaseServer3Admin } from "@/lib/supabase";
import { Pool } from "pg";

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

    const cleanUsername = username.trim();

    // 1. Cari petugas dan ambil telegram_chat_id pribadi dari database
    let userRow: any = null;

    if (process.env.DATABASE_URL) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const res = await pool.query(
        "SELECT id, username, nama_lengkap, telegram_chat_id, telegram_username FROM anggota_p2kd WHERE LOWER(username) = LOWER($1) OR nik = $1 LIMIT 1",
        [cleanUsername]
      );
      await pool.end();
      userRow = res.rows[0];
    }

    if (!userRow) {
      const s3 = getSupabaseServer3Admin();
      const { data } = await s3
        .from("anggota_p2kd")
        .select("id, username, nama_lengkap, telegram_chat_id, telegram_username")
        .or(`username.ilike.${cleanUsername},nik.eq.${cleanUsername}`)
        .limit(1)
        .single();
      userRow = data;
    }

    if (!userRow) {
      return NextResponse.json(
        { success: false, message: "Akun petugas dengan username/NIK tersebut tidak terdaftar di sistem P2KD." },
        { status: 404 }
      );
    }

    const personalChatId = userRow.telegram_chat_id;

    // 2. Jika akun belum ditautkan dengan Telegram pribadi
    if (!personalChatId) {
      return NextResponse.json(
        {
          success: false,
          notLinked: true,
          message: "Akun Anda belum ditautkan dengan akun Telegram pribadi. Silakan buka menu Akun / Pengaturan di aplikasi untuk menautkan Telegram terlebih dahulu demi keamanan data Anda.",
        },
        { status: 400 }
      );
    }

    // 3. Buat token reset PIN 15 menit
    const token = TelegramAuthService.createResetToken(cleanUsername, "PIN");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://p2kdkalisalak.my.id";
    const resetUrl = `${baseUrl}/reset-auth?token=${token}`;

    const directMessage = `
🔒 <b>PERMINTAAN RESET 6-DIGIT PIN PETUGAS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
Halo Bpk/Ibu <b>${userRow.nama_lengkap}</b> (<code>${userRow.username}</code>),
Kami menerima permintaan pengaturan ulang PIN Keamanan akun Anda.

Silakan klik tautan resmi di bawah ini untuk membuat 6-Digit PIN baru:
👉 <a href="${resetUrl}">${resetUrl}</a>

⚠️ <b>INFORMASI KEAMANAN TINGGI:</b>
• Tautan ini hanya berlaku selama <b>15 MENIT</b>.
• Tautan ini bersifat <b>SATU KALI PAKAI</b> (Single-Use).
• Tautan ini dikirim langsung ke pesan pribadi Anda dan <b>tidak dibagikan ke grup</b>.
• Jangan pernah membagikan tautan ini kepada siapapun!

<i>Sekretariat Panitia Pemilihan Kepala Desa Kalisalak 2026 (@pantarlih_bot)</i>
`.trim();

    // 4. Kirim HANYA ke chat ID pribadi petugas (Bukan ke grup!)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi bot Telegram server belum disetel." },
        { status: 500 }
      );
    }

    const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: personalChatId,
        text: directMessage,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔐 Buka Formulir Reset PIN (15 Menit)", url: resetUrl }],
          ],
        },
      }),
    });

    const sendData = await sendRes.json();
    if (!sendData.ok) {
      console.warn("Gagal mengirim DM reset PIN Telegram:", sendData.description);
      return NextResponse.json(
        {
          success: false,
          message: `Bot gagal mengirim pesan pribadi (${sendData.description}). Pastikan Anda sudah membuka chat dengan @pantarlih_bot dan mengeklik tombol START.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Tautan pemulihan PIN 15 menit telah dikirim langsung ke ruang obrolan pribadi Telegram Anda (@${userRow.telegram_username || "Pribadi"}).`,
      resetUrl,
    });
  } catch (err: any) {
    console.error("Error in forgot-pin route:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memproses permintaan reset PIN." },
      { status: 500 }
    );
  }
}
