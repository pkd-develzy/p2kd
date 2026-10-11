import { NextResponse } from "next/server";
import { getSupabaseServer3Admin } from "@/lib/supabase";
import { Pool } from "pg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username wajib diisi untuk menghapus tautan Telegram." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    const s3Url = process.env.DIRECT_SERVER3_URL || process.env.DATABASE_SERVER3_URL;
    if (s3Url) {
      try {
        const pool = new Pool({ connectionString: s3Url, ssl: { rejectUnauthorized: false } });
        await pool.query(
          `UPDATE anggota_p2kd 
           SET telegram_chat_id = NULL, telegram_username = NULL, telegram_linked_at = NULL 
           WHERE LOWER(username) = LOWER($1) OR nik = $1`,
          [cleanUsername]
        );
        await pool.end();
      } catch (errPool) {
        console.warn("Direct PG Server 3 unlink fallback:", errPool);
      }
    }

    try {
      const s3 = getSupabaseServer3Admin();
      await s3
        .from("anggota_p2kd")
        .update({
          telegram_chat_id: null,
          telegram_username: null,
          telegram_linked_at: null,
        })
        .or(`username.ilike.${cleanUsername},nik.eq.${cleanUsername}`);
    } catch (errS3) {
      console.warn("Supabase Server 3 unlink fallback:", errS3);
    }

    return NextResponse.json({
      success: true,
      message: "Tautan akun Telegram berhasil dihapus dari database. Akun tidak lagi terhubung dengan bot Telegram.",
    });
  } catch (err: unknown) {
    console.error("Error in telegram-unlink route:", err);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus keterkaitan akun Telegram." },
      { status: 500 }
    );
  }
}
