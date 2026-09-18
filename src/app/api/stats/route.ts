import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";

export async function GET() {
  try {
    const [aggStats] = await Promise.all([
      SupabaseDbService.getAggregateStats(),
      dataStore.ensureSynced(),
    ]);

    const stats = dataStore.getStats();
    if (aggStats) {
      stats.totalSemua = aggStats.totalSemua || stats.totalSemua;
      stats.totalAktif = aggStats.totalAktif || stats.totalAktif;
      stats.totalLaki = aggStats.totalLaki || stats.totalLaki;
      stats.totalPerempuan = aggStats.totalPerempuan || stats.totalPerempuan;
      stats.totalTms = aggStats.totalTms || stats.totalTms;
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
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memuat ringkasan statistik database." },
      { status: 500 }
    );
  }
}
