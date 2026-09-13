import { NextResponse } from "next/server";
import { dataStore, MasterPengumuman } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET() {
  try {
    const list = await SupabaseDbService.fetchPengumuman();
    return NextResponse.json(
      {
        success: true,
        data: list,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar pengumuman dari database." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isAuthorized = user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.seksi === "PIMPINAN" || user.seksi === "SEKSI_LOGISTIK_PUBLIKASI";
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang menerbitkan pengumuman resmi." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nomor, judul, kategori, tanggal, ringkasan, fileUrl, fileName, fileSize } = body;

    if (!nomor || !judul || !kategori) {
      return NextResponse.json(
        { success: false, message: "Nomor, judul, dan kategori pengumuman wajib diisi." },
        { status: 400 }
      );
    }

    const userName = user.nama || user.username || "Admin P2KD";
    const created = await dataStore.insertPengumuman(
      {
        nomor,
        judul,
        kategori,
        tanggal: tanggal || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        ringkasan: ringkasan || "-",
        fileUrl: fileUrl || "/docs/Tahapan_Pilkades_2027.pdf",
        fileName: fileName || `${judul.slice(0, 30)}.pdf`,
        fileSize: fileSize || "Dokumen Resmi PDF",
      },
      userName
    );

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil ditambahkan ke database.",
      data: created,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan pengumuman ke database." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isAuthorized = user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.seksi === "PIMPINAN" || user.seksi === "SEKSI_LOGISTIK_PUBLIKASI";
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang mengedit pengumuman." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, data } = body as { id: string; data: Partial<MasterPengumuman> };

    if (!id || !data) {
      return NextResponse.json(
        { success: false, message: "ID dan data pengumuman wajib disertakan." },
        { status: 400 }
      );
    }

    const userName = user.nama || user.username || "Admin P2KD";
    const updated = await dataStore.updatePengumuman(id, data, userName);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Pengumuman tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil diperbarui di database.",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pengumuman." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isAuthorized = user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.seksi === "PIMPINAN" || user.seksi === "SEKSI_LOGISTIK_PUBLIKASI";
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang menghapus pengumuman." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID pengumuman wajib disertakan." },
        { status: 400 }
      );
    }

    const userName = user.nama || user.username || "Admin P2KD";
    const success = await dataStore.deletePengumuman(id, userName);
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Pengumuman tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil dihapus dari database.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menghapus pengumuman dari database." },
      { status: 500 }
    );
  }
}
