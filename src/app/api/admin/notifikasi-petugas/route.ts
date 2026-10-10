import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const s1 = SupabaseDbService.getSeksi1Client();
    const { data, error } = await s1
      .from("notifikasi_petugas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifikasi_petugas:", error.message);
      return NextResponse.json(
        { success: false, message: "Gagal mengambil data notifikasi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications: data || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: "Kesalahan server: " + msg },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const body = await req.json();
    const { judul, pesan, kategori, target_role, target_tps } = body;

    if (!judul || !pesan) {
      return NextResponse.json(
        { success: false, message: "Judul dan isi pesan notifikasi wajib diisi." },
        { status: 400 }
      );
    }

    const s1 = SupabaseDbService.getSeksi1Client();
    const { data, error } = await s1
      .from("notifikasi_petugas")
      .insert({
        judul: String(judul).trim(),
        pesan: String(pesan).trim(),
        kategori: kategori || "INFO",
        target_role: target_role || "SEMUA",
        target_tps: target_tps || "SEMUA",
        author: session.user.nama || session.user.username || "Admin P2KD",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notifikasi_petugas:", error.message);
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan notifikasi petugas: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifikasi khusus aplikasi native petugas berhasil diterbitkan!",
      notification: data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: "Kesalahan server: " + msg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID notifikasi wajib disertakan." },
        { status: 400 }
      );
    }

    const s1 = SupabaseDbService.getSeksi1Client();
    const { error } = await s1.from("notifikasi_petugas").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, message: "Gagal menghapus notifikasi: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifikasi petugas berhasil dihapus.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: "Kesalahan server: " + msg },
      { status: 500 }
    );
  }
}
