import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import {
  verifyAdminSession,
  canAccessVoterData,
  isAuthorizedForVoterTps,
  isDeveloper,
  isKetuaP2KD,
} from "@/lib/auth-middleware";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Data pemilih hanya dapat diakses oleh Developer, Ketua P2KD, Seksi 1, dan Petugas Pantarlih RW terkait.",
        },
        { status: 403 }
      );
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

    // Strict Data Leak Protection: Pantarlih can only view voters in their assigned TPS/RW!
    if (!isAuthorizedForVoterTps(user, voter.tps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Kerahasiaan Data Terlindungi: Petugas lapangan dilarang mengakses data pemilih di luar wilayah binaan ${user.assignedTps || ""}.`,
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

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Anda tidak memiliki wewenang memperbarui data pemilih.",
        },
        { status: 403 }
      );
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

    // Strict TPS Protection: Officer cannot modify voter outside assigned TPS
    if (!isAuthorizedForVoterTps(user, existing.tps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda tidak memiliki wewenang mengedit data pemilih di luar wilayah binaan ${user.assignedTps || ""}.`,
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

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Anda tidak memiliki wewenang mengubah status pemilih.",
        },
        { status: 403 }
      );
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

    // Strict TPS Protection
    if (!isAuthorizedForVoterTps(user, existing.tps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda tidak memiliki wewenang mengubah status pemilih di luar wilayah binaan ${user.assignedTps || ""}.`,
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

    // Direct permanent deletion is strictly restricted to Developer & Ketua P2KD
    if (!isDeveloper(user) && !isKetuaP2KD(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Terbatas: Penghapusan permanen hanya dapat dilakukan oleh Ketua P2KD atau Developer. Gunakan opsi Tandai TMS.",
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
