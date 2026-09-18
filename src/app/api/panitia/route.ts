import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dataStore.ensureSynced();
    // Get all public committee members (exclude developer / hidden account)
    const list = dataStore.getAnggotaList("SEMUA", false);

    // Filter only active members and sort hierarchically:
    // PIMPINAN (Ketua, Wakil, Sekretaris, Bendahara) -> SEKSI 1 -> SEKSI 2 -> SEKSI 3 -> SEKSI 4 -> SEKSI 5 -> LAINNYA
    const seksiPriority: Record<string, number> = {
      PIMPINAN: 1,
      SEKSI_PEMILIH: 2,
      SEKSI_PENJARINGAN: 3,
      SEKSI_PENYARINGAN: 4,
      SEKSI_PUNGUT_HITUNG: 5,
      SEKSI_LOGISTIK_PUBLIKASI: 6,
      PANTARLIH_LAPANGAN: 7,
    };

    const sanitized = list
      .filter((a) => a.status === "AKTIF")
      .map((a) => ({
        id: a.id,
        namaLengkap: a.namaLengkap,
        jabatan: a.jabatan,
        seksi: a.seksi,
        seksiLabel: a.seksiLabel || a.seksi,
        fotoUrl: a.fotoUrl || null,
        kontakWa: a.kontakWa ? `${a.kontakWa.slice(0, 4)}****${a.kontakWa.slice(-3)}` : null,
      }))
      .sort((a, b) => {
        const prioA = seksiPriority[a.seksi] || 99;
        const prioB = seksiPriority[b.seksi] || 99;
        return prioA - prioB;
      });

    return NextResponse.json(
      {
        success: true,
        data: sanitized,
        total: sanitized.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/panitia:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat profil panitia P2KD." },
      { status: 500 }
    );
  }
}
