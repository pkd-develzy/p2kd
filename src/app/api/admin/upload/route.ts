import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "p2kd_berita";

      if (!file) {
        return NextResponse.json(
          { success: false, message: "File gambar tidak ditemukan." },
          { status: 400 }
        );
      }

      // Check mime type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, message: "Hanya format gambar yang diperbolehkan (JPG, PNG, WEBP, GIF)." },
          { status: 400 }
        );
      }

      // Limit 10MB
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: "Ukuran gambar melebihi batas maksimal (10MB)." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

      const uploaded = await uploadImageToCloudinary(base64Data, folder);

      return NextResponse.json({
        success: true,
        message: "Gambar berhasil diunggah ke Cloudinary.",
        data: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
        },
      });
    }

    // JSON base64 upload support
    const body = await req.json();
    const { image, folder = "p2kd_berita" } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, message: "Data gambar (base64/url) wajib disertakan." },
        { status: 400 }
      );
    }

    const uploaded = await uploadImageToCloudinary(image, folder);

    return NextResponse.json({
      success: true,
      message: "Gambar berhasil diunggah ke Cloudinary.",
      data: {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengunggah gambar ke server penyimpanan Cloudinary." },
      { status: 500 }
    );
  }
}
