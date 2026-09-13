import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response!;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const isConfigured = supabaseUrl.includes("supabase.co");

  let isConnected = false;
  let latencyMs = 0;
  let errorMessage = "";
  let cloudStats: { pemilihCount?: number; anggotaCount?: number; tpsCount?: number } = {};

  if (isConfigured) {
    try {
      const startTime = Date.now();
      const client = getSupabaseAdmin();
      const { count: pemilihCount, error: pemErr } = await client.from("pemilih").select("*", { count: "exact", head: true });
      const { count: anggotaCount } = await client.from("anggota_p2kd").select("*", { count: "exact", head: true });
      const { count: tpsCount } = await client.from("tps").select("*", { count: "exact", head: true });

      latencyMs = Date.now() - startTime;

      if (pemErr) {
        errorMessage = pemErr.message;
        isConnected = false;
      } else {
        isConnected = true;
        cloudStats = {
          pemilihCount: pemilihCount || 0,
          anggotaCount: anggotaCount || 0,
          tpsCount: tpsCount || 0,
        };
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "Gagal terhubung ke Supabase Cloud.";
      isConnected = false;
    }
  }

  await dataStore.ensureSynced();
  const localStats = dataStore.getStats();

  return NextResponse.json({
    success: true,
    data: {
      provider: "Database Server Resmi P2KD Kalisalak",
      configured: isConfigured,
      connected: isConnected,
      latencyMs: isConnected ? latencyMs : null,
      mode: isConnected ? "SERVER_TERPUSAT_AKTIF" : "SISTEM_LOKAL_AKTIF",
      cloudStats,
      localStats: {
        totalPemilih: localStats.totalSemua,
        totalAktif: localStats.totalAktif,
        totalTms: localStats.totalTms,
        totalTps: localStats.tpsStats.length,
        totalAduan: localStats.totalAduan,
      },
      supabaseUrl: isConfigured ? "Server Terkoneksi Aman (Encrypted)" : "Belum terkonfigurasi",
      error: errorMessage || null,
      tahapan: localStats.tahapan,
    },
  });
}
