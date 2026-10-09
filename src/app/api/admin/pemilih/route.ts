import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";
import {
  verifyAdminSession,
  canAccessVoterData,
  isPantarlih,
  isDeveloper,
  isKetuaP2KD,
  isSeksiPemilih,
} from "@/lib/auth-middleware";
import { normalizeWilayahCode, getAutoTabungByRtRw } from "@/lib/kalisalak-wilayah";
import { formatNamaGelar } from "@/lib/nama-gelar";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    let tps = searchParams.get("tps") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Hak akses data pemilih dibatasi khusus untuk Developer, Ketua P2KD, Seksi 1, dan Petugas Pantarlih (per RW binaan).",
        },
        { status: 403 }
      );
    }

    const isFieldOfficer = isPantarlih(user) && !isKetuaP2KD(user) && !isDeveloper(user) && !isSeksiPemilih(user);

    // Strict Data Isolation: Pantarlih is strictly forced to their assigned TPS/RW only!
    if (isFieldOfficer) {
      if (!user.assignedTps || user.assignedTps === "SEMUA") {
        return NextResponse.json(
          {
            success: false,
            message: "Akses Ditolak: Petugas lapangan belum memiliki alokasi wilayah binaan TPS/RW.",
          },
          { status: 403 }
        );
      }
      tps = user.assignedTps;
    }

    // Clean and validate filters
    const cleanTps = tps && tps !== "SEMUA" && !tps.toUpperCase().includes("SEMUA") ? tps : undefined;
    const cleanStatus = status && status !== "SEMUA" && !status.toUpperCase().includes("SEMUA") ? status : undefined;

    const tahap = searchParams.get("tahap") || undefined;
    const cleanTahap = tahap && tahap !== "SEMUA" && !tahap.toUpperCase().includes("SEMUA") ? tahap : undefined;
    const offsetParam = searchParams.get("offset");

    // Batas aman: default 1000 untuk filter wilayah RW, atau sesuai limitParam (max 1000)
    const limit = limitParam
      ? Math.min(1000, Math.max(1, parseInt(limitParam, 10)))
      : (cleanTps ? 1000 : 100);

    // 1. Search Query: Server-side search di PostgreSQL/Supabase (< 30ms)
    if (search && search.trim().length > 0) {
      const searchResults = await SupabaseDbService.searchPemilih(search.trim(), {
        tps: cleanTps,
        limit,
      });

      return NextResponse.json({
        success: true,
        total: searchResults.length,
        limit,
        isRestricted: isFieldOfficer,
        assignedTps: isFieldOfficer ? tps : undefined,
        data: searchResults,
      });
    }

    // 2. Server-side Pagination: Range query PostgreSQL
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const offset = offsetParam !== null ? Math.max(0, parseInt(offsetParam, 10)) : (page - 1) * limit;

    const pagedResult = await SupabaseDbService.fetchPemilihPaged(offset, limit, {
      tps: cleanTps,
      statusAktif: cleanStatus,
      tahap: cleanTahap,
    });

    const totalCount = pagedResult.total;

    return NextResponse.json({
      success: true,
      total: totalCount,
      page,
      limit,
      offset,
      totalPages: Math.ceil(totalCount / limit) || 1,
      isRestricted: isFieldOfficer,
      assignedTps: isFieldOfficer ? tps : undefined,
      data: pagedResult.data,
    });
  } catch (err) {
    console.error("Error in GET /api/admin/pemilih:", err);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar pemilih dari database." },
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

    const body = await req.json();
    const {
      nik,
      kk,
      namaLengkap,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      statusPerkawinan,
      alamat,
      rt,
      rw,
      desa,
      kecamatan,
      statusAktif,
    } = body;

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Hanya Developer, Ketua P2KD, Seksi 1, dan Petugas Pantarlih (wilayah tugas) yang berwenang menambahkan data pemilih.",
        },
        { status: 403 }
      );
    }

    const isFieldOfficer = isPantarlih(user) && !isKetuaP2KD(user) && !isDeveloper(user) && !isSeksiPemilih(user);
    const assignedTps = user.assignedTps;

    const targetRw = normalizeWilayahCode(rw || "01");
    const targetRt = normalizeWilayahCode(rt || "01");

    // Strict RW isolation on adding voters for Pantarlih
    if (isFieldOfficer) {
      const officerRwDigits = (assignedTps || "").replace(/\D/g, "");
      if (!officerRwDigits) {
        return NextResponse.json(
          {
            success: false,
            message: "Akses Ditolak: Penugasan wilayah RW untuk akun petugas Anda belum ditentukan secara sah di database. Hubungi Panitia P2KD.",
          },
          { status: 403 }
        );
      }

      const assignedRwCode = officerRwDigits.padStart(2, "0");
      if (targetRw !== assignedRwCode) {
        return NextResponse.json(
          {
            success: false,
            message: `Akses Ditolak: Akun petugas Anda hanya berwenang menambahkan pemilih di wilayah RW ${assignedRwCode}. Dilarang menginput ke RW ${targetRw}.`,
          },
          { status: 403 }
        );
      }

      // Validasi RT: Kalisalak RT 01, 02, 03
      if (!["01", "02", "03"].includes(targetRt)) {
        return NextResponse.json(
          {
            success: false,
            message: "Pilihan RT tidak valid untuk wilayah Kalisalak (wajib RT 01, RT 02, atau RT 03).",
          },
          { status: 400 }
        );
      }
    } else {
      // Admin / Superadmin RW validation: 01 to 13
      const rwNum = parseInt(targetRw, 10);
      if (isNaN(rwNum) || rwNum < 1 || rwNum > 13) {
        return NextResponse.json(
          { success: false, message: "Pilihan RW tidak valid untuk Desa Kalisalak (RW 01 s/d RW 13)." },
          { status: 400 }
        );
      }
      if (!["01", "02", "03"].includes(targetRt)) {
        return NextResponse.json(
          { success: false, message: "Pilihan RT tidak valid untuk Desa Kalisalak (RT 01, RT 02, atau RT 03)." },
          { status: 400 }
        );
      }
    }

    if (!nik || nik.length !== 16) {
      return NextResponse.json(
        { success: false, message: "NIK harus berjumlah 16 digit angka." },
        { status: 400 }
      );
    }

    if (!namaLengkap || !tanggalLahir || !jenisKelamin) {
      return NextResponse.json(
        { success: false, message: "Nama lengkap, tanggal lahir, dan jenis kelamin wajib diisi." },
        { status: 400 }
      );
    }

    // Check duplicate NIK
    const existing = dataStore.findPemilihByNik(nik);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `NIK ${nik} sudah terdaftar atas nama ${existing.namaLengkap} di ${existing.tps}.`,
        },
        { status: 409 }
      );
    }

    const calculatedTps = getAutoTabungByRtRw(targetRw, targetRt, dataStore.getTpsList());

    const newPemilih = await dataStore.addPemilih(
      {
        nik,
        kk: kk || `${nik.slice(0, 6)}0000000000`,
        namaLengkap: formatNamaGelar(namaLengkap),
        tempatLahir: tempatLahir || "Tegal",
        tanggalLahir,
        jenisKelamin,
        statusPerkawinan: statusPerkawinan || "S",
        alamat: alamat || `RT ${targetRt} / RW ${targetRw}, Desa Kalisalak`,
        rt: targetRt,
        rw: targetRw,
        desa: desa || "Kalisalak",
        kecamatan: kecamatan || "Margasari",
        tps: calculatedTps,
        statusAktif: statusAktif || "AKTIF",
      },
      user.nama || user.username
    );

    // Kirim notifikasi otomatis aktivitas temuan baru ke grup Telegram (tanpa simpan database)
    try {
      const { notifyPetugasActivity } = await import("@/lib/telegram");
      const maskedNik = newPemilih.nik ? `${newPemilih.nik.slice(0, 6)}******${newPemilih.nik.slice(-4)}` : "-";
      void notifyPetugasActivity({
        namaPetugas: user.nama || user.username || "Petugas Pantarlih",
        rolePetugas: user.role === "pantarlih" ? `Pantarlih ${newPemilih.tps}` : (user.role || "Petugas Lapangan"),
        wilayahTps: newPemilih.tps,
        aktivitas: "Input Temuan Pemilih Baru Lapangan",
        perubahanStatus: "BARU ➜ CALON DPS",
        targetWarga: `${newPemilih.namaLengkap} (NIK: ${maskedNik})`,
        wilayah: `${newPemilih.tps} (RT ${newPemilih.rt} / RW ${newPemilih.rw})`,
        rincian: "Warga baru memenuhi syarat hak pilih berhasil ditambahkan ke Calon DPS.",
      }).catch(() => {});
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      success: true,
      message: "Data pemilih baru berhasil ditambahkan secara manual oleh petugas.",
      data: newPemilih,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan data pemilih baru." },
      { status: 500 }
    );
  }
}
