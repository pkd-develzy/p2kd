import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "xwgfvkld",
  api_key: process.env.CLOUDINARY_API_KEY || "599572235518864",
  api_secret: process.env.CLOUDINARY_API_SECRET || "wZSpWdU20gbGC-_VMJiyZeR-rCM",
  secure: true,
});

/**
 * Extracts the Cloudinary public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/xwgfvkld/image/upload/v1234567/p2kd_berita/sample.jpg -> p2kd_berita/sample
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    // Remove version tag (e.g. v1712345678/) if present
    const pathAfterUpload = parts[1].replace(/^v\d+\//, "");
    
    // Remove file extension (e.g. .jpg, .png, .webp)
    const lastDotIndex = pathAfterUpload.lastIndexOf(".");
    if (lastDotIndex === -1) return pathAfterUpload;
    return pathAfterUpload.substring(0, lastDotIndex);
  } catch (err) {
    console.error("Gagal mengekstrak Cloudinary public_id:", err);
    return null;
  }
}

/**
 * Uploads an image to Cloudinary (Base64 Data URI, Remote URL, or Buffer)
 */
export async function uploadImageToCloudinary(
  fileData: string,
  folder = "p2kd_berita"
): Promise<{ secure_url: string; public_id: string }> {
  try {
    const uploadResult = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: "image",
      transformation: [
        { quality: "auto", fetch_format: "auto" },
        { width: 1600, crop: "limit" }, // limit max width for web optimization
      ],
    });

    return {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw error;
  }
}

/**
 * Deletes an image from Cloudinary using either public_id or its full URL
 */
export async function deleteImageFromCloudinary(publicIdOrUrl: string): Promise<boolean> {
  if (!publicIdOrUrl) return false;

  const publicId = publicIdOrUrl.startsWith("http")
    ? extractCloudinaryPublicId(publicIdOrUrl)
    : publicIdOrUrl;

  if (!publicId) return false;

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    return res.result === "ok" || res.result === "not found";
  } catch (error) {
    console.warn(`Gagal menghapus aset Cloudinary [${publicId}]:`, error);
    return false;
  }
}

export default cloudinary;
