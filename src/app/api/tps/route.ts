import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET() {
  try {
    await dataStore.ensureSynced();
    const list = dataStore.getTpsList();
    const pemilih = dataStore.getPemilihList();

    // High-performance single-pass aggregation
    const countsByTps = new Map<string, { total: number; l: number; p: number }>();
    for (const voter of pemilih) {
      if (voter.statusAktif !== "AKTIF") continue;
      const key = voter.tps || "";
      const stat = countsByTps.get(key) || { total: 0, l: 0, p: 0 };
      stat.total += 1;
      if (voter.jenisKelamin === "L") stat.l += 1;
      else if (voter.jenisKelamin === "P") stat.p += 1;
      countsByTps.set(key, stat);
    }

    const publicTps = list.map((t) => {
      let total = 0;
      let l = 0;
      let p = 0;

      for (const [key, val] of countsByTps.entries()) {
        if (key.includes(t.nomorTps) || key.includes(t.namaTps)) {
          total += val.total;
          l += val.l;
          p += val.p;
        }
      }

      return {
        id: t.id,
        nomorTps: t.nomorTps,
        namaTps: t.namaTps,
        lokasi: t.lokasi,
        alamat: t.alamat,
        rt: t.rt,
        rw: t.rw,
        status: t.status,
        totalPemilih: total,
        laki: l,
        perempuan: p,
      };
    });

    // Urutkan per nomor RW/TPS secara numerik (01 s/d 13)
    publicTps.sort((a, b) => {
      const numA = parseInt((a.rw || a.nomorTps || "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt((b.rw || b.nomorTps || "").replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

    return NextResponse.json(
      {
        success: true,
        total: publicTps.length,
        data: publicTps,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memuat data sebaran Tabung Pemilihan publik." },
      { status: 500 }
    );
  }
}
