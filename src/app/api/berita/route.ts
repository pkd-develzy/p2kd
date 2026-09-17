import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET(req: Request) {
  try {
    await dataStore.ensureSynced();
    const url = new URL(req.url);
    const kategori = url.searchParams.get("kategori") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const search = url.searchParams.get("q") || "";

    let articles = dataStore.getBeritaList(kategori, "PUBLISHED");

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      articles = articles.filter(
        (a) =>
          a.judul.toLowerCase().includes(q) ||
          a.ringkasan.toLowerCase().includes(q) ||
          a.konten.toLowerCase().includes(q)
      );
    }

    const headline = articles.find((a) => a.isHeadline) || articles[0] || null;
    const paginated = articles.slice(0, limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          headline,
          articles: paginated,
          total: articles.length,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching berita:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar berita publik." },
      { status: 500 }
    );
  }
}
