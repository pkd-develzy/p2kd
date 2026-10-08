import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const aggStats = await SupabaseDbService.getAggregateStats();
    if (aggStats) {
      dataStore.setAggregateStats(aggStats);
    }
    const stats = dataStore.getStats();

    if (aggStats) {
      stats.calonDps = aggStats.calonDps ?? stats.calonDps;
      stats.dps = aggStats.dps ?? stats.dps;
      stats.dpt = aggStats.dpt ?? stats.dpt;
      stats.pemilihTambahan = aggStats.pemilihTambahan ?? stats.pemilihTambahan;
      stats.totalSemua = aggStats.totalSemua || stats.totalSemua;
      stats.totalAktif = aggStats.totalAktif || stats.totalAktif;
      stats.totalLaki = aggStats.totalLaki || stats.totalLaki;
      stats.totalPerempuan = aggStats.totalPerempuan || stats.totalPerempuan;
      stats.totalTms = aggStats.totalTms ?? stats.totalTms;
      stats.totalDisabilitas = aggStats.totalDisabilitas ?? stats.totalDisabilitas;
      stats.coklitSelesai = aggStats.coklitSelesai ?? stats.coklitSelesai;

      if (Array.isArray(aggStats.breakdownWilayah) && aggStats.breakdownWilayah.length > 0) {
        stats.breakdownWilayah = aggStats.breakdownWilayah;
      }
      if (Array.isArray(aggStats.tpsStats) && aggStats.tpsStats.length > 0) {
        stats.tpsStats = aggStats.tpsStats.map((item) => ({
          ...item,
          rt: item.rt || "RT 01, 02, 03",
          rw: item.rw || `RW ${item.nomorTps}`,
        }));
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("API stats error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data statistik database.",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

