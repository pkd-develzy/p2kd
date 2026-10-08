import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseSeksi1Admin, getSupabaseServer3Admin } from "@/lib/supabase";
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
  let cloudStats: { pemilihCount?: number; anggotaCount?: number; tpsCount?: number; petugasCount?: number } = {};

  if (isConfigured) {
    try {
      const startTime = Date.now();
      const client = getSupabaseAdmin();
      const seksi1Client = getSupabaseSeksi1Admin();
      const server3Client = getSupabaseServer3Admin();

      // Parallelize queries across all 3 isolated database servers
      const [pemRes, agtRes, tpsRes, beritaRes, petRes] = await Promise.all([
        seksi1Client.from("pemilih").select("*", { count: "exact", head: true }),
        server3Client.from("anggota_p2kd").select("*", { count: "exact", head: true }),
        seksi1Client.from("tps").select("*", { count: "exact", head: true }),
        client.from("berita_artikel").select("*", { count: "exact", head: true }),
        seksi1Client.from("pendaftaran_petugas_dpt").select("*", { count: "exact", head: true }),
      ]);

      latencyMs = Math.max(Date.now() - startTime, 18);

      const hasAllFailed = Boolean(pemRes.error && agtRes.error && beritaRes.error);
      if (hasAllFailed) {
        errorMessage = pemRes.error?.message || agtRes.error?.message || beritaRes.error?.message || "Gagal menghubungi database server.";
        isConnected = false;
      } else {
        isConnected = true;
        cloudStats = {
          pemilihCount: typeof pemRes.count === "number" ? pemRes.count : 0,
          anggotaCount: typeof agtRes.count === "number" ? agtRes.count : 0,
          tpsCount: typeof tpsRes.count === "number" ? tpsRes.count : 0,
          petugasCount: typeof petRes.count === "number" ? petRes.count : 0,
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
        calonDps: localStats.calonDps ?? localStats.totalAktif,
        dps: localStats.dps ?? localStats.totalAktif,
        dpt: localStats.dpt ?? 0,
        pemilihTambahan: localStats.pemilihTambahan ?? 0,
        totalPemilih: localStats.totalSemua,
        totalAktif: localStats.totalAktif,
        totalLaki: localStats.totalLaki,
        totalPerempuan: localStats.totalPerempuan,
        totalTms: localStats.totalTms,
        totalDps: localStats.dps ?? localStats.totalAktif,
        totalDpt: localStats.dpt ?? 0,
        totalWilayah: localStats.totalWilayah ?? 13,
        totalTps: localStats.totalWilayah ?? localStats.tpsStats.length,
        totalAduan: localStats.totalAduan,
        totalPetugas: cloudStats.petugasCount ?? localStats.totalPetugas ?? 0,
        totalAnggota: cloudStats.anggotaCount ?? localStats.totalAnggota ?? 0,
        totalAudit: localStats.totalAudit ?? 0,
        breakdownWilayah: localStats.breakdownWilayah ?? localStats.tpsStats,
        tpsStats: localStats.tpsStats,
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
