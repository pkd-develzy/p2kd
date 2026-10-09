import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";
import {
  verifyAdminSession,
  canAccessVoterData,
  isAuthorizedForVoterTps,
  isPantarlih,
  isDeveloper,
  isKetuaP2KD,
  isSeksiPemilih,
} from "@/lib/auth-middleware";

export async function GET(req: Request) {
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
          message: "Akses Ditolak: Modul Coklit hanya dapat diakses oleh Ketua P2KD, Seksi 1, dan Petugas Pantarlih wilayah.",
        },
        { status: 403 }
      );
    }

    await dataStore.ensureSynced();
    const { searchParams } = new URL(req.url);
    let tps = searchParams.get("tps") || undefined;
    const status = searchParams.get("status") || undefined; // "ALL", "BELUM", "SESUAI", "UBAH_DATA", "TMS"
    const search = searchParams.get("search") || undefined;

    const isFieldOfficer = isPantarlih(user) && !isKetuaP2KD(user) && !isDeveloper(user) && !isSeksiPemilih(user);

    if (isFieldOfficer) {
      if (!user.assignedTps || user.assignedTps === "SEMUA") {
        return NextResponse.json(
          {
            success: false,
            message: "Akses Ditolak: Anda belum memiliki alokasi wilayah TPS/RW untuk coklit.",
          },
          { status: 403 }
        );
      }
      tps = user.assignedTps;
    }

    let list = dataStore.getPemilihList({ tps, search });
    if (list.length === 0) {
      if (search && search.trim()) {
        list = await SupabaseDbService.searchPemilih(search.trim(), { tps, limit: 100 });
      } else {
        const paged = await SupabaseDbService.fetchPemilihPaged(0, 100, { tps });
        list = paged.data;
      }
    }

    if (status && status !== "ALL") {
      if (status === "BELUM") {
        list = list.filter((p) => !p.coklitStatus || p.coklitStatus === "BELUM_COKLIT");
      } else {
        list = list.filter((p) => p.coklitStatus === status);
      }
    }

    const stats = dataStore.getCoklitStats(tps);

    return NextResponse.json({
      success: true,
      total: list.length,
      stats,
      data: list,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data Coklit lapangan." },
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
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Anda tidak memiliki wewenang memperbarui data coklit pemilih.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { voterId, status, catatan } = body;

    if (!voterId || !status) {
      return NextResponse.json(
        { success: false, message: "ID Pemilih dan Status Coklit wajib disertakan." },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();
    const targetVoter = await dataStore.getPemilihByIdAsync(voterId);
    if (!targetVoter) {
      return NextResponse.json(
        { success: false, message: "Data pemilih tidak ditemukan." },
        { status: 404 }
      );
    }

    // Strict TPS protection: field officers can only coklit voters in their assigned TPS
    if (!isAuthorizedForVoterTps(user, targetVoter.tps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda hanya berwenang melakukan coklit pemilih di wilayah binaan ${user.assignedTps || ""}.`,
        },
        { status: 403 }
      );
    }

    const userName = user.nama || user.username || "Koordinator RW";

    // Update in-memory dataStore and sync to Supabase Cloud
    const updated = await dataStore.updateCoklitStatus(
      voterId,
      status,
      catatan || "",
      userName
    );

    // Kirim notifikasi otomatis aktivitas petugas ke grup Telegram (tanpa simpan database)
    try {
      const { notifyPetugasActivity } = await import("@/lib/telegram");
      let actTitle = "Pemutakhiran Calon DPS (SESUAI)";
      let actChange = "CALON DPS ➜ SESUAI";
      let actDetail = catatan ? `Catatan: ${catatan}` : "Fisik KTP-el dan KK cocok 100%.";

      if (status === "UBAH_DATA") {
        actTitle = "Perbaikan Elemen Data Pemilih";
        actChange = "CALON DPS ➜ DIPERBAIKI (Ubah Data)";
        actDetail = catatan ? `Koreksi data: ${catatan}` : "Dilakukan koreksi identitas / disabilitas di lapangan.";
      } else if (status === "TMS") {
        actTitle = "Penetapan Tidak Memenuhi Syarat (TMS)";
        actChange = `CALON DPS ➜ TMS (${catatan || "Tidak Memenuhi Syarat"})`;
        actDetail = `Warga ditetapkan TMS: ${catatan || "Data Tidak Memenuhi Syarat"}`;
      } else if (status === "BELUM" || status === "BELUM_COKLIT") {
        actTitle = "Reset Status Pemutakhiran Calon DPS";
        actChange = "STATUS ➜ CALON DPS (Reset)";
        actDetail = "Status pemutakhiran dikembalikan ke status awal Calon DPS.";
      }

      const maskedNik = targetVoter.nik ? `${targetVoter.nik.slice(0, 6)}******${targetVoter.nik.slice(-4)}` : "-";
      void notifyPetugasActivity({
        namaPetugas: userName,
        rolePetugas: user.role === "pantarlih" ? `Pantarlih ${targetVoter.tps}` : (user.role || "Petugas Lapangan"),
        wilayahTps: targetVoter.tps,
        aktivitas: actTitle,
        perubahanStatus: actChange,
        targetWarga: `${targetVoter.namaLengkap} (NIK: ${maskedNik})`,
        wilayah: `${targetVoter.tps} (RT ${targetVoter.rt || "01"} / RW ${targetVoter.rw || "01"})`,
        rincian: actDetail,
      }).catch(() => {});
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      success: true,
      message: `Status Coklit berhasil diperbarui (${status}).`,
      data: updated,
    });
  } catch (err) {
    console.error("Error in PUT /api/admin/coklit:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui status Coklit." },
      { status: 500 }
    );
  }
}
