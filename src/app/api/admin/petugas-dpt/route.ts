import { NextResponse } from "next/server";
import { dataStore, PetugasStatus } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

// GET /api/admin/petugas-dpt - Mengambil seluruh data pendaftar petugas DPT bagi Panitia P2KD
export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") !== "false";
    await dataStore.ensureSynced(forceRefresh);
    const list = dataStore.getPetugasDptList();

    return NextResponse.json(
      {
        success: true,
        data: list,
        total: list.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/admin/petugas-dpt:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data pendaftar petugas DPT." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/petugas-dpt - Verifikasi berkas, penetapan status, dan penugasan wilayah oleh Panitia
export async function PUT(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID pendaftar petugas DPT wajib disertakan." },
        { status: 400 }
      );
    }

    const validStatuses: PetugasStatus[] = [
      "MENUNGGU_VERIFIKASI",
      "PERLU_KLARIFIKASI",
      "LOLOS",
      "TIDAK_LOLOS",
      "DITETAPKAN",
    ];

    if (updateFields.status && !validStatuses.includes(updateFields.status as PetugasStatus)) {
      return NextResponse.json(
        { success: false, message: "Format status verifikasi tidak valid." },
        { status: 400 }
      );
    }

    const operatorName = session.user.nama || session.user.username;

    const updated = await dataStore.updatePetugasDpt(
      id,
      updateFields,
      operatorName
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Data pendaftar petugas tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Data pendaftar ${updated.namaLengkap} berhasil diperbarui.`,
      data: updated,
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/petugas-dpt:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui data pendaftar petugas DPT." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/petugas-dpt - Menghapus data pendaftar petugas DPT
export async function DELETE(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID pendaftar wajib disertakan." },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();
    const operatorName = session.user.nama || session.user.username;
    const success = await dataStore.deletePetugasDpt(id, operatorName);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Data pendaftar petugas tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data pendaftar petugas DPT berhasil dihapus.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/petugas-dpt:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus data pendaftar petugas DPT." },
      { status: 500 }
    );
  }
}
