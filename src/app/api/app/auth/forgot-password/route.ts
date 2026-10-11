import { NextResponse } from "next/server";
import { TelegramAuthService } from "@/lib/telegram-auth-service";
import { getSupabaseServer3Admin } from "@/lib/supabase";
import { Pool } from "pg";

interface PetugasTelegramRow {
  id: string;
  username: string;
  nama_lengkap: string;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
}

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

    // 1. Ambil data petugas dan telegram_chat_id pribadi dari Server 3 / Supabase
    let userRow: PetugasTelegramRow | null = null;

    const s3Url = process.env.DIRECT_SERVER3_URL || process.env.DATABASE_SERVER3_URL;
    if (s3Url) {
      try {
        const pool = new Pool({ connectionString: s3Url, ssl: { rejectUnauthorized: false } });
        const res = await pool.query(
          "SELECT id, username, nama_lengkap, telegram_chat_id, telegram_username FROM anggota_p2kd WHERE LOWER(username) = LOWER($1) OR nik = $1 LIMIT 1",
          [cleanUsername]
        );
        await pool.end();
        if (res.rows && res.rows.length > 0) {
          userRow = res.rows[0] as PetugasTelegramRow;
        }
      } catch (errPool) {
        console.warn("Direct PG Server 3 query fallback:", errPool);
      }
    }

    if (!userRow) {
      try {
        const s3 = getSupabaseServer3Admin();
        const { data } = await s3
          .from("anggota_p2kd")
          .select("id, username, nama_lengkap, telegram_chat_id, telegram_username")
          .or(`username.ilike.${cleanUsername},nik.eq.${cleanUsername}`)
          .limit(1)
          .maybeSingle();
        userRow = (data as PetugasTelegramRow) || null;
      } catch (errS3) {
        console.warn("Supabase Server 3 fallback:", errS3);
      }
    }

    if (!userRow && process.env.DATABASE_URL) {
      try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
        const res = await pool.query(
          "SELECT id, username, nama_lengkap, telegram_chat_id, telegram_username FROM anggota_p2kd WHERE LOWER(username) = LOWER($1) OR nik = $1 LIMIT 1",
          [cleanUsername]
        );
        await pool.end();
        userRow = (res.rows[0] as PetugasTelegramRow) || null;
      } catch {
        // ignore
      }
    }

    if (!userRow) {
      return NextResponse.json(
        { success: false, message: `Akun petugas "${cleanUsername}" tidak terdaftar di sistem P2KD. Silakan periksa kembali username atau NIK Anda.` },
        { status: 404 }
      );
    }

    const personalChatId = userRow.telegram_chat_id;

    if (!personalChatId) {
      return NextResponse.json(
        {
          success: false,
          notLinked: true,
          message: `Akun atas nama ${userRow.nama_lengkap} (@${userRow.username}) belum ditautkan ke akun Telegram pribadi. Silakan hubungi Sekretariat Panitia di WhatsApp 0851-7154-2025 untuk bantuan pemulihan kata sandi Anda.`,
        },
        { status: 400 }
      );
    }

    const token = TelegramAuthService.createResetToken(cleanUsername, "PASSWORD");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://p2kdkalisalak.my.id";
    const resetUrl = `${baseUrl}/reset-auth?token=${token}`;

    const directMessage = `
🔑 <b>PERMINTAAN RESET KATA SANDI PETUGAS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
Halo Bpk/Ibu <b>${userRow.nama_lengkap}</b> (<code>${userRow.username}</code>),
Kami menerima permintaan pengaturan ulang Kata Sandi akun Anda.

Silakan klik tautan resmi di bawah ini untuk membuat Kata Sandi baru:
👉 <a href="${resetUrl}">${resetUrl}</a>

⚠️ <b>INFORMASI KEAMANAN:</b>
• Tautan ini hanya berlaku selama <b>15 MENIT</b>.
• Tautan ini adalah <b>SATU KALI PAKAI</b> (Single-Use).
• Tautan ini dikirim langsung ke pesan pribadi Anda dan <b>tidak dibagikan ke grup</b>.
• Jangan pernah memberikan tautan ini kepada siapa pun!

<i>Sekretariat Panitia Pemilihan Kepala Desa Kalisalak 2026 (@pantarlih_bot)</i>
`.trim();

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
            [{ text: "🔑 Buka Formulir Reset Kata Sandi (15 Menit)", url: resetUrl }],
          ],
        },
      }),
    });

    const sendData = await sendRes.json();
    if (!sendData.ok) {
      console.warn("Gagal mengirim DM reset password:", sendData.description);
      return NextResponse.json(
        {
          success: false,
          message: `Bot gagal mengirim pesan pribadi (${sendData.description}). Pastikan Anda sudah membuka bot @pantarlih_bot dan mengeklik tombol START.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Tautan pemulihan kata sandi telah dikirim langsung ke ruang obrolan pribadi Telegram Anda (@${userRow.telegram_username || "Pribadi"}).`,
      resetUrl,
    });
  } catch (err: unknown) {
    console.error("Error in forgot-password route:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memproses permintaan reset kata sandi." },
      { status: 500 }
    );
  }
}
