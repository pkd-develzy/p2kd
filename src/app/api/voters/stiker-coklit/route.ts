import { NextResponse } from "next/server";
import type { MasterPemilih } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { RumahCoklitService } from "@/lib/rumah-coklit-service";

export async function GET(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`stiker-coklit:${clientIp}`, 40, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Terlalu banyak permintaan verifikasi stiker. Silakan tunggu ${rateLimit.resetSeconds} detik.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const qr = searchParams.get("qr") || searchParams.get("token");
    const id = searchParams.get("id");
    const kk = searchParams.get("kk");
    const nik = searchParams.get("nik");

    // 1. Model Baru: QR Code Fisik Rumah (1 QR = 1 Rumah = Banyak KK = Banyak Anggota)
    if (qr || (id && id.toUpperCase().startsWith("KLK-HM"))) {
      const token = (qr || id || "").trim().toUpperCase();
      const publicData = await RumahCoklitService.getPublicStikerData(token);
      if (publicData.success) {
        return NextResponse.json(publicData);
      }
      // If not found as QR, continue to legacy fallback
    }

    if (!id && !kk && !nik && !qr) {
      return NextResponse.json(
        { success: false, message: "Parameter identitas stiker tidak lengkap." },
        { status: 400 }
      );
    }

    // 2. Legacy Fallback: Mencari pemilih berdasarkan ID / KK / NIK
    let targetVoter: MasterPemilih | null = null;
    if (nik) {
      targetVoter = await SupabaseDbService.findPemilihDirect(nik);
    }
    if (!targetVoter && (id || kk)) {
      const q = SupabaseDbService.getSeksi1Client().from("pemilih").select("*");
      if (id) {
        q.eq("id", id);
      } else if (kk) {
        q.eq("no_kk", kk);
      }
      const { data } = await q.limit(1).maybeSingle();
      if (data) {
        targetVoter = SupabaseDbService.mapSupabasePemilihRow(data);
      }
    }

    if (!targetVoter) {
      return NextResponse.json({
        success: false,
        message: "Data rumah / stiker Coklit tidak ditemukan di database resmi P2KD Kalisalak.",
      });
    }

    // Find all family members with same KK
    let familyVoters: MasterPemilih[] = [];
    if (targetVoter.kk && targetVoter.kk.trim().length > 5) {
      const { data } = await SupabaseDbService.getSeksi1Client()
        .from("pemilih")
        .select("*")
        .eq("no_kk", targetVoter.kk)
        .neq("status_aktif", "TMS")
        .order("nama_lengkap");

      if (data && Array.isArray(data)) {
        familyVoters = data.map((p) => SupabaseDbService.mapSupabasePemilihRow(p));
      }
    }

    if (familyVoters.length === 0) {
      familyVoters = [targetVoter];
    }

    const rwNum = (targetVoter.rw || "01").replace(/\D/g, "").padStart(2, "0");
    const rtNum = (targetVoter.rt || "01").replace(/\D/g, "").padStart(2, "0");

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
        statusVerifikasi: m.coklitStatus || "SESUAI",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: targetVoter.id,
        qrToken: id || "LEGACY-STIKER",
        statusQr: "COMPLETED",
        statusKunjungan: "SELESAI",
        kepalaKeluarga: targetVoter.namaLengkap,
        namaStikerManual: targetVoter.namaLengkap,
        alamat: `${targetVoter.alamat} (RT ${rtNum} / RW ${rwNum})`,
        rt: rtNum,
        rw: rwNum,
        desa: "Kalisalak",
        kecamatan: "Margasari",
        kabupaten: "Tegal",
        mejaPendaftaran: `RW ${rwNum}`,
        tanggalCoklit: targetVoter.coklitTanggal || "14 Agustus 2026",
        petugasPantarlih: targetVoter.coklitPetugas || `Petugas Pantarlih RW ${rwNum}`,
        totalKk: 1,
        totalPemilihRumah: members.length,
        kks: [
          {
            noKk: targetVoter.kk ? `${targetVoter.kk.slice(0, 3)}**********${targetVoter.kk.slice(-3)}` : "****************",
            kepalaKeluarga: targetVoter.namaLengkap,
          },
        ],
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
