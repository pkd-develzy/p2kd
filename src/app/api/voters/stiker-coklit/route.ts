import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { MasterPemilih } from "@/lib/data-store";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`stiker-coklit:${clientIp}`, 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Terlalu banyak permintaan verifikasi stiker. Silakan tunggu ${rateLimit.resetSeconds} detik.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const kk = searchParams.get("kk");
    const nik = searchParams.get("nik");

    if (!id && !kk && !nik) {
      return NextResponse.json(
        { success: false, message: "Parameter identitas stiker tidak lengkap." },
        { status: 400 }
      );
    }

    const { allData } = await SupabaseDbService.fetchAllData();
    const pemilihList: MasterPemilih[] = allData.pemilihList || [];

    // Find reference voter
    let targetVoter: MasterPemilih | null = null;
    if (id) {
      targetVoter = pemilihList.find((v: MasterPemilih) => v.id === id) || null;
    }
    if (!targetVoter && nik) {
      targetVoter = pemilihList.find((v: MasterPemilih) => v.nik === nik) || null;
    }
    if (!targetVoter && kk) {
      targetVoter = pemilihList.find((v: MasterPemilih) => v.kk === kk) || null;
    }

    if (!targetVoter) {
      return NextResponse.json({
        success: false,
        message: "Data rumah / stiker Coklit tidak ditemukan di database resmi.",
      });
    }

    // Find all family members with same KK in same RT/RW (or fallback to this voter)
    let familyVoters: MasterPemilih[] = [];
    if (targetVoter.kk && targetVoter.kk.trim().length > 5) {
      familyVoters = pemilihList.filter(
        (v: MasterPemilih) => v.kk === targetVoter.kk && v.rw === targetVoter.rw && v.statusAktif !== "TMS"
      );
    }

    if (familyVoters.length === 0) {
      familyVoters = [targetVoter];
    }

    const rwNum = (targetVoter.rw || "01").replace(/\D/g, "").padStart(2, "0");
    const rtNum = (targetVoter.rt || "01").replace(/\D/g, "").padStart(2, "0");
    const kkMasked = targetVoter.kk ? `${targetVoter.kk.slice(0, 1)}*************${targetVoter.kk.slice(-2)}` : "****************";

    const members = familyVoters.map((m: MasterPemilih, idx: number) => {
      const isLaki = String(m.jenisKelamin).toUpperCase().startsWith("L");
      return {
        noUrut: idx + 1,
        id: m.id,
        namaLengkap: m.namaLengkap,
        nikMasked: m.nik ? `${m.nik.slice(0, 1)}*************${m.nik.slice(-2)}` : "****************",
        jenisKelamin: isLaki ? "Laki-laki (L)" : "Perempuan (P)",
        statusHakPilih: m.tahap === "DPT" ? "Terdaftar di DPT" : "Daftar Pemilih Sementara (DPS)",
        tahap: m.tahap || "DPS",
        statusCoklit: m.coklitStatus || "SESUAI",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: targetVoter.id,
        kepalaKeluarga: targetVoter.namaLengkap,
        kkMasked,
        alamat: `${targetVoter.alamat} (RT ${rtNum} / RW ${rwNum})`,
        rt: rtNum,
        rw: rwNum,
        desa: "Kalisalak",
        kecamatan: "Margasari",
        kabupaten: "Tegal",
        mejaPendaftaran: `RW ${rwNum}`,
        tanggalCoklit: targetVoter.coklitTanggal || "14 Agustus 2026",
        petugasPantarlih: targetVoter.coklitPetugas || `Petugas Pantarlih RW ${rwNum}`,
        totalPemilihRumah: members.length,
        members,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in stiker-coklit API:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server saat memverifikasi stiker." },
      { status: 500 }
    );
  }
}
