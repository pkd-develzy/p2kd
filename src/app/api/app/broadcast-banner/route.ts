import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession } from "@/lib/auth-middleware";
import { Pool } from "pg";

interface NotifikasiPetugasBannerRow {
  id: string;
  judul: string;
  pesan: string;
  kategori?: string;
  image_url?: string | null;
  is_banner?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    let activeBanner: NotifikasiPetugasBannerRow | null = null;

    // 1. Coba koneksi langsung ke PostgreSQL Seksi 1
    const connStr = process.env.DIRECT_SEKSI1_URL || process.env.DATABASE_SEKSI1_URL;
    if (connStr) {
      try {
        const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
        const res = await pool.query(`
          SELECT id, judul, pesan, kategori, image_url, is_banner, is_active, created_at 
          FROM notifikasi_petugas 
          WHERE is_active = true AND is_banner = true 
          ORDER BY created_at DESC 
          LIMIT 1
        `);
        await pool.end();
        if (res.rows && res.rows.length > 0) {
          activeBanner = res.rows[0] as NotifikasiPetugasBannerRow;
        }
      } catch (pgErr) {
        console.warn("Direct PG Seksi 1 query failed, using Supabase fallback:", pgErr);
      }
    }

    // 2. Fallback Supabase REST Client
    if (!activeBanner) {
      try {
        const s1 = SupabaseDbService.getSeksi1Client();
        const { data } = await s1
          .from("notifikasi_petugas")
          .select("id, judul, pesan, kategori, image_url, is_banner, is_active, created_at")
          .eq("is_active", true)
          .eq("is_banner", true)
          .order("created_at", { ascending: false })
          .limit(1);

        const rows = (data as NotifikasiPetugasBannerRow[]) || [];
        if (rows.length > 0) {
          activeBanner = rows[0];
        }
      } catch (s1Err) {
        console.warn("Supabase Seksi 1 client failed:", s1Err);
      }
    }

    if (!activeBanner) {
      // Tidak ada banner in-app aktif yang dipublikasikan oleh Admin via Pusat Notifikasi Petugas
      return NextResponse.json({
        success: true,
        hasActiveBanner: false,
        banner: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveBanner: true,
      banner: {
        id: activeBanner.id,
        title: activeBanner.judul,
        content: activeBanner.pesan,
        imageUrl: activeBanner.image_url || null,
        category: activeBanner.kategori || "PENGUMUMAN KHUSUS",
        createdAt: activeBanner.created_at || new Date().toISOString(),
        isActive: true,
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching broadcast banner:", err);
    return NextResponse.json({
      success: true,
      hasActiveBanner: false,
      banner: null,
    });
  }
}
