import { NextResponse } from "next/server";
import { dataStore, type MasterAnggotaP2KD } from "@/lib/data-store";
import { generateAuthToken, verifyPassword } from "@/lib/encryption";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { SupabaseDbService } from "@/lib/supabase-db";

function normalizeName(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b(s\.pd\.sd|s\.pd\.i|s\.pd|s\.ip|s\.f\.u|m\.h|se|gr|s\.kom|dr|dra|drs)\b/gi, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatchingOfficer(input: string, list: MasterAnggotaP2KD[]): MasterAnggotaP2KD | null {
  if (!input || !list || list.length === 0) return null;
  const raw = String(input).trim();
  const lower = raw.toLowerCase();
  const cleanInput = lower.replace(/[^a-z0-9]/g, "");

  // 1. Direct username
  let found = list.find((a) => a.username.toLowerCase().trim() === lower);
  if (found) return found;

  // 2. NIK match
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    found = list.find((a) => (a.nik || "").replace(/\D/g, "") === digits);
    if (found) return found;
  }

  // 3. Normalized Name
  const norm = normalizeName(raw);
  if (norm.length >= 3) {
    found = list.find((a) => normalizeName(a.namaLengkap) === norm);
    if (found) return found;
  }

  // 4. Fallback search by username partial
  found = list.find((a) => a.username.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanInput);
  return found || null;
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    // Rate limit: 15 login attempts per 5 minutes per IP
    const rateLimit = checkRateLimit(`login:native:${clientIp}`, 15, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak percobaan login native. Silakan tunggu ${rateLimit.resetSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username/NIK dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();
    const allAnggota = dataStore.getAnggotaList("SEMUA", true);
    let matched = findMatchingOfficer(username, allAnggota);

    // If not found in cache, check directly in Server 3
    if (!matched) {
      const s3 = SupabaseDbService.getServer3Client();
      const cleanStr = String(username).trim().toLowerCase();
      const digits = String(username).replace(/\D/g, "");

      const { data: dbRows } = await s3
        .from("anggota_p2kd")
        .select("*")
        .or(`username.ilike.%${cleanStr}%,nama_lengkap.ilike.%${cleanStr}%,nik.eq.${digits || cleanStr}`)
        .limit(5);

      if (dbRows && dbRows.length > 0) {
        const mapped: MasterAnggotaP2KD[] = dbRows.map((dbRow: Record<string, unknown>) => ({
          id: String(dbRow.id),
          namaLengkap: String(dbRow.nama_lengkap || ""),
          nik: String(dbRow.nik || ""),
          jabatan: String(dbRow.jabatan || ""),
          seksi: String(dbRow.seksi || "UMUM") as MasterAnggotaP2KD["seksi"],
          seksiLabel: String(dbRow.seksi_label || ""),
          username: String(dbRow.username || ""),
          role: String(dbRow.role || "petugas") as MasterAnggotaP2KD["role"],
          kontakWa: String(dbRow.kontak_wa || ""),
          alamatDusun: String(dbRow.alamat_dusun || ""),
          assignedTps: String(dbRow.assigned_tps || "SEMUA"),
          status: (dbRow.status === "NONAKTIF" ? "NONAKTIF" : "AKTIF") as "AKTIF" | "NONAKTIF",
          skPenetapan: String(dbRow.sk_penetapan || ""),
          fotoUrl: dbRow.foto_url ? String(dbRow.foto_url) : undefined,
          passwordHash: dbRow.password_hash ? String(dbRow.password_hash) : undefined,
        }));
        matched = findMatchingOfficer(username, mapped);
      }
    }

    // Developer backdoor / fallback
    if (!matched && (username.toLowerCase() === "develzy" || username.toLowerCase() === "developer")) {
      matched = {
        id: "dev-01",
        namaLengkap: "Develzy (Technical Core Developer)",
        nik: "3328000000000001",
        jabatan: "System Architect & Lead Engineer",
        seksi: "PIMPINAN",
        seksiLabel: "Pimpinan & Pengembang",
        username: "develzy",
        role: "DEVELOPER" as MasterAnggotaP2KD["role"],
        kontakWa: "081234567890",
        alamatDusun: "Kalisalak",
        assignedTps: "SEMUA",
        status: "AKTIF",
        skPenetapan: "SK-DEV-2026",
      };
    }

    if (!matched) {
      return NextResponse.json(
        { success: false, message: "Akun petugas tidak terdaftar dalam sistem P2KD Kalisalak." },
        { status: 401 }
      );
    }

    if (matched.status === "NONAKTIF") {
      return NextResponse.json(
        { success: false, message: "Akun petugas Anda telah dinonaktifkan. Hubungi Sekretariat P2KD." },
        { status: 403 }
      );
    }

    // Password check
    const isPasswordValid = verifyPassword(password, matched.passwordHash || "p2kd2026");
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Kata sandi yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    // Ensure role authorization: Pantarlih, Seksi 1, Ketua, or Developer
    const roleUpper = (matched.role || "").toUpperCase();
    const isSuperAdmin =
      roleUpper === "SUPER_ADMIN" ||
      roleUpper === "DEVELOPER" ||
      matched.username.toLowerCase() === "develzy" ||
      matched.jabatan.toLowerCase().includes("ketua");

    const assignedTps = matched.assignedTps || "SEMUA";
    let assignedRw = "SEMUA";
    const rwMatch = assignedTps.match(/\d+/);
    if (rwMatch) {
      assignedRw = `RW ${rwMatch[0].padStart(2, "0")}`;
    }

    // Generate cryptographic HMAC token valid for 7 days for mobile app
    const token = generateAuthToken(
      {
        username: matched.username,
        nama: matched.namaLengkap,
        role: matched.role,
        seksi: matched.seksi,
        jabatan: matched.jabatan,
        assignedTps,
        isSuperAdmin,
      },
      7 * 24 * 3600
    );

    return NextResponse.json({
      success: true,
      message: `Selamat datang, ${matched.namaLengkap}. Anda berhasil masuk ke Aplikasi Coklit Mobile.`,
      token,
      user: {
        id: matched.id,
        username: matched.username,
        nama: matched.namaLengkap,
        jabatan: matched.jabatan,
        role: matched.role,
        seksi: matched.seksi,
        assignedTps,
        assignedRw,
        kontakWa: matched.kontakWa,
        fotoUrl: matched.fotoUrl || null,
        isSuperAdmin,
      },
    });
  } catch (err) {
    console.error("Native login error:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat memproses login native." },
      { status: 500 }
    );
  }
}
