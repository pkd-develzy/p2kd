import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`c6-verify:${clientIp}`, 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Terlalu banyak permintaan verifikasi C6. Silakan tunggu ${rateLimit.resetSeconds} detik.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const nik = searchParams.get("nik");

    // Public QR verification scans must include ID.
    // If only raw NIK is provided without ID, require an authenticated admin session to prevent DOB harvesting.
    const session = verifyAdminSession(req);
    if (!id && nik && !session.authenticated) {
      return NextResponse.json(
        { success: false, message: "Verifikasi publik C6 memerlukan ID Dokumen QR Code resmi." },
        { status: 403 }
      );
    }

    if (!id && !nik) {
      return NextResponse.json(
        { success: false, message: "Parameter ID atau NIK wajib disertakan." },
        { status: 400 }
      );
    }

    const voter = await SupabaseDbService.findPemilihForC6Verification(id || "", nik || "");

    if (!voter) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: "Data pemilih tidak ditemukan dalam database resmi Pilkades Kalisalak.",
      });
    }

    const isLaki = String(voter.jenisKelamin).toUpperCase().startsWith("L");
    const rtNum = (voter.rt || "01").replace(/\D/g, "").padStart(2, "0");
    const rwNum = (voter.rw || "01").replace(/\D/g, "").padStart(2, "0");
    const isSahDpt = voter.tahap === "DPT" && voter.statusAktif === "AKTIF";

    // Protect birth date privacy for public scan: display day & month, mask year (e.g. "15-08-****")
    const maskedDob = session.authenticated
      ? voter.tanggalLahir
      : voter.tanggalLahir ? voter.tanggalLahir.replace(/\d{4}$/, "****").replace(/^\d{4}/, "****") : "-";

    return NextResponse.json({
      success: true,
      valid: isSahDpt,
      data: {
        id: voter.id,
        namaLengkap: voter.namaLengkap,
        nikMasked: voter.nik ? `${voter.nik.slice(0, 1)}*************${voter.nik.slice(-2)}` : "****************",
        kkMasked: voter.kk ? `${voter.kk.slice(0, 1)}*************${voter.kk.slice(-2)}` : "-",
        jenisKelamin: isLaki ? "Laki-laki" : "Perempuan",
        tempatLahir: voter.tempatLahir,
        tanggalLahir: maskedDob,
        statusPerkawinan: voter.statusPerkawinan === "S" ? "Kawin" : voter.statusPerkawinan === "B" ? "Belum Kawin" : "Pernah Kawin",
        alamat: `${voter.alamat} (RT ${rtNum} / RW ${rwNum})`,
        rt: rtNum,
        rw: rwNum,
        mejaPendaftaran: `RW ${rwNum}`,
        tahap: voter.tahap || "DPS",
        statusAktif: voter.statusAktif,
        waktuPemilihan: "Rabu, 02 September 2026 • 07.00 - 13.00 WIB",
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in c6-verify API:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memverifikasi data C6." },
      { status: 500 }
    );
  }
}
