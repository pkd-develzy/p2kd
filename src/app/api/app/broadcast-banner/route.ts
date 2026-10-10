import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession } from "@/lib/auth-middleware";

interface PengumumanRow {
  id: string;
  judul?: string;
  ringkasan?: string;
  kategori?: string;
  file_url?: string;
  tanggal?: string;
  created_at?: string;
}

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const client = SupabaseDbService.adminClient;
    
    // Cari pengumuman kategori BANNER_BERANDA atau pengumuman resmi terbaru
    const { data: bannerRows, error } = await client
      .from("pengumuman")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !bannerRows || bannerRows.length === 0) {
      return NextResponse.json({
        success: true,
        hasActiveBanner: false,
        banner: null,
      });
    }

    const typedRows = bannerRows as (PengumumanRow & { scheduled_at?: string; expires_at?: string; status?: string })[];

    const now = Date.now();

    // Filter pengumuman yang aktif berdasarkan waktu tayang terjadwal
    const validScheduledBanners = typedRows.filter((b) => {
      if (b.status && b.status === "DRAFT") return false;
      if (b.scheduled_at && new Date(b.scheduled_at).getTime() > now) return false;
      if (b.expires_at && new Date(b.expires_at).getTime() < now) return false;
      return true;
    });

    if (validScheduledBanners.length === 0) {
      return NextResponse.json({
        success: true,
        hasActiveBanner: false,
        banner: null,
      });
    }

    // Ambil pengumuman yang ditandai sebagai banner atau memiliki gambar aktif
    const activeBanner = validScheduledBanners.find(
      (b) => b.kategori === "BANNER_BERANDA" || (b.file_url && b.file_url.startsWith("http"))
    ) || validScheduledBanners[0];

    // Jika pengumuman ditemukan dan masih berlaku
    if (activeBanner) {
      return NextResponse.json({
        success: true,
        hasActiveBanner: true,
        banner: {
          id: activeBanner.id,
          title: activeBanner.judul || "Pengumuman Resmi P2KD Kalisalak",
          content: activeBanner.ringkasan || "Informasi penting panitia pemilihan kepala desa.",
          imageUrl: activeBanner.file_url || null,
          category: activeBanner.kategori || "PENGUMUMAN",
          createdAt: activeBanner.tanggal || activeBanner.created_at || new Date().toISOString(),
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveBanner: false,
      banner: null,
    });
  } catch (err) {
    console.error("Error fetching broadcast banner:", err);
    return NextResponse.json({
      success: true,
      hasActiveBanner: false,
      banner: null,
    });
  }
}
