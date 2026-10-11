import { NextResponse } from "next/server";
import { getSupabaseServer3Admin } from "@/lib/supabase";
import { verifyAuthToken } from "@/lib/encryption";
import { Pool } from "pg";

interface TelegramStatusRow {
  id: string;
  username: string;
  nama_lengkap: string;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  telegram_linked_at?: string | null;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    const { searchParams } = new URL(req.url);
    const queryUsername = searchParams.get("username");

    let targetUsername = queryUsername;

    if (!targetUsername && token) {
      const decoded = verifyAuthToken(token);
      if (decoded?.username) {
        targetUsername = decoded.username;
      }
    }

    if (!targetUsername) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid atau username tidak ditemukan." },
        { status: 400 }
      );
    }

    // Query dari database Server 3 / Supabase
    let row: TelegramStatusRow | null = null;
    const s3Url = process.env.DIRECT_SERVER3_URL || process.env.DATABASE_SERVER3_URL;
    if (s3Url) {
      try {
        const pool = new Pool({ connectionString: s3Url, ssl: { rejectUnauthorized: false } });
        const res = await pool.query(
          "SELECT id, username, nama_lengkap, telegram_chat_id, telegram_username, telegram_linked_at FROM anggota_p2kd WHERE LOWER(username) = LOWER($1) OR nik = $1 LIMIT 1",
          [targetUsername.trim()]
        );
        await pool.end();
        if (res.rows && res.rows.length > 0) {
          row = res.rows[0] as TelegramStatusRow;
        }
      } catch (errPool) {
        console.warn("Direct PG Server 3 query fallback:", errPool);
      }
    }

    if (!row) {
      try {
        const s3 = getSupabaseServer3Admin();
        const { data } = await s3
          .from("anggota_p2kd")
          .select("id, username, nama_lengkap, telegram_chat_id, telegram_username, telegram_linked_at")
          .or(`username.ilike.${targetUsername.trim()},nik.eq.${targetUsername.trim()}`)
          .limit(1)
          .maybeSingle();
        row = (data as TelegramStatusRow) || null;
      } catch (errS3) {
        console.warn("Supabase Server 3 fallback:", errS3);
      }
    }

    if (!row) {
      return NextResponse.json(
        { success: false, message: "Data petugas tidak ditemukan." },
        { status: 404 }
      );
    }

    const isLinked = Boolean(row.telegram_chat_id);

    return NextResponse.json({
      success: true,
      isLinked,
      telegramChatId: row.telegram_chat_id || null,
      telegramUsername: row.telegram_username || null,
      telegramLinkedAt: row.telegram_linked_at || null,
      botUsername: "pantarlih_bot",
    });
  } catch (err: unknown) {
    console.error("Error in telegram-status route:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memeriksa status tautan Telegram." },
      { status: 500 }
    );
  }
}
