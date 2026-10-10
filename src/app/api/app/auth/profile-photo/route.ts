import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";
import { SupabaseDbService } from "@/lib/supabase-db";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { dataStore } from "@/lib/data-store";

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

    // Upload ke Cloudinary folder p2kd_petugas_avatars
    const uploadRes = await uploadImageToCloudinary(image, "p2kd_petugas_avatars");
    if (!uploadRes || !uploadRes.secure_url) {
      return NextResponse.json(
        { success: false, message: "Gagal mengunggah foto ke penyimpanan Cloudinary." },
        { status: 500 }
      );
    }

    const fotoUrl = uploadRes.secure_url;
    const s3 = SupabaseDbService.getServer3Client();
    
    // Perbarui foto_url di database server 3
    const { error: errUpdate } = await s3
      .from("anggota_p2kd")
      .update({
        foto_url: fotoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("username", user.username);

    if (errUpdate) {
      console.warn("Update anggota_p2kd warning:", errUpdate.message);
    }

    // Perbarui di dataStore lokal
    try {
      dataStore.updateAnggota(user.username, { fotoUrl });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      fotoUrl,
      message: "Foto profil berhasil diunggah ke Cloudinary dan disimpan ke profil petugas.",
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
