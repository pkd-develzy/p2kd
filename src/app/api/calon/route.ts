import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET() {
  try {
    await dataStore.ensureSynced();
    const kandidatList = dataStore.getKandidatList();
    return NextResponse.json(
      {
        success: true,
        data: kandidatList,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memuat data calon Kepala Desa." },
      { status: 500 }
    );
  }
}
