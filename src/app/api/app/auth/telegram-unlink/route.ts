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

    if (process.env.DATABASE_URL) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query(
        `UPDATE anggota_p2kd 
         SET telegram_chat_id = NULL, telegram_username = NULL, telegram_linked_at = NULL 
         WHERE LOWER(username) = LOWER($1)`,
        [cleanUsername]
      );
      await pool.end();
    }

    const s3 = getSupabaseServer3Admin();
    await s3
      .from("anggota_p2kd")
      .update({
        telegram_chat_id: null,
        telegram_username: null,
        telegram_linked_at: null,
      })
      .ilike("username", cleanUsername);

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
