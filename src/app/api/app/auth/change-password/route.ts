import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyPassword, createStoredPassword } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Kata sandi lama dan baru wajib diisi." },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { success: false, message: "Kata sandi baru minimal harus 6 karakter." },
        { status: 400 }
      );
    }

    const s3 = SupabaseDbService.getServer3Client();
    const { data: officer, error: errFetch } = await s3
      .from("anggota_p2kd")
      .select("id, username, password_hash, nama_lengkap")
      .eq("username", user.username)
      .maybeSingle();

    if (errFetch || !officer) {
      return NextResponse.json(
        { success: false, message: "Akun petugas tidak ditemukan di database server." },
        { status: 404 }
      );
    }

    // Verify old password
    const isOldValid = verifyPassword(oldPassword, officer.password_hash || "p2kd2026");
    if (!isOldValid) {
      return NextResponse.json(
        { success: false, message: "Kata sandi lama yang Anda masukkan tidak sesuai." },
        { status: 400 }
      );
    }

    // Hash and store new password
    const newStoredHash = createStoredPassword(newPassword);
    const { error: errUpdate } = await s3
      .from("anggota_p2kd")
      .update({
        password_hash: newStoredHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", officer.id);

    if (errUpdate) {
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan kata sandi baru: " + errUpdate.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diperbarui dengan aman.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error changing password:", msg);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat mengganti kata sandi: " + msg },
      { status: 500 }
    );
  }
}
