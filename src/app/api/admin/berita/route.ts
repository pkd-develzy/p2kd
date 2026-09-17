import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await dataStore.ensureSynced();
  const url = new URL(req.url);
  const kategori = url.searchParams.get("kategori") || undefined;
  const status = url.searchParams.get("status") || "ALL";

  const list = dataStore.getBeritaList(kategori, status);

  return NextResponse.json({
    success: true,
    data: list,
  });
}

export async function POST(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Check role: Only Sekretaris, Seksi 5 (Publikasi), and Superadmin can edit/post news
  const userRole = session.user.role || "";
  const userSeksi = session.user.seksi || "";
  const isSuperAdmin = session.user.isSuperAdmin || userRole === "SUPER_ADMIN" || userSeksi === "PIMPINAN";
  const isSekretaris = session.user.username.toLowerCase().includes("sekretaris") || userRole === "SEKRETARIS";
  const isSeksiPublikasi = userSeksi.includes("PUBLIKASI") || userSeksi.includes("LOGISTIK") || userRole.includes("PUBLIKASI");

  if (!isSuperAdmin && !isSekretaris && !isSeksiPublikasi) {
    return NextResponse.json(
      {
        success: false,
        message: "Akses Ditolak: Modul penulisan dan publikasi berita hanya diperuntukkan bagi Sekretaris dan Seksi 5 (Publikasi & Dokumentasi).",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { judul, kategori, ringkasan, konten, gambarUrl, status, isHeadline, lampiranPdfUrl, lampiranPdfNama } = body;

    if (!judul || !kategori || !konten) {
      return NextResponse.json(
        { success: false, message: "Judul, kategori, dan konten berita wajib diisi." },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();

    const created = await dataStore.addBerita(
      {
        judul: judul.trim(),
        kategori,
        ringkasan: ringkasan ? ringkasan.trim() : "",
        konten: konten.trim(),
        gambarUrl: gambarUrl ? gambarUrl.trim() : "/images/p2kd-musyawarah-kalisalak.png",
        penulisNama: session.user.nama || session.user.username,
        penulisJabatan: isSekretaris ? "Sekretaris P2KD" : "Seksi Publikasi & Dokumentasi",
        status: status || "PUBLISHED",
        isHeadline: Boolean(isHeadline),
        lampiranPdfUrl: lampiranPdfUrl ? lampiranPdfUrl.trim() : undefined,
        lampiranPdfNama: lampiranPdfNama ? lampiranPdfNama.trim() : undefined,
      },
      session.user.username
    );

    return NextResponse.json({
      success: true,
      message: "Artikel berita berhasil diterbitkan.",
      data: created,
    });
  } catch (error) {
    console.error("Error creating berita:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat menyimpan berita." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role || "";
  const userSeksi = session.user.seksi || "";
  const isSuperAdmin = session.user.isSuperAdmin || userRole === "SUPER_ADMIN" || userSeksi === "PIMPINAN";
  const isSekretaris = session.user.username.toLowerCase().includes("sekretaris") || userRole === "SEKRETARIS";
  const isSeksiPublikasi = userSeksi.includes("PUBLIKASI") || userSeksi.includes("LOGISTIK") || userRole.includes("PUBLIKASI");

  if (!isSuperAdmin && !isSekretaris && !isSeksiPublikasi) {
    return NextResponse.json(
      {
        success: false,
        message: "Akses Ditolak: Hanya Sekretaris dan Seksi 5 yang berhak memperbarui artikel.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID artikel wajib disertakan." }, { status: 400 });
    }

    await dataStore.ensureSynced();
    const updated = await dataStore.updateBerita(id, updates, session.user.username);

    if (!updated) {
      return NextResponse.json({ success: false, message: "Artikel tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Artikel berita berhasil diperbarui.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating berita:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui artikel berita." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role || "";
  const userSeksi = session.user.seksi || "";
  const isSuperAdmin = session.user.isSuperAdmin || userRole === "SUPER_ADMIN" || userSeksi === "PIMPINAN";
  const isSekretaris = session.user.username.toLowerCase().includes("sekretaris") || userRole === "SEKRETARIS";
  const isSeksiPublikasi = userSeksi.includes("PUBLIKASI") || userSeksi.includes("LOGISTIK") || userRole.includes("PUBLIKASI");

  if (!isSuperAdmin && !isSekretaris && !isSeksiPublikasi) {
    return NextResponse.json(
      {
        success: false,
        message: "Akses Ditolak: Hanya Sekretaris dan Seksi 5 yang berhak menghapus artikel.",
      },
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID artikel wajib disertakan." }, { status: 400 });
    }

    await dataStore.ensureSynced();
    const deleted = await dataStore.deleteBerita(id, session.user.username);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Artikel tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Artikel berita berhasil dihapus.",
    });
  } catch (error) {
    console.error("Error deleting berita:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus artikel berita." },
      { status: 500 }
    );
  }
}
