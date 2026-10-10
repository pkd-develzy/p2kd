import { NextResponse } from "next/server";
import { getSupabaseServer3Admin } from "@/lib/supabase";
import { Pool } from "pg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, telegramChatId, telegramUsername } = body;

    if (!username || !telegramChatId) {
      return NextResponse.json(
        { success: false, message: "Username dan Telegram Chat ID wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const cleanChatId = String(telegramChatId).trim();
    const cleanTgUname = telegramUsername ? String(telegramUsername).replace(/^@/, "").trim() : null;

    let updated = false;

    if (process.env.DATABASE_URL) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const res = await pool.query(
        `UPDATE anggota_p2kd 
         SET telegram_chat_id = $1, telegram_username = $2, telegram_linked_at = NOW() 
         WHERE LOWER(username) = LOWER($3)
         RETURNING id, nama_lengkap, username, telegram_chat_id`,
        [cleanChatId, cleanTgUname, cleanUsername]
      );
      await pool.end();
      if (res.rowCount && res.rowCount > 0) {
        updated = true;
      }
    }

    if (!updated) {
      const s3 = getSupabaseServer3Admin();
      const { data, error } = await s3
        .from("anggota_p2kd")
        .update({
          telegram_chat_id: cleanChatId,
          telegram_username: cleanTgUname,
          telegram_linked_at: new Date().toISOString(),
        })
        .ilike("username", cleanUsername)
        .select("id, nama_lengkap, username, telegram_chat_id");

      if (data && data.length > 0) {
        updated = true;
      }
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Petugas dengan username tersebut tidak ditemukan." },
        { status: 404 }
      );
    }

    // Kirim pesan konfirmasi JAPRI (Pribadi) via bot
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      try {
        const welcomeMessage = `
✅ <b>AKUN TELEGRAM BERHASIL DITAUTKAN!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
Halo Bpk/Ibu Petugas P2KD Kalisalak (<code>${cleanUsername}</code>),
Akun Telegram pribadi Anda telah resmi terhubung dengan sistem keamanan aplikasi P2KD.

🔒 <b>Keuntungan:</b>
• Semua permintaan <b>Reset 6-Digit PIN</b> akan dikirimkan langsung ke pesan pribadi (Japri) ini.
• Tautan keamanan bersifat rahasia dan tidak akan bocor ke grup mana pun.
• Keterkaitan akun ini tetap aktif meskipun Anda keluar (logout) dari aplikasi.

<i>Sekretariat Panitia Pemilihan Kepala Desa Kalisalak 2026 (@pantarlih_bot)</i>
`.trim();

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: welcomeMessage,
            parse_mode: "HTML",
          }),
        });
      } catch (tgErr) {
        console.warn("Gagal mengirim DM konfirmasi Telegram:", tgErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Akun Telegram pribadi berhasil ditautkan dan tersimpan permanen di database.",
      telegramChatId: cleanChatId,
      telegramUsername: cleanTgUname,
    });
  } catch (err: any) {
    console.error("Error in telegram-link route:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menautkan akun Telegram." },
      { status: 500 }
    );
  }
}
