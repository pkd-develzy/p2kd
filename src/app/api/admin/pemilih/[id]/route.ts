import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import {
  verifyAdminSession,
  canAccessVoterData,
  isAuthorizedForVoterTps,
  isPantarlih,
  isSeksiPemilih,
  isDeveloper,
  isKetuaP2KD,
} from "@/lib/auth-middleware";
import { normalizeWilayahCode, getAutoTabungByRtRw } from "@/lib/kalisalak-wilayah";
import { formatNamaGelar } from "@/lib/nama-gelar";

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
    const voter = await dataStore.getPemilihByIdAsync(id);

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

    const existing = await dataStore.getPemilihByIdAsync(id);
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

    const isFieldOfficer = isPantarlih(user) && !isKetuaP2KD(user) && !isDeveloper(user) && !isSeksiPemilih(user);

    if (isFieldOfficer) {
      const officerRwDigits = (user.assignedTps || "").replace(/\D/g, "");
      const assignedRwCode = officerRwDigits.padStart(2, "0");

      if (updates.rw && normalizeWilayahCode(updates.rw) !== assignedRwCode) {
        return NextResponse.json(
          {
            success: false,
            message: `Akses Ditolak: Anda hanya berwenang mengelola pemilih di wilayah RW ${assignedRwCode}. Dilarang memindahkan pemilih ke RW lain.`,
          },
          { status: 403 }
        );
      }

      if (updates.rt && !["01", "02", "03"].includes(normalizeWilayahCode(updates.rt))) {
        return NextResponse.json(
          {
            success: false,
            message: "Format RT tidak valid. Pilihan RT wajib RT 01, RT 02, atau RT 03.",
          },
          { status: 400 }
        );
      }
    }

    if (updates.namaLengkap) {
      updates.namaLengkap = formatNamaGelar(updates.namaLengkap);
    }

    if (updates.rw || updates.rt) {
      const targetRw = normalizeWilayahCode(updates.rw || existing.rw);
      const targetRt = normalizeWilayahCode(updates.rt || existing.rt);
      updates.rw = targetRw;
      updates.rt = targetRt;
      updates.tps = getAutoTabungByRtRw(targetRw, targetRt, dataStore.getTpsList());
    }

    // Cegah manipulasi status tahapan secara langsung tanpa melalui state machine
    if ("tahap" in updates) {
      delete (updates as Record<string, unknown>).tahap;
    }

    const updated = await dataStore.updatePemilih(
      id,
      updates,
      user.nama || user.username,
      alasan || "Perbaikan data manual oleh petugas"
    );

    // Jika pemilih sedang berada di tahap DPS, catat perubahan ini ke riwayat pembenahan DPSHP sah
    if (existing.tahap === "DPS") {
      try {
        const { SupabaseDbService } = await import("@/lib/supabase-db");
        const jenis = (updates.rw || updates.rt) ? "MUTASI_WILAYAH" : "KOREKSI_IDENTITAS";
        await SupabaseDbService.createPembenahanDpshp({
          pemilihId: id,
          jenisPembenahan: jenis,
          fieldChanged: Object.keys(updates).join(", "),
          alasan: alasan || "Pembenahan data pemilih DPS oleh petugas",
          petugasPengusul: user.nama || user.username || "Petugas",
          autoValidate: true,
          petugasPemvalidasi: user.nama || user.username,
        });
      } catch (err) {
        console.warn("Auto pembenahan DPS log warning:", err);
      }
    }

    // Kirim notifikasi otomatis aktivitas perbaikan data ke grup Telegram (tanpa simpan database)
    try {
      const { notifyPetugasActivity } = await import("@/lib/telegram");
      const maskedNik = existing.nik ? `${existing.nik.slice(0, 6)}******${existing.nik.slice(-4)}` : "-";
      void notifyPetugasActivity({
        namaPetugas: user.nama || user.username || "Petugas Lapangan",
        rolePetugas: user.role === "pantarlih" ? `Pantarlih ${existing.tps}` : (user.role || "Petugas"),
        wilayahTps: existing.tps,
        aktivitas: "Perbaikan Elemen Data Pemilih",
        targetWarga: `${existing.namaLengkap} (NIK: ${maskedNik})`,
        wilayah: `${existing.tps} (RT ${existing.rt} / RW ${existing.rw})`,
        rincian: alasan || "Perbaikan data manual oleh petugas lapangan.",
      }).catch(() => {});
    } catch {
      // non-blocking
    }

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

    const existing = await dataStore.getPemilihByIdAsync(id);
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

      // Kirim notifikasi otomatis penetapan TMS ke grup Telegram (tanpa simpan database)
      try {
        const { notifyPetugasActivity } = await import("@/lib/telegram");
        const maskedNik = existing.nik ? `${existing.nik.slice(0, 6)}******${existing.nik.slice(-4)}` : "-";
        void notifyPetugasActivity({
          namaPetugas: user.nama || user.username || "Petugas Lapangan",
          rolePetugas: user.role === "pantarlih" ? `Pantarlih ${existing.tps}` : (user.role || "Petugas"),
          wilayahTps: existing.tps,
          aktivitas: `Penetapan Tidak Memenuhi Syarat (TMS: ${alasanTms})`,
          perubahanStatus: `CALON DPS ➜ TMS (${alasanTms})`,
          targetWarga: `${existing.namaLengkap} (NIK: ${maskedNik})`,
          wilayah: `${existing.tps} (RT ${existing.rt} / RW ${existing.rw})`,
          rincian: `Pemilih ditetapkan TMS dengan alasan: ${alasanTms}.`,
        }).catch(() => {});
      } catch {
        // non-blocking
      }

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
