import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { notifyNewAduan } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting Protection (Anti-Spam Form Protection)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`aduan-submit:${clientIp}`, 6, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak pengiriman aduan dari perangkat Anda. Silakan tunggu ${rateLimit.resetSeconds} detik sebelum mengirim kembali.`,
        },
        { status: 429 }
      );
    }

    await dataStore.ensureSynced();
    const body = await req.json();
    const { nama, nik, kontak, rt, rw, jenis, pesan, turnstileToken } = body;

    // Verify Cloudflare Turnstile Token (anti-spam form protection)
    const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp, "aduan_warga");
    if (!turnstileCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message: turnstileCheck.message || "Verifikasi keamanan sistem (Turnstile) wajib diselesaikan.",
        },
        { status: 403 }
      );
    }

    if (!nama || !nik || !kontak || !pesan) {
      return NextResponse.json(
        { success: false, message: "Seluruh kolom formulir wajib diisi." },
        { status: 400 }
      );
    }

    if (nik.length !== 16) {
      return NextResponse.json(
        { success: false, message: "NIK harus berjumlah 16 digit angka." },
        { status: 400 }
      );
    }

    const savedAduan = await dataStore.addAduan({
      nama,
      nik,
      kontak,
      rt: rt || "01",
      rw: rw || "01",
      jenis: jenis || "BELUM_TERDAFTAR",
      pesan,
    });

    // Kirim notifikasi Telegram ke grup panitia P2KD (berjalan di background tanpa membebani respon user)
    void notifyNewAduan({
      nomorAduan: savedAduan.nomorAduan,
      namaPelapor: savedAduan.namaPelapor,
      nikMasked: savedAduan.nikMasked,
      kontakPelapor: savedAduan.kontakPelapor,
      rt: savedAduan.rt,
      rw: savedAduan.rw,
      jenisAduan: savedAduan.jenisAduan,
      pesan: savedAduan.isiAduan || pesan,
      tanggal: savedAduan.tanggal,
    });

    return NextResponse.json({
      success: true,
      message: "Laporan aduan berhasil diterima oleh Sekretariat P2KD Kalisalak.",
      data: {
        ticketNo: savedAduan.nomorAduan,
        nama: savedAduan.namaPelapor,
        nikMasked: savedAduan.nikMasked,
        kontak: savedAduan.kontakPelapor,
        rt: savedAduan.rt,
        rw: savedAduan.rw,
        jenis: savedAduan.jenisAduan,
        tanggalPengajuan: savedAduan.tanggal,
        status: savedAduan.status,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan laporan aduan." },
      { status: 500 }
    );
  }
}
