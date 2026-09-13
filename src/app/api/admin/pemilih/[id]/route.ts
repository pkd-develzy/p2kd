import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();
    const { id } = await params;
    const voter = dataStore.getPemilihById(id);

    if (!voter) {
      return NextResponse.json(
        { success: false, message: "Data pemilih tidak ditemukan." },
        { status: 404 }
      );
    }

    const user = session.user;
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";

    // Strict Data Leak Protection: Officers can only view voters in their assigned TPS!
    if (isOfficer && user.assignedTps && user.assignedTps !== "SEMUA" && !voter.tps.includes(user.assignedTps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Kerahasiaan Data Terlindungi: Petugas lapangan dilarang mengakses data pemilih di luar ${user.assignedTps}.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: voter,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memuat data pemilih." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();
    const { id } = await params;
    const body = await req.json();
    const { alasan, ...updates } = body;

    const existing = dataStore.getPemilihById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Data pemilih tidak ditemukan." },
        { status: 404 }
      );
    }

    const user = session.user;
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";

    // Strict TPS Protection: Officer cannot modify voter outside assigned TPS
    if (isOfficer && user.assignedTps && user.assignedTps !== "SEMUA" && !existing.tps.includes(user.assignedTps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda tidak memiliki wewenang mengedit data pemilih di luar wilayah binaan ${user.assignedTps}.`,
        },
        { status: 403 }
      );
    }

    if (updates.namaLengkap) {
      updates.namaLengkap = updates.namaLengkap.toUpperCase();
    }

    const updated = await dataStore.updatePemilih(
      id,
      updates,
      user.nama || user.username,
      alasan || "Perbaikan data manual oleh petugas"
    );

    return NextResponse.json({
      success: true,
      message: "Data pemilih berhasil diperbarui dan dicatat dalam audit trail.",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui data pemilih." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "tms" or "delete"
    const alasanTms = searchParams.get("alasan") || "MENINGGAL";

    const existing = dataStore.getPemilihById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Data pemilih tidak ditemukan." },
        { status: 404 }
      );
    }

    const user = session.user;
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";

    // Strict TPS Protection
    if (isOfficer && user.assignedTps && user.assignedTps !== "SEMUA" && !existing.tps.includes(user.assignedTps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda tidak memiliki wewenang mengubah status pemilih di luar ${user.assignedTps}.`,
        },
        { status: 403 }
      );
    }

    if (mode === "tms") {
      const updated = await dataStore.markTMS(id, alasanTms, user.nama || user.username);
      return NextResponse.json({
        success: true,
        message: `Pemilih berhasil ditandai sebagai TMS (${alasanTms}).`,
        data: updated,
      });
    }

    // Direct permanent deletion is restricted to Superadmin / Pimpinan
    if (isOfficer) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Terbatas: Penghapusan permanen hanya dapat dilakukan oleh Ketua / Superadmin P2KD. Gunakan opsi Tandai TMS.",
        },
        { status: 403 }
      );
    }

    await dataStore.ensureSynced();
    const success = await dataStore.deletePemilih(id, user.nama || user.username);
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Data pemilih tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data pemilih berhasil dihapus dari master.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memproses perubahan pemilih." },
      { status: 500 }
    );
  }
}
