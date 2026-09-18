import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

// GET /api/admin/calon - Ambil daftar semua calon kepala desa
export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    await dataStore.ensureSynced(forceRefresh);

    const kandidatList = dataStore.getKandidatList();

    return NextResponse.json(
      {
        success: true,
        data: kandidatList,
        total: kandidatList.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/admin/calon:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data calon Kepala Desa." },
      { status: 500 }
    );
  }
}

// POST /api/admin/calon - Tambah Calon Kepala Desa Baru
export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isSuperAdmin =
      user.isSuperAdmin ||
      user.role === "SUPER_ADMIN" ||
      user.seksi === "PIMPINAN" ||
      user.seksi === "SEKSI_PENJARINGAN" ||
      user.seksi === "SEKSI_PENYARINGAN";

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akses Ditolak: Anda tidak memiliki wewenang mengelola calon Kepala Desa.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      nomorUrut,
      namaLengkap,
      gelarDepan,
      gelarBelakang,
      tempatTanggalLahir,
      pendidikanTerakhir,
      pekerjaan,
      tagline,
      visi,
      misi,
      programUnggulan,
      fotoUrl,
      warnaTema,
      statusVerifikasi,
    } = body;

    if (!namaLengkap || nomorUrut === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama lengkap dan nomor urut calon wajib diisi.",
        },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();

    const newKandidat = await dataStore.addKandidat(
      {
        nomorUrut: Number(nomorUrut),
        namaLengkap: String(namaLengkap).trim(),
        gelarDepan: gelarDepan ? String(gelarDepan).trim() : "",
        gelarBelakang: gelarBelakang ? String(gelarBelakang).trim() : "",
        tempatTanggalLahir: tempatTanggalLahir ? String(tempatTanggalLahir).trim() : "Kalisalak",
        pendidikanTerakhir: pendidikanTerakhir ? String(pendidikanTerakhir).trim() : "SLTA / Sederajat",
        pekerjaan: pekerjaan ? String(pekerjaan).trim() : "Wiraswasta",
        tagline: tagline ? String(tagline).trim() : "",
        visi: visi ? String(visi).trim() : "",
        misi: Array.isArray(misi) ? misi : [],
        programUnggulan: Array.isArray(programUnggulan) ? programUnggulan : [],
        fotoUrl: fotoUrl || "",
        warnaTema: warnaTema || "#1e3a8a",
        statusVerifikasi: statusVerifikasi || "MEMENUHI_SYARAT",
      },
      user.nama || user.username
    );

    return NextResponse.json({
      success: true,
      message: `Calon Kepala Desa Nomor Urut ${newKandidat.nomorUrut} (${newKandidat.namaLengkap}) berhasil ditambahkan dan tampil di website publik.`,
      data: newKandidat,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/calon:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan calon Kepala Desa." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/calon - Update Data Calon Kepala Desa
export async function PUT(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isSuperAdmin =
      user.isSuperAdmin ||
      user.role === "SUPER_ADMIN" ||
      user.seksi === "PIMPINAN" ||
      user.seksi === "SEKSI_PENJARINGAN" ||
      user.seksi === "SEKSI_PENYARINGAN";

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akses Ditolak: Anda tidak memiliki wewenang memperbarui data calon Kepala Desa.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID calon wajib disertakan." },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();

    if (updateFields.nomorUrut !== undefined) {
      updateFields.nomorUrut = Number(updateFields.nomorUrut);
    }

    const updated = await dataStore.updateKandidat(
      id,
      updateFields,
      user.nama || user.username
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Calon Kepala Desa tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Data Calon Nomor Urut ${updated.nomorUrut} (${updated.namaLengkap}) berhasil diperbarui dan disinkronkan ke situs publik.`,
      data: updated,
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/calon:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui data calon Kepala Desa." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/calon - Hapus Calon Kepala Desa
export async function DELETE(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isSuperAdmin =
      user.isSuperAdmin ||
      user.role === "SUPER_ADMIN" ||
      user.seksi === "PIMPINAN";

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akses Ditolak: Hanya Ketua P2KD / Superadmin yang berwenang menghapus data calon Kepala Desa.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID calon wajib disertakan." },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();

    const success = await dataStore.deleteKandidat(
      id,
      user.nama || user.username
    );

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Calon Kepala Desa tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data calon Kepala Desa berhasil dihapus dari sistem dan website publik.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/calon:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus data calon Kepala Desa." },
      { status: 500 }
    );
  }
}
