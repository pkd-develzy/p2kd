import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    if (!canAccessVoterData(session.user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang modul Coklit." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rw = searchParams.get("rw") || "01";
    const rwClean = rw.replace(/\D/g, "").padStart(2, "0");
    const rwStr = `RW ${rwClean}`;

    const client = SupabaseDbService.getSeksi1Client();

    // 1. Ambil token resmi dari qr_rumah untuk wilayah RW ini
    const { data: qrRows } = await client
      .from("qr_rumah")
      .select("qr_token, status, assigned_rw, assigned_tps")
      .eq("assigned_rw", rwStr)
      .order("created_at", { ascending: true })
      .limit(100);

    // 2. Ambil rumah yang SUDAH terdata dari lapangan (untuk Mode Rekapitulasi)
    const { data: registeredHouses } = await client
      .from("rumah")
      .select(`
        id,
        qr_token,
        alamat,
        rt,
        rw,
        status,
        kartu_keluarga (
          id,
          no_kk,
          nama_kepala_keluarga,
          jumlah_anggota,
          anggota_keluarga (
            id,
            nama,
            nik,
            jenis_kelamin,
            status_verifikasi
          )
        )
      `)
      .eq("rw", rwClean)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      qrTokens: (qrRows || []).map((q: { qr_token: string }) => q.qr_token),
      registeredHouses: registeredHouses || [],
    });
  } catch (err) {
    console.error("Error fetching stiker QR data:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data stiker QR resmi." },
      { status: 500 }
    );
  }
}
