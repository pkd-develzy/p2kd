import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET() {
  try {
    await dataStore.ensureSynced();
    const stats = dataStore.getStats();
    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
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
