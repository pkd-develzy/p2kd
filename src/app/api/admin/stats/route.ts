import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const aggStats = await SupabaseDbService.getAggregateStats();
    const stats = dataStore.getStats();

    if (aggStats) {
      stats.totalSemua = aggStats.totalSemua || stats.totalSemua;
      stats.totalAktif = aggStats.totalAktif || stats.totalAktif;
      stats.totalLaki = aggStats.totalLaki || stats.totalLaki;
      stats.totalPerempuan = aggStats.totalPerempuan || stats.totalPerempuan;
      stats.totalTms = aggStats.totalTms || stats.totalTms;
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("API admin stats error:", err);
    return NextResponse.json({
      success: true,
      data: dataStore.getStats(),
    });
  }
}

