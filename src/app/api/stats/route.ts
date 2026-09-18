import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const aggStats = await SupabaseDbService.getAggregateStats();
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
  } catch (err) {
    console.error("API stats error:", err);
    return NextResponse.json({
      success: true,
      data: dataStore.getStats(),
    });
  }
}

