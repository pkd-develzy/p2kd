import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();
    const list = dataStore.getTpsList();
    const pemilih = dataStore.getPemilihList();

    const tpsWithStats = list.map((t) => {
      const assigned = pemilih.filter(
        (p) => p.statusAktif === "AKTIF" && (p.tps.includes(t.nomorTps) || p.tps.includes(t.namaTps))
      );
      const l = assigned.filter((p) => p.jenisKelamin === "L").length;
      const p = assigned.filter((p) => p.jenisKelamin === "P").length;

      return {
        ...t,
        totalPemilih: assigned.length,
        laki: l,
        perempuan: p,
        sisaKuota: Math.max(0, t.kuotaMaksimal - assigned.length),
        persentaseTerisi: Math.min(100, Math.round((assigned.length / t.kuotaMaksimal) * 100)),
      };
    });

    return NextResponse.json({
      success: true,
      total: tpsWithStats.length,
      data: tpsWithStats,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar master TPS." },
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

    if (!session.user.isSuperAdmin && session.user.role !== "SUPER_ADMIN" && session.user.seksi !== "PIMPINAN") {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Hanya Ketua / Superadmin yang berwenang menambah TPS." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nomorTps, namaTps, lokasi, alamat, rt, rw, kuotaMaksimal } = body;

    if (!nomorTps || !namaTps || !lokasi) {
      return NextResponse.json(
        { success: false, message: "Nomor TPS, Nama TPS, dan Lokasi wajib diisi." },
        { status: 400 }
      );
    }

    // Check duplicate Nomor TPS
    const existingList = dataStore.getTpsList();
    const formattedNomor = nomorTps.toString().padStart(3, "0");
    const isDuplicate = existingList.some(
      (t) => t.nomorTps === formattedNomor || t.kodeTps === `TPS-KLS-${formattedNomor}`
    );

    if (isDuplicate) {
      return NextResponse.json(
        { success: false, message: `TPS dengan nomor ${formattedNomor} sudah ada.` },
        { status: 409 }
      );
    }

    const newTps = await dataStore.addTps(
      {
        kodeTps: `TPS-KLS-${formattedNomor}`,
        nomorTps: formattedNomor,
        namaTps,
        lokasi,
        alamat: alamat || "Desa Kalisalak",
        rt: rt || "01",
        rw: rw || "01",
        kuotaMaksimal: Number(kuotaMaksimal) || 300,
        status: "AKTIF",
      },
      session.user.nama || session.user.username
    );

    return NextResponse.json({
      success: true,
      message: `TPS baru ${newTps.namaTps} berhasil ditambahkan.`,
      data: newTps,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan TPS baru." },
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

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID TPS wajib disertakan." },
        { status: 400 }
      );
    }

    const updated = await dataStore.updateTps(id, updates, session.user.nama || session.user.username);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "TPS tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pengaturan ${updated.namaTps} berhasil diperbarui.`,
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pengaturan TPS." },
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

    if (!session.user.isSuperAdmin && session.user.role !== "SUPER_ADMIN" && session.user.seksi !== "PIMPINAN") {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Hanya Ketua / Superadmin yang berwenang menghapus TPS." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID TPS yang akan dihapus wajib disertakan." },
        { status: 400 }
      );
    }

    const result = await dataStore.deleteTps(id, session.user.nama || session.user.username);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memproses penghapusan TPS." },
      { status: 500 }
    );
  }
}
