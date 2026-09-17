import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Parameter slug berita tidak valid." },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();
    const article = dataStore.getBeritaBySlug(slug);

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Artikel berita tidak ditemukan." },
        { status: 404 }
      );
    }

    // Increment hit counter asynchronously
    dataStore.incrementBeritaViews(article.id);

    // Fetch related articles in same category
    const related = dataStore
      .getBeritaList(article.kategori, "PUBLISHED")
      .filter((a) => a.id !== article.id)
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      data: {
        article,
        related,
      },
    });
  } catch (error) {
    console.error("Error fetching single berita:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat detail artikel berita." },
      { status: 500 }
    );
  }
}
