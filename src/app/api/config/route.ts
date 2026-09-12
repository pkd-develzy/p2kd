import { NextResponse } from "next/server";
import { dataStore, PublicWebConfig } from "@/lib/data-store";

export async function GET() {
  try {
    await dataStore.ensureSynced();
    const config = dataStore.getWebConfig();
    return NextResponse.json(
      {
        success: true,
        data: config,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memuat konfigurasi website publik." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, user } = body as { data: Partial<PublicWebConfig>; user?: string };

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Data konfigurasi tidak valid." },
        { status: 400 }
      );
    }

    const updated = dataStore.updateWebConfig(data, user || "Admin P2KD");

    return NextResponse.json({
      success: true,
      message: "Pengaturan website publik berhasil diperbarui secara realtime.",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menyimpan pengaturan." },
      { status: 500 }
    );
  }
}
