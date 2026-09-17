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

function isAuthorizedForBerita(user?: any): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;

  const role = String(user.role || "").toUpperCase();
  const seksi = String(user.seksi || "").toUpperCase();
  const username = String(user.username || "").toLowerCase();

  // 1. Super Admin, Pimpinan, Admin, Develzy
  if (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    seksi === "PIMPINAN" ||
    username === "develzy" ||
    username === "admin" ||
    username.includes("ketua") ||
    username.includes("bendahara")
  ) {
    return true;
  }

  // 2. Sekretaris & Sekretariat
  if (
    username.includes("sekretaris") ||
    role.includes("SEKRETARIS") ||
    seksi.includes("SEKRETARIAT")
  ) {
    return true;
  }

  // 3. Seksi Publikasi & Dokumentasi / Sosialisasi / Panitia
  if (
    seksi.includes("PUBLIKASI") ||
    seksi.includes("DOKUMENTASI") ||
    seksi.includes("SOSIALISASI") ||
    seksi.includes("LOGISTIK") ||
    role.includes("PUBLIKASI") ||
    role.includes("HUMAS") ||
    role.includes("ADMIN") ||
    role.includes("PANITIA")
  ) {
    return true;
  }

  // Bolehkan panitia pengelola berita kecuali akun lapangan terbatas
  return !role.startsWith("PETUGAS_TPS") && !role.startsWith("PANTARLIH") && !role.startsWith("WARGA");
}

export async function POST(req: Request) {
  const session = verifyAdminSession(req);
  if (!session.authenticated || !session.user) {
    return session.response || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorizedForBerita(session.user)) {
    return NextResponse.json(
      {
        success: false,
        message: "Akses Ditolak: Anda tidak memiliki hak akses untuk mempublikasikan artikel.",
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

    const isSekretaris = String(session.user.username || "").toLowerCase().includes("sekretaris");
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

  if (!isAuthorizedForBerita(session.user)) {
    return NextResponse.json(
      {
        success: false,
        message: "Akses Ditolak: Anda tidak memiliki hak akses untuk memperbarui artikel.",
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

  if (!isAuthorizedForBerita(session.user)) {
    return NextResponse.json(
      {
        success: false,
        message: "Akses Ditolak: Anda tidak memiliki hak akses untuk menghapus artikel.",
      },
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body.id || body.slug;
      } catch {
        // ignore
      }
    }

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
