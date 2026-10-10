import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import {
  verifyAdminSession,
  canAccessVoterData,
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
          message: "Akses Ditolak: Anda tidak memiliki wewenang mengakses modul Data Pemilih.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tahapParam = searchParams.get("tahap") || "SEMUA";
    const statusParam = searchParams.get("status") || "SEMUA";
    const searchParam = searchParams.get("search") || "";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);

    const isFieldOfficer =
      isPantarlih(user) && !isKetuaP2KD(user) && !isDeveloper(user) && !isSeksiPemilih(user);

    let cleanTps: string | undefined = undefined;
    if (isFieldOfficer) {
      if (!user.assignedTps || user.assignedTps === "SEMUA") {
        return NextResponse.json(
          {
            success: false,
            message: "Akses Ditolak: Petugas lapangan belum memiliki wilayah binaan TPS/RW.",
          },
          { status: 403 }
        );
      }
      cleanTps = user.assignedTps;
    } else {
      const tpsQuery = searchParams.get("tps");
      if (tpsQuery && tpsQuery !== "SEMUA") {
        cleanTps = tpsQuery;
      }
    }

    const cleanStatus = statusParam !== "SEMUA" ? statusParam : undefined;
    const cleanTahap = tahapParam !== "SEMUA" ? tahapParam : undefined;

    const limit = Math.min(100, Math.max(1, limitParam));
    const offset = Math.max(0, (pageParam - 1) * limit);

    // 1. Search Query
    if (searchParam && searchParam.trim().length > 0) {
      const searchResults = await SupabaseDbService.searchPemilih(searchParam.trim(), {
        tps: cleanTps,
        limit,
      });

      return NextResponse.json({
        success: true,
        total: searchResults.length,
        page: 1,
        limit,
        totalPages: 1,
        tahap: tahapParam,
        assignedTps: cleanTps,
        data: searchResults,
      });
    }

    // 2. Filtered & Paged Query
    const pagedResult = await SupabaseDbService.fetchPemilihPaged(offset, limit, {
      tps: cleanTps,
      statusAktif: cleanStatus,
      tahap: cleanTahap,
    });

    return NextResponse.json({
      success: true,
      total: pagedResult.total,
      page: pageParam,
      limit,
      totalPages: Math.ceil(pagedResult.total / limit) || 1,
      tahap: tahapParam,
      assignedTps: cleanTps,
      data: pagedResult.data,
    });
  } catch (err) {
    console.error("Error in GET /api/app/pemilih:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data pemilih untuk aplikasi native." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang aksi Coklit." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, nik, action, alasanTms, updates } = body;

    const voterIdentifier = id || nik;
    if (!voterIdentifier) {
      return NextResponse.json(
        { success: false, message: "ID atau NIK pemilih wajib disertakan." },
        { status: 400 }
      );
    }

    const client = SupabaseDbService.getSeksi1Client();
    const nowIso = new Date().toISOString();
    const officerName = user.nama || user.username || "Petugas Pantarlih";

    // Cari pemilih di database
    let query = client.from("pemilih").select("*");
    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("nik", nik);
    }
    const { data: existingList, error: errFind } = await query.limit(1);

    if (errFind || !existingList || existingList.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data pemilih tidak ditemukan di database resmi." },
        { status: 404 }
      );
    }
    const voter = existingList[0];

    const patchPayload: Record<string, unknown> = {
      coklit_tanggal: nowIso,
      coklit_petugas: officerName,
      updated_at: nowIso,
    };

    if (action === "COCOK") {
      patchPayload.coklit_status = "SUDAH";
      patchPayload.verifikasi_status = "SESUAI";
      patchPayload.status_aktif = "AKTIF";
      patchPayload.alasan_tms = null;
    } else if (action === "TMS") {
      if (!alasanTms) {
        return NextResponse.json(
          { success: false, message: "Alasan TMS wajib dipilih dari 8 alasan resmi." },
          { status: 400 }
        );
      }
      patchPayload.status_aktif = "TMS";
      patchPayload.alasan_tms = alasanTms;
      patchPayload.coklit_status = "TMS";
      patchPayload.verifikasi_status = "TMS";
    } else if (action === "UBAH_DATA") {
      patchPayload.coklit_status = "UBAH_DATA";
      patchPayload.verifikasi_status = "UBAH_DATA";
      patchPayload.status_aktif = "AKTIF";

      if (updates) {
        if (updates.namaLengkap) patchPayload.nama_lengkap = updates.namaLengkap;
        if (updates.tempatLahir) patchPayload.tempat_lahir = updates.tempatLahir;
        if (updates.tanggalLahir) patchPayload.tanggal_lahir = updates.tanggalLahir;
        if (updates.jenisKelamin) patchPayload.jenis_kelamin = updates.jenisKelamin;
        if (updates.statusPerkawinan) patchPayload.status_perkawinan = updates.statusPerkawinan;
        if (updates.alamat) patchPayload.alamat = updates.alamat;
        if (updates.rt) patchPayload.rt = String(updates.rt).padStart(2, "0");
        if (updates.rw) patchPayload.rw = String(updates.rw).padStart(2, "0");
        if (updates.disabilitas) patchPayload.disabilitas = updates.disabilitas;
        if (updates.tps) patchPayload.tps = updates.tps;
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Aksi tidak dikenali. Gunakan COCOK, TMS, atau UBAH_DATA." },
        { status: 400 }
      );
    }

    const { error: errUpdate } = await client
      .from("pemilih")
      .update(patchPayload)
      .eq("id", voter.id);

    if (errUpdate) {
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan perubahan Coklit: " + errUpdate.message },
        { status: 500 }
      );
    }

    const appVersion = req.headers.get("x-app-version") || "1.7.3";
    try {
      const { notifyPetugasActivity } = await import("@/lib/telegram");
      void notifyPetugasActivity({
        namaPetugas: officerName,
        rolePetugas: `Pantarlih ${voter.tps || user.assignedTps || ""}`,
        aktivitas: `Aksi Coklit: ${action}`,
        targetWarga: voter.nama_lengkap,
        wilayah: `${voter.tps || ""}, RT ${voter.rt || ""}/RW ${voter.rw || ""}`,
        perubahanStatus: action === "TMS" ? `TMS (${alasanTms})` : action,
        rincian: action === "UBAH_DATA" ? "Perbaikan data warga" : undefined,
        appVersion,
      }).catch(() => {});
    } catch {}

    return NextResponse.json({
      success: true,
      action,
      voterId: voter.id,
      message: `Aksi ${action} untuk ${voter.nama_lengkap} berhasil disimpan.`,
      data: {
        id: voter.id,
        namaLengkap: (patchPayload.nama_lengkap as string) || voter.nama_lengkap,
        statusAktif: patchPayload.status_aktif,
        coklitStatus: patchPayload.coklit_status,
        alasanTms: patchPayload.alasan_tms,
        coklitTanggal: nowIso,
        coklitPetugas: officerName,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error in PATCH /api/app/pemilih:", msg);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat memperbarui data: " + msg },
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
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang menambah pemilih baru." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      nik,
      noKk,
      namaLengkap,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      statusPerkawinan,
      alamat,
      rt,
      rw,
      tps,
      disabilitas,
    } = body;

    if (!nik || String(nik).trim().length !== 16) {
      return NextResponse.json(
        { success: false, message: "NIK wajib 16 digit angka." },
        { status: 400 }
      );
    }
    if (!namaLengkap || String(namaLengkap).trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    const client = SupabaseDbService.getSeksi1Client();

    // Pastikan NIK belum terdaftar
    const { data: existingNik } = await client
      .from("pemilih")
      .select("id, nama_lengkap")
      .eq("nik", String(nik).trim())
      .maybeSingle();

    if (existingNik) {
      return NextResponse.json(
        {
          success: false,
          message: `NIK ${nik} sudah terdaftar atas nama ${existingNik.nama_lengkap}. Gunakan aksi Ubah Data jika ada pembaruan.`,
        },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();
    const officerName = user.nama || user.username || "Petugas Pantarlih";
    const newId = `pml-baru-${Date.now()}`;
    const cleanRt = String(rt || "01").padStart(2, "0");
    const cleanRw = String(rw || "01").padStart(2, "0");

    const newRow = {
      id: newId,
      nik: String(nik).trim(),
      no_kk: String(noKk || "").trim() || `${String(nik).slice(0, 6)}0000000000`,
      nama_lengkap: String(namaLengkap).trim().toUpperCase(),
      tempat_lahir: String(tempatLahir || "TEGAL").trim().toUpperCase(),
      tanggal_lahir: tanggalLahir || "2000-01-01",
      jenis_kelamin: String(jenisKelamin || "L").toUpperCase().startsWith("L") ? "L" : "P",
      status_perkawinan: statusPerkawinan || "Belum Kawin",
      alamat: alamat || `RT ${cleanRt} / RW ${cleanRw}, Desa Kalisalak`,
      rt: cleanRt,
      rw: cleanRw,
      desa: "Kalisalak",
      kecamatan: "Margasari",
      tps: tps || `TPS 0${cleanRw}`,
      disabilitas: disabilitas || "TIDAK",
      status_aktif: "AKTIF",
      coklit_status: "BARU",
      verifikasi_status: "SESUAI",
      tahap: "CALON_DPS",
      sumber_data: "POTENSIAL",
      coklit_tanggal: nowIso,
      coklit_petugas: officerName,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { error: errInsert } = await client.from("pemilih").insert(newRow);

    if (errInsert) {
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan pemilih baru ke database: " + errInsert.message },
        { status: 500 }
      );
    }

    const appVersion = req.headers.get("x-app-version") || "1.7.3";
    try {
      const { notifyPetugasActivity } = await import("@/lib/telegram");
      void notifyPetugasActivity({
        namaPetugas: officerName,
        rolePetugas: `Pantarlih ${newRow.tps || ""}`,
        aktivitas: "Tambah Pemilih Baru Lapangan",
        targetWarga: newRow.nama_lengkap,
        wilayah: `${newRow.tps || ""}, RT ${newRow.rt}/RW ${newRow.rw}`,
        perubahanStatus: "PEMILIH BARU (POTENSIAL) ➜ SESUAI",
        appVersion,
      }).catch(() => {});
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Pemilih baru ${newRow.nama_lengkap} berhasil ditambahkan ke daftar Coklit.`,
      data: newRow,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error in POST /api/app/pemilih:", msg);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat mendaftarkan pemilih baru: " + msg },
      { status: 500 }
    );
  }
}

