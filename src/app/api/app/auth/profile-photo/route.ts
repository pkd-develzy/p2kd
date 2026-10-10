import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";
import { SupabaseDbService } from "@/lib/supabase-db";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { success: false, message: "Data gambar (base64) wajib disertakan." },
        { status: 400 }
      );
    }

    // Upload to Cloudinary under p2kd_petugas_avatars
    const uploadRes = await uploadImageToCloudinary(image, "p2kd_petugas_avatars");
    if (!uploadRes || !uploadRes.secure_url) {
      return NextResponse.json(
        { success: false, message: "Gagal mengunggah foto ke penyimpanan Cloudinary." },
        { status: 500 }
      );
    }

    const fotoUrl = uploadRes.secure_url;
    const s3 = SupabaseDbService.getServer3Client();
    const { error: errUpdate } = await s3
      .from("anggota_p2kd")
      .update({
        foto_url: fotoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("username", user.username);

    if (errUpdate) {
      return NextResponse.json(
        { success: false, message: "Gagal memperbarui foto profil di database: " + errUpdate.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fotoUrl,
      message: "Foto profil berhasil diperbarui.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error updating profile photo:", msg);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat memperbarui foto: " + msg },
      { status: 500 }
    );
  }
}
