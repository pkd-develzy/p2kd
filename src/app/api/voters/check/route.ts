import { NextResponse } from "next/server";
import { hashSearchIndex } from "@/lib/encryption";
import { dataStore } from "@/lib/data-store";
import { SupabaseDbService } from "@/lib/supabase-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const cleaned = dateStr.trim().replace(/[\/.]/g, "-");
  const parts = cleaned.split("-").map((p) => p.trim());
  
  if (parts.length === 3) {
    let year = "";
    let month = "";
    let day = "";

    // Case 1: YYYY-MM-DD or YYYY-M-D
    if (parts[0].length === 4) {
      year = parts[0];
      month = parts[1].padStart(2, "0");
      day = parts[2].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Case 2: DD-MM-YYYY or D-M-YYYY
    if (parts[2].length === 4) {
      year = parts[2];
      month = parts[1].padStart(2, "0");
      day = parts[0].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Case 3: DD-MM-YY (2-digit year)
    if (parts[2].length === 2) {
      const yNum = parseInt(parts[2], 10);
      year = yNum > 30 ? `19${parts[2]}` : `20${parts[2]}`;
      month = parts[1].padStart(2, "0");
      day = parts[0].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  return cleaned;
}

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting Protection (Anti-Brute Force & Anti-Scraping)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`voter-check:${clientIp}`, 12, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak permintaan verifikasi NIK. Demi keamanan dan perlindungan privasi warga, silakan coba lagi dalam ${rateLimit.resetSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { nik, dob, turnstileToken } = body;

    // Verify Cloudflare Turnstile Token (anti-scraping bot protection)
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (turnstileSecret && turnstileToken) {
      if (typeof turnstileToken === "string" && turnstileToken.length > 0) {
        try {
          const clientIp =
            req.headers.get("cf-connecting-ip") ||
            req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
            "";

          const cfRes = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              signal: AbortSignal.timeout(10000),
              body: new URLSearchParams({
                secret: turnstileSecret,
                response: turnstileToken,
                remoteip: clientIp,
              }),
            }
          );

          const cfData = await cfRes.json();
          if (!cfData.success) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Verifikasi keamanan sistem gagal atau kadaluarsa. Silakan ulangi centang keamanan.",
              },
              { status: 403 }
            );
          }
        } catch (err) {
          console.error("Turnstile error in /voters/check:", err);
        }
      }
    }

    if (!nik || typeof nik !== "string" || nik.trim().length !== 16) {
      return NextResponse.json(
        { success: false, message: "NIK harus terdiri dari 16 digit angka." },
        { status: 400 }
      );
    }

    if (!dob || typeof dob !== "string") {
      return NextResponse.json(
        { success: false, message: "Tanggal lahir wajib diisi untuk verifikasi hak pilih." },
        { status: 400 }
      );
    }

    const cleanNik = nik.trim();
    const hashedSearch = hashSearchIndex(cleanNik);

    // Search voter from central data store or direct indexed query (< 20ms)
    const inStoreVoter = dataStore.findPemilihByNik(cleanNik);
    const voter = inStoreVoter || (await SupabaseDbService.findPemilihDirect(cleanNik));

    if (!voter) {
      return NextResponse.json(
        {
          success: false,
          found: false,
          message: "Data pemilih tidak ditemukan pada DPS/DPT Pilkades Desa Kalisalak.",
        },
        { status: 200 }
      );
    }

    // STRICT DATE OF BIRTH (DOB) MATCH VERIFICATION
    const normalizedInputDob = normalizeDate(dob);
    const normalizedVoterDob = normalizeDate(voter.tanggalLahir);

    if (normalizedInputDob !== normalizedVoterDob) {
      return NextResponse.json(
        {
          success: false,
          found: false,
          message: "Kombinasi NIK dan Tanggal Lahir tidak cocok dengan data pendaftaran.",
        },
        { status: 200 }
      );
    }

    // If marked as TMS
    if (voter.statusAktif === "TMS") {
      return NextResponse.json({
        success: true,
        found: true,
        data: {
          nik: voter.nikMasked,
          nama: voter.namaLengkap,
          jenisKelamin: voter.jenisKelamin,
          tps: "-",
          lokasiTps: "-",
          rt: voter.rt,
          rw: voter.rw,
          dusun: "Desa Kalisalak",
          desa: "Kalisalak",
          kecamatan: "Margasari",
          kabupaten: "Tegal",
          status: "TMS (TIDAK MEMENUHI SYARAT)",
          alasanTms: voter.alasanTms || "Data tidak memenuhi syarat sebagai pemilih",
          searchHashPrefix: hashedSearch.slice(0, 8),
        },
      });
    }

    // Look up TPS Location info
    const tpsList = dataStore.getTpsList();
    const matchedTps = tpsList.find(
      (t) => t.nomorTps === voter.tps.replace(/[^0-9]/g, "") || voter.tps.includes(t.nomorTps)
    );

    return NextResponse.json({
      success: true,
      found: true,
      data: {
        nik: voter.nikMasked,
        nama: voter.namaLengkap,
        jenisKelamin: voter.jenisKelamin,
        tps: voter.tps,
        lokasiTps: matchedTps?.lokasi || "Lapangan Desa Kalisalak",
        rt: voter.rt,
        rw: voter.rw,
        dusun: "Desa Kalisalak",
        desa: "Kalisalak",
        kecamatan: "Margasari",
        kabupaten: "Tegal",
        status: dataStore.getTahapanState().isDptLocked ? "TERDAFTAR_DPT_FINAL" : "TERDAFTAR_DPSHP",
        searchHashPrefix: hashedSearch.slice(0, 8),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server saat verifikasi data." },
      { status: 500 }
    );
  }
}
