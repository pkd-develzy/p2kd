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
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    let activeBanner: NotifikasiPetugasBannerRow | null = null;
    const nowIso = new Date().toISOString();

    // 1. Coba koneksi langsung ke PostgreSQL Seksi 1
    const connStr = process.env.DIRECT_SEKSI1_URL || process.env.DATABASE_SEKSI1_URL;
    if (connStr) {
      try {
        const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
        const res = await pool.query(`
          SELECT id, judul, pesan, kategori, image_url, is_banner, is_active, start_date, end_date, created_at 
          FROM notifikasi_petugas 
          WHERE is_active = true 
            AND is_banner = true 
            AND (start_date IS NULL OR start_date <= NOW())
            AND (end_date IS NULL OR end_date >= NOW())
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
          .select("id, judul, pesan, kategori, image_url, is_banner, is_active, start_date, end_date, created_at")
          .eq("is_active", true)
          .eq("is_banner", true)
          .order("created_at", { ascending: false });

        const rows = (data as NotifikasiPetugasBannerRow[]) || [];
        // Filter jadwal aktif (start_date <= now && end_date >= now)
        const matched = rows.find(r => {
          const isStarted = !r.start_date || new Date(r.start_date) <= new Date(nowIso);
          const isNotExpired = !r.end_date || new Date(r.end_date) >= new Date(nowIso);
          return isStarted && isNotExpired;
        });

        if (matched) {
          activeBanner = matched;
        }
      } catch (s1Err) {
        console.warn("Supabase Seksi 1 client failed:", s1Err);
      }
    }

    if (!activeBanner) {
      // Tidak ada banner in-app aktif/sedang tayang saat ini
      return NextResponse.json({
        success: true,
        hasActiveBanner: false,
        banner: null,
      });
    }

    // Kembalikan objek banner resmi beranda dengan kedua konvensi properti (title & content + judul & pesan)
    return NextResponse.json({
      success: true,
      hasActiveBanner: true,
      banner: {
        id: activeBanner.id,
        title: activeBanner.judul,
        judul: activeBanner.judul,
        content: activeBanner.pesan,
        pesan: activeBanner.pesan,
        category: activeBanner.kategori || "PENGUMUMAN",
        kategori: activeBanner.kategori || "PENGUMUMAN",
        imageUrl: activeBanner.image_url || null,
        isBanner: true,
        isActive: true,
        startDate: activeBanner.start_date || null,
        endDate: activeBanner.end_date || null,
        createdAt: activeBanner.created_at,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: "Gagal memeriksa siaran banner: " + msg },
      { status: 500 }
    );
  }
}
