import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseSeksi1Admin } from "@/lib/supabase";
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
      const seksi1Client = getSupabaseSeksi1Admin();

      // Parallelize queries across both databases to measure true network latency
      const [pemRes, agtRes, tpsRes] = await Promise.all([
        seksi1Client.from("pemilih").select("*", { count: "exact", head: true }),
        client.from("anggota_p2kd").select("*", { count: "exact", head: true }),
        seksi1Client.from("tps").select("*", { count: "exact", head: true }),
      ]);

      latencyMs = Date.now() - startTime;

      if (pemRes.error) {
        errorMessage = pemRes.error.message;
        isConnected = false;
      } else {
        isConnected = true;
        cloudStats = {
          pemilihCount: pemRes.count || 0,
          anggotaCount: agtRes.count || 0,
          tpsCount: tpsRes.count || 0,
        };
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "Gagal terhubung ke Supabase Cloud.";
      isConnected = false;
    }
  }

  if (!dataStore.isCloudConnected()) {
    await dataStore.ensureSynced();
  }
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
  },
  {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
