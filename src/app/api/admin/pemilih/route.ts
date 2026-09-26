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
      tps,
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

    // Strict TPS isolation on adding voters for Pantarlih
    if (isFieldOfficer && assignedTps && assignedTps !== "SEMUA" && tps && !tps.includes(assignedTps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda hanya berwenang menambahkan pemilih untuk wilayah ${assignedTps}. Dilarang menginput ke wilayah lain.`,
        },
        { status: 403 }
      );
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

    const newPemilih = await dataStore.addPemilih(
      {
        nik,
        kk: kk || `${nik.slice(0, 6)}0000000000`,
        namaLengkap: namaLengkap.toUpperCase(),
        tempatLahir: tempatLahir || "Tegal",
        tanggalLahir,
        jenisKelamin,
        statusPerkawinan: statusPerkawinan || "S",
        alamat: alamat || `RT ${rt || "01"} / RW ${rw || "01"}, Desa Kalisalak`,
        rt: rt || "01",
        rw: rw || "01",
        desa: desa || "Kalisalak",
        kecamatan: kecamatan || "Margasari",
        tps: tps || (isFieldOfficer && assignedTps && assignedTps !== "SEMUA" ? assignedTps : (dataStore.getTpsList()[0]?.namaTps || "")),
        statusAktif: statusAktif || "AKTIF",
      },
      user.nama || user.username
    );

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
