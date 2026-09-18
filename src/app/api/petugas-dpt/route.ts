import { NextResponse } from "next/server";
import { dataStore, PetugasStatus } from "@/lib/data-store";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

// POST /api/petugas-dpt - Pendaftaran Petugas Pendataan DPT Baru oleh Warga
export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`petugas-register:${clientIp}`, 5, 300); // 5 submissions per 5 minutes
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak permintaan pendaftaran dari perangkat Anda. Silakan tunggu ${rateLimit.resetSeconds} detik sebelum mencoba kembali.`,
        },
        { status: 429 }
      );
    }

    await dataStore.ensureSynced();
    const body = await req.json();

    const {
      nik,
      namaLengkap,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      noKk,
      alamat,
      rt,
      rw,
      dusun,
      nomorWa,
      isCalonKades,
      keteranganCalonKades,
      isTimSukses,
      keteranganTimSukses,
      isKepentinganCalon,
      keteranganKepentingan,
      persetujuanPernyataan,
      tandaTanganUrl,
    } = body;

    // 1. Validasi Kolom Wajib
    if (
      !nik ||
      !namaLengkap ||
      !tempatLahir ||
      !tanggalLahir ||
      !jenisKelamin ||
      !noKk ||
      !alamat ||
      !rt ||
      !rw ||
      !nomorWa
    ) {
      return NextResponse.json(
        { success: false, message: "Seluruh kolom identitas dan domisili wajib diisi lengkap." },
        { status: 400 }
      );
    }

    // 2. Validasi NIK & No KK
    const cleanNik = String(nik).replace(/\D/g, "");
    if (cleanNik.length !== 16) {
      return NextResponse.json(
        { success: false, message: "NIK harus berjumlah tepat 16 digit angka." },
        { status: 400 }
      );
    }

    const cleanKk = String(noKk).replace(/\D/g, "");
    if (cleanKk.length !== 16) {
      return NextResponse.json(
        { success: false, message: "Nomor Kartu Keluarga (KK) harus berjumlah tepat 16 digit angka." },
        { status: 400 }
      );
    }

    // 3. Pencegahan Pendaftaran NIK Ganda (Anti-Double Registration)
    await dataStore.ensureSynced(true);
    if (dataStore.checkNikPetugasDptExists(cleanNik)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "NIK Anda telah terdaftar sebelumnya dalam sistem pendaftaran Petugas Pendataan DPT. Silakan gunakan menu 'Cek Status Pendaftaran' untuk melihat perkembangan berkas Anda.",
        },
        { status: 409 }
      );
    }

    // 4. Validasi Tanda Tangan & Pernyataan
    if (!persetujuanPernyataan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda wajib menyetujui seluruh ketentuan Surat Pernyataan Netralitas dan Integritas untuk melanjutkan pendaftaran.",
        },
        { status: 400 }
      );
    }

    if (!tandaTanganUrl || typeof tandaTanganUrl !== "string" || !tandaTanganUrl.startsWith("data:image/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Tanda tangan digital pada layar belum dibubuhkan. Harap tanda tangani kolom yang disediakan.",
        },
        { status: 400 }
      );
    }

    // 5. Penentuan Status Berdasarkan Jawaban Netralitas
    const hasConflict = Boolean(isCalonKades) || Boolean(isTimSukses) || Boolean(isKepentinganCalon);
    const initialStatus: PetugasStatus = hasConflict ? "PERLU_KLARIFIKASI" : "MENUNGGU_VERIFIKASI";

    // 6. Simpan Data Pendaftaran
    const now = new Date();
    const isoTanggal = now.toISOString();

    const newPetugas = await dataStore.addPetugasDpt(
      {
        nik: cleanNik,
        namaLengkap: String(namaLengkap).trim(),
        tempatLahir: String(tempatLahir).trim(),
        tanggalLahir: String(tanggalLahir).trim(),
        jenisKelamin: jenisKelamin === "P" ? "P" : "L",
        noKk: cleanKk,
        alamat: String(alamat).trim(),
        rt: String(rt).padStart(2, "0"),
        rw: String(rw).padStart(2, "0"),
        dusun: dusun ? String(dusun).trim() : "Desa Kalisalak",
        nomorWa: String(nomorWa).trim(),
        isCalonKades: Boolean(isCalonKades),
        keteranganCalonKades: keteranganCalonKades ? String(keteranganCalonKades).trim() : undefined,
        isTimSukses: Boolean(isTimSukses),
        keteranganTimSukses: keteranganTimSukses ? String(keteranganTimSukses).trim() : undefined,
        isKepentinganCalon: Boolean(isKepentinganCalon),
        keteranganKepentingan: keteranganKepentingan ? String(keteranganKepentingan).trim() : undefined,
        persetujuanPernyataan: true,
        tandaTanganUrl,
        status: initialStatus,
        assignedWilayah: `RW ${String(rw).padStart(2, "0")}`,
        tanggalPendaftaran: isoTanggal,
      },
      `${namaLengkap} (Mandiri)`
    );

    return NextResponse.json({
      success: true,
      message: hasConflict
        ? "Pendaftaran berhasil disimpan. Karena terdapat indikasi afiliasi/kepentingan dengan calon, status Anda 'Perlu Klarifikasi' dan akan ditelaah khusus oleh Panitia P2KD."
        : "Pendaftaran Petugas Pendataan DPT berhasil dikirim! Silakan simpan nomor registrasi dan unduh dokumen bukti pendaftaran Anda.",
      data: {
        id: newPetugas.id,
        nomorRegistrasi: newPetugas.nomorRegistrasi,
        namaLengkap: newPetugas.namaLengkap,
        nikMasked: newPetugas.nikMasked,
        noKkMasked: newPetugas.noKkMasked,
        status: newPetugas.status,
        tanggalPendaftaran: newPetugas.tanggalPendaftaran,
        nomorWa: newPetugas.nomorWa,
        rw: newPetugas.rw,
        rt: newPetugas.rt,
        dusun: newPetugas.dusun,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/petugas-dpt:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server saat memproses pendaftaran." },
      { status: 500 }
    );
  }
}

// GET /api/petugas-dpt - Cek Status Pendaftaran oleh Pendaftar (Privasi Aman: Butuh No. Reg + No. WA)
export async function GET(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`petugas-status:${clientIp}`, 15, 60); // 15 checks per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak permintaan cek status. Silakan tunggu ${rateLimit.resetSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    await dataStore.ensureSynced();
    const { searchParams } = new URL(req.url);
    const noRegistrasi = searchParams.get("noRegistrasi");
    const noWa = searchParams.get("noWa");

    if (!noRegistrasi || !noWa) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor Registrasi dan Nomor WhatsApp wajib diisi untuk memeriksa status pendaftaran.",
        },
        { status: 400 }
      );
    }

    const matched = dataStore.getPetugasDptByRegAndWa(noRegistrasi, noWa);

    if (!matched) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data pendaftaran tidak ditemukan. Pastikan kombinasi Nomor Registrasi (contoh: PTG-KLS-2026-00001) dan Nomor WhatsApp sesuai dengan data saat pendaftaran.",
        },
        { status: 404 }
      );
    }

    // Return data dengan privasi terjaga (NIK & KK di-masking untuk keamanan publik)
    return NextResponse.json({
      success: true,
      data: {
        id: matched.id,
        nomorRegistrasi: matched.nomorRegistrasi,
        namaLengkap: matched.namaLengkap,
        nik: matched.nik,
        nikMasked: matched.nikMasked,
        noKk: matched.noKk,
        noKkMasked: matched.noKkMasked,
        tempatLahir: matched.tempatLahir,
        tanggalLahir: matched.tanggalLahir,
        jenisKelamin: matched.jenisKelamin,
        alamat: matched.alamat,
        rt: matched.rt,
        rw: matched.rw,
        dusun: matched.dusun,
        nomorWa: matched.nomorWa,
        status: matched.status,
        catatanPanitia: matched.catatanPanitia,
        assignedWilayah: matched.assignedWilayah,
        tanggalPendaftaran: matched.tanggalPendaftaran,
        updatedAt: matched.updatedAt,
        tandaTanganUrl: matched.tandaTanganUrl,
        isCalonKades: matched.isCalonKades,
        keteranganCalonKades: matched.keteranganCalonKades,
        isTimSukses: matched.isTimSukses,
        keteranganTimSukses: matched.keteranganTimSukses,
        isKepentinganCalon: matched.isKepentinganCalon,
        keteranganKepentingan: matched.keteranganKepentingan,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/petugas-dpt:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat status pendaftaran." },
      { status: 500 }
    );
  }
}

// PUT /api/petugas-dpt - Edit / Koreksi Data Pendaftaran oleh Warga Pendaftar
export async function PUT(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`petugas-edit:${clientIp}`, 10, 300); // 10 updates per 5 minutes
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak permintaan pembaruan data. Silakan tunggu ${rateLimit.resetSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    await dataStore.ensureSynced();
    const body = await req.json();
    const { nomorRegistrasi, noWaAuth, id, ...updatePayload } = body;

    if (!nomorRegistrasi && !id) {
      return NextResponse.json(
        { success: false, message: "Nomor Registrasi atau ID pendaftaran wajib disertakan." },
        { status: 400 }
      );
    }

    // Authenticate applicant ownership
    const matched = nomorRegistrasi && noWaAuth
      ? dataStore.getPetugasDptByRegAndWa(nomorRegistrasi, noWaAuth)
      : (id ? dataStore.getPetugasDptList().find((p) => p.id === id && (!noWaAuth || p.nomorWa.replace(/\D/g, "") === noWaAuth.replace(/\D/g, ""))) : null);

    if (!matched) {
      return NextResponse.json(
        {
          success: false,
          message: "Otorisasi gagal: Kombinasi Nomor Registrasi dan Nomor WhatsApp tidak cocok.",
        },
        { status: 403 }
      );
    }

    // Protection: Disallow editing if already DITETAPKAN
    if (matched.status === "DITETAPKAN") {
      return NextResponse.json(
        {
          success: false,
          message: "Data Anda telah Ditetapkan secara resmi oleh Panitia P2KD dan tidak dapat diubah lagi secara mandiri. Silakan hubungi Sekretariat P2KD jika terdapat perubahan.",
        },
        { status: 403 }
      );
    }

    // Prepare clean fields
    const safeUpdates: Record<string, unknown> = {};
    if (updatePayload.namaLengkap) safeUpdates.namaLengkap = String(updatePayload.namaLengkap).trim();
    if (updatePayload.nik) {
      const cleanNik = String(updatePayload.nik).replace(/\D/g, "");
      if (cleanNik.length === 16) safeUpdates.nik = cleanNik;
    }
    if (updatePayload.tempatLahir) safeUpdates.tempatLahir = String(updatePayload.tempatLahir).trim();
    if (updatePayload.tanggalLahir) safeUpdates.tanggalLahir = String(updatePayload.tanggalLahir).trim();
    if (updatePayload.jenisKelamin) safeUpdates.jenisKelamin = updatePayload.jenisKelamin;
    if (updatePayload.noKk) {
      const cleanKk = String(updatePayload.noKk).replace(/\D/g, "");
      if (cleanKk.length === 16) safeUpdates.noKk = cleanKk;
    }
    if (updatePayload.alamat) safeUpdates.alamat = String(updatePayload.alamat).trim();
    if (updatePayload.rt) safeUpdates.rt = String(updatePayload.rt);
    if (updatePayload.rw) {
      safeUpdates.rw = String(updatePayload.rw);
      if (!matched.assignedWilayah || matched.assignedWilayah.startsWith("RW ")) {
        safeUpdates.assignedWilayah = `RW ${updatePayload.rw}`;
      }
    }
    if (updatePayload.dusun) safeUpdates.dusun = String(updatePayload.dusun).trim();
    if (updatePayload.nomorWa) safeUpdates.nomorWa = String(updatePayload.nomorWa).replace(/\D/g, "");
    if (updatePayload.isCalonKades !== undefined) safeUpdates.isCalonKades = Boolean(updatePayload.isCalonKades);
    if (updatePayload.keteranganCalonKades !== undefined) safeUpdates.keteranganCalonKades = String(updatePayload.keteranganCalonKades);
    if (updatePayload.isTimSukses !== undefined) safeUpdates.isTimSukses = Boolean(updatePayload.isTimSukses);
    if (updatePayload.keteranganTimSukses !== undefined) safeUpdates.keteranganTimSukses = String(updatePayload.keteranganTimSukses);
    if (updatePayload.isKepentinganCalon !== undefined) safeUpdates.isKepentinganCalon = Boolean(updatePayload.isKepentinganCalon);
    if (updatePayload.keteranganKepentingan !== undefined) safeUpdates.keteranganKepentingan = String(updatePayload.keteranganKepentingan);
    if (updatePayload.tandaTanganUrl) safeUpdates.tandaTanganUrl = String(updatePayload.tandaTanganUrl);

    // If applicant was asked for clarification, reset to MENUNGGU_VERIFIKASI
    if (matched.status === "PERLU_KLARIFIKASI") {
      safeUpdates.status = "MENUNGGU_VERIFIKASI";
    }

    const updated = await dataStore.updatePetugasDpt(
      matched.id,
      safeUpdates,
      `Pendaftar (${matched.namaLengkap})`
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan perubahan data pendaftaran." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data pendaftaran Anda berhasil diperbarui.",
      data: updated,
    });
  } catch (error) {
    console.error("Error in PUT /api/petugas-dpt:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memperbarui data." },
      { status: 500 }
    );
  }
}
