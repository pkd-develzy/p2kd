import { NextResponse } from "next/server";
import { dataStore, PetugasStatus } from "@/lib/data-store";
import { verifyAdminSession, isDeveloper, isKetuaP2KD, isSeksiPemilih } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

// GET /api/admin/petugas-dpt - Mengambil seluruh data pendaftar petugas DPT bagi Panitia P2KD
export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    if (forceRefresh || dataStore.getPetugasDptList().length === 0) {
      await dataStore.ensureSynced(forceRefresh);
    }
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

    if (!isDeveloper(session.user) && !isKetuaP2KD(session.user) && !isSeksiPemilih(session.user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang untuk memverifikasi pendaftar petugas." },
        { status: 403 }
      );
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
      "TMS",
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

    // Sinkronkan ke Struktur Anggota P2KD & Akun Kredensial HANYA JIKA DITETAPKAN (Resmi menjadi Petugas Pantarlih)
    let accountInfo: { username: string; isNew: boolean; plainPassword?: string; role?: string } | null = null;
    if (updated.status === "DITETAPKAN") {
      try {
        const syncResult = await dataStore.syncPetugasToAnggota(updated, operatorName);
        accountInfo = {
          username: syncResult.anggota.username,
          isNew: syncResult.isNew,
          plainPassword: syncResult.plainPassword || "p2kd2026",
          role: syncResult.anggota.role,
        };
      } catch (syncErr) {
        console.warn("Auto-sync ke Anggota P2KD gagal:", syncErr);
      }
    } else if (updated.status === "TMS" || updated.status === "TIDAK_LOLOS") {
      // Jika status ditolak/TMS, nonaktifkan akun panitia jika sebelumnya pernah terdaftar
      try {
        const cleanNik = updated.nik ? updated.nik.replace(/\D/g, "") : "";
        const cleanWa = updated.nomorWa ? updated.nomorWa.replace(/\D/g, "") : "";
        const existingAgt = dataStore.getAnggotaList().find((a) => {
          const matchNik = cleanNik.length === 16 && a.nik && a.nik.replace(/\D/g, "") === cleanNik;
          const matchWa = cleanWa.length >= 9 && a.kontakWa && a.kontakWa.replace(/\D/g, "") === cleanWa;
          const matchName = a.namaLengkap.trim().toLowerCase() === updated.namaLengkap.trim().toLowerCase();
          return matchNik || matchWa || matchName;
        });
        if (existingAgt && existingAgt.seksi === "PANTARLIH_LAPANGAN") {
          await dataStore.updateAnggota(existingAgt.id, { status: "NONAKTIF" }, operatorName);
        }
      } catch (deactErr) {
        console.warn("Deaktivasi akun petugas gagal:", deactErr);
      }
    }

    const customMessage = accountInfo
      ? accountInfo.isNew
        ? `Petugas ${updated.namaLengkap} resmi DITETAPKAN. Otomatis dimasukkan ke Struktur Anggota P2KD & dibuatkan akun dengan username: '${accountInfo.username}' (Password: '${accountInfo.plainPassword}').`
        : `Data penugasan petugas ${updated.namaLengkap} diperbarui (${updated.status}). Akun Anggota P2KD aktif: '${accountInfo.username}'.`
      : updated.status === "LOLOS"
      ? `Pendaftar ${updated.namaLengkap} dinyatakan LOLOS seleksi administrasi (Calon Petugas). Menunggu penetapan resmi untuk aktivasi akun.`
      : `Data pendaftar ${updated.namaLengkap} berhasil diperbarui (${updated.status}).`;

    return NextResponse.json({
      success: true,
      message: customMessage,
      data: updated,
      account: accountInfo,
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

    if (!isDeveloper(session.user) && !isKetuaP2KD(session.user) && !isSeksiPemilih(session.user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang untuk menghapus pendaftar petugas." },
        { status: 403 }
      );
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
