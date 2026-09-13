import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

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

    const user = session.user;
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";

    // Strict Data Isolation from authenticated token: If officer, FORCE filter to assigned TPS only!
    if (isOfficer && user.assignedTps && user.assignedTps !== "SEMUA") {
      tps = user.assignedTps;
    }

    await dataStore.ensureSynced();
    const list = dataStore.getPemilihList({ tps, status, search });

    return NextResponse.json({
      success: true,
      total: list.length,
      isRestricted: isOfficer,
      assignedTps: isOfficer ? tps : undefined,
      data: list,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar pemilih." },
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
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";
    const assignedTps = user.assignedTps;

    // Strict TPS isolation on adding voters
    if (isOfficer && assignedTps && assignedTps !== "SEMUA" && tps && !tps.includes(assignedTps)) {
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda hanya berwenang menambahkan pemilih untuk wilayah ${assignedTps}. Dilarang menginput ke Tabung lain.`,
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
        tps: tps || (isOfficer && assignedTps && assignedTps !== "SEMUA" ? assignedTps : (dataStore.getTpsList()[0]?.namaTps || "")),
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
