import { NextResponse } from "next/server";
import { dataStore, type MasterAnggotaP2KD, type PetugasStatus } from "@/lib/data-store";
import { generateAuthToken, verifyPassword } from "@/lib/encryption";
import { isInitialDefaultPassword } from "@/lib/password-policy";
import { verifyTurnstileToken } from "@/lib/turnstile";

function normalizeName(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b(s\.pd\.sd|s\.pd\.i|s\.pd|s\.ip|s\.f\.u|m\.h|se|gr|s\.kom|dr|dra|drs)\b/gi, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSpelling(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/sy/g, "s")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c")
    .replace(/oe/g, "u")
    .replace(/dj/g, "j")
    .replace(/tj/g, "c");
}

function normalizePhone(str: string): string {
  if (!str) return "";
  let d = str.replace(/\D/g, "");
  if (d.startsWith("62")) d = "0" + d.slice(2);
  return d;
}

function findMatchingAnggota(input: string, list: MasterAnggotaP2KD[]): MasterAnggotaP2KD | null {
  if (!input || !list || list.length === 0) return null;
  const raw = String(input).trim();
  const lower = raw.toLowerCase();
  const noDomain = lower.replace(/@.*$/, "").trim();
  const digits = raw.replace(/\D/g, "");
  const normPhone = normalizePhone(raw);
  const normInputName = normalizeName(raw);
  const inputAlphanum = lower.replace(/[^a-z0-9]/g, "");

  // 1. Direct username & variants
  let found = list.find((a) => {
    const u = a.username.toLowerCase().trim();
    const uAlpha = u.replace(/[^a-z0-9]/g, "");
    return (
      u === lower ||
      u === noDomain ||
      `${u}@kalisalak.desa.id` === lower ||
      (inputAlphanum.length >= 3 && uAlpha === inputAlphanum)
    );
  });
  if (found) return found;

  // 2. NIK (16 digits or digits match)
  if (digits.length >= 10) {
    found = list.find((a) => {
      const aNikDigits = (a.nik || "").replace(/\D/g, "");
      return aNikDigits && (aNikDigits === digits || (digits.length === 16 && aNikDigits === digits));
    });
    if (found) return found;
  }

  // 3. Phone / WhatsApp
  if (normPhone.length >= 9) {
    found = list.find((a) => {
      const p = normalizePhone(a.kontakWa || "");
      return p && (p === normPhone || p.endsWith(normPhone) || normPhone.endsWith(p));
    });
    if (found) return found;
  }

  // 4. Exact or Normalized Full Name
  if (normInputName.length >= 3) {
    found = list.find((a) => {
      const aNorm = normalizeName(a.namaLengkap);
      return aNorm === normInputName;
    });
    if (found) return found;

    // Substring / Word Match (e.g. 'Atiq Septi' matches 'ATIQ SEPTI STIOWATI')
    const inputWords = normInputName.split(" ").filter((w) => w.length > 2);
    if (inputWords.length > 0) {
      found = list.find((a) => {
        const aNorm = normalizeName(a.namaLengkap);
        return (
          inputWords.every((w) => aNorm.includes(w)) ||
          inputWords.every((w) => a.username.toLowerCase().includes(w))
        );
      });
      if (found) return found;
    }
  }

  // 5. Email Prefix matching username or name
  if (noDomain.length >= 3) {
    const cleanPrefix = noDomain.replace(/[^a-z]/g, "");
    const cleanPrefixNorm = normalizeSpelling(cleanPrefix);
    found = list.find((a) => {
      const u = a.username.toLowerCase();
      const uNorm = normalizeSpelling(u);
      const n = normalizeName(a.namaLengkap).replace(/[^a-z]/g, "");
      const nNorm = normalizeSpelling(n);
      return (
        u === noDomain ||
        uNorm === cleanPrefixNorm ||
        (cleanPrefixNorm.length >= 4 &&
          (uNorm.includes(cleanPrefixNorm) ||
            cleanPrefixNorm.includes(uNorm) ||
            nNorm.includes(cleanPrefixNorm) ||
            cleanPrefixNorm.includes(nNorm)))
      );
    });
    if (found) return found;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, turnstileToken } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp, "login");
    if (!turnstileCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message: turnstileCheck.message || "Verifikasi keamanan (Turnstile) wajib diselesaikan.",
        },
        { status: 403 }
      );
    }

    await dataStore.ensureSynced();
    
    // Include all database accounts including hidden ones for authentication
    let allAnggota = dataStore.getAnggotaList("SEMUA", true);
    let matched = findMatchingAnggota(username, allAnggota);

    // Safety Fallback 1: If account not found in current memory cache, force re-sync with Supabase
    if (!matched) {
      await dataStore.ensureSynced(true);
      allAnggota = dataStore.getAnggotaList("SEMUA", true);
      matched = findMatchingAnggota(username, allAnggota);
    }

    // Safety Fallback 2: Direct query to Supabase Server 3 cloud database
    if (!matched) {
      try {
        const { SupabaseDbService } = await import("@/lib/supabase-db");
        const s3 = SupabaseDbService.getServer3Client();
        const digits = String(username).replace(/\D/g, "");
        const cleanStr = String(username).trim().toLowerCase().replace(/@.*$/, "");

        const { data: dbRows } = await s3
          .from("anggota_p2kd")
          .select("*")
          .or(`username.ilike.%${cleanStr}%,nama_lengkap.ilike.%${cleanStr}%,nik.eq.${digits || cleanStr}`)
          .limit(10);

        if (dbRows && dbRows.length > 0) {
          const mappedRows: MasterAnggotaP2KD[] = (dbRows || []).map((dbRow: Record<string, unknown>) => ({
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

          const directMatched = findMatchingAnggota(username, mappedRows);
          if (directMatched) {
            matched = directMatched;
            await dataStore.ensureSynced(true);
          }
        }
      } catch (err) {
        console.warn("Direct Supabase login fallback error:", err);
      }
    }

    // Safety Fallback 3: Check pendaftaran_petugas_dpt in Seksi 1 for designated officers
    if (!matched) {
      try {
        const { SupabaseDbService } = await import("@/lib/supabase-db");
        const s1 = SupabaseDbService.getSeksi1Client();
        const cleanStr = String(username).trim().toLowerCase().replace(/@.*$/, "");
        const digits = String(username).replace(/\D/g, "");

        const { data: pendaftarList } = await s1
          .from("pendaftaran_petugas_dpt")
          .select("*")
          .or(`nama_lengkap.ilike.%${cleanStr}%,nik.eq.${digits || cleanStr},no_hp.ilike.%${cleanStr}%`)
          .limit(5);

        if (pendaftarList && pendaftarList.length > 0) {
          const designated = (pendaftarList as Array<Record<string, unknown>>).find(
            (p) => p.status === "DITETAPKAN" || p.status === "LOLOS_SELEKSI" || p.status === "AKTIF"
          ) || (pendaftarList[0] as Record<string, unknown>);

          if (designated && designated.status !== "TIDAK_LOLOS") {
            const rawPetugas = {
              id: String(designated.id || ""),
              nomorRegistrasi: String(designated.nomor_registrasi || `PTG-${designated.id}`),
              nik: String(designated.nik || ""),
              nikMasked: String(designated.nik || ""),
              namaLengkap: String(designated.nama_lengkap || ""),
              tempatLahir: String(designated.tempat_lahir || "Tegal"),
              tanggalLahir: String(designated.tanggal_lahir || "1990-01-01"),
              jenisKelamin: (designated.jenis_kelamin === "P" ? "P" : "L") as "L" | "P",
              noKk: String(designated.no_kk || designated.nik || ""),
              noKkMasked: String(designated.no_kk || designated.nik || ""),
              nomorWa: String(designated.no_hp || designated.nomor_wa || ""),
              alamat: String(designated.alamat || "Desa Kalisalak"),
              rt: String(designated.rt || "01"),
              rw: String(designated.rw || "01"),
              dusun: String(designated.dusun || "Dusun Kalisalak"),
              isCalonKades: false,
              isTimSukses: false,
              isKepentinganCalon: false,
              persetujuanPernyataan: true,
              tandaTanganUrl: String(designated.tanda_tangan_url || ""),
              status: (designated.status as PetugasStatus) || "DITETAPKAN",
              tanggalPendaftaran: String(designated.tanggal_pendaftaran || new Date().toISOString()),
              updatedAt: String(designated.updated_at || new Date().toISOString()),
              assignedWilayah: String(designated.assigned_wilayah || `RW ${designated.rw || "01"}`),
            };

            const synced = await dataStore.syncPetugasToAnggota(rawPetugas, "Auto-Sync Auth");
            if (synced && synced.anggota) {
              matched = synced.anggota;
            }
          }
        }
      } catch (err) {
        console.warn("Pendaftaran petugas sync fallback error:", err);
      }
    }

    if (!matched) {
      dataStore.addAuditLog({
        user: String(username).trim(),
        role: "UNKNOWN",
        aksi: "LOGIN_FAILED",
        entity: "AUTH",
        target: String(username).trim(),
        detail: `Percobaan login gagal: Akun "${username}" tidak terdaftar di database.`,
        ipAddress: clientIp,
        userAgent,
      });

      return NextResponse.json(
        { success: false, message: "Username, NIK, atau identitas akun tidak ditemukan." },
        { status: 401 }
      );
    }

    // Check account status
    if (matched.status === "NONAKTIF") {
      return NextResponse.json(
        { success: false, message: "Akun ini telah dinonaktifkan oleh Administrator." },
        { status: 403 }
      );
    }

    // STRICT PASSWORD VERIFICATION AGAINST DATABASE
    const storedPassword = matched.passwordHash;
    if (!storedPassword) {
      return NextResponse.json(
        { success: false, message: "Akun ini belum memiliki kata sandi aktif di database." },
        { status: 403 }
      );
    }

    const isPasswordValid = verifyPassword(password, storedPassword);

    if (!isPasswordValid) {
      dataStore.addAuditLog({
        user: matched.username,
        role: matched.role,
        aksi: "LOGIN_FAILED",
        entity: "AUTH",
        target: matched.namaLengkap,
        detail: `Percobaan login gagal untuk akun ${matched.username} (${matched.namaLengkap}): Kata sandi salah.`,
        ipAddress: clientIp,
        userAgent,
      });

      return NextResponse.json(
        { success: false, message: "Kata sandi yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    const isDeveloper =
      matched.username.toLowerCase() === "develzy" ||
      matched.username.toLowerCase() === "developer" ||
      matched.role === "DEVELOPER" ||
      (Boolean(matched.jabatan) && matched.jabatan.toLowerCase().includes("developer"));
    const isKetua =
      matched.username.toLowerCase() === "khasanudin" ||
      matched.username.toLowerCase() === "admin_kalisalak" ||
      (Boolean(matched.jabatan) && matched.jabatan.toLowerCase().includes("ketua") && !matched.jabatan.toLowerCase().includes("seksi"));

    const isSuperAdmin = isDeveloper || isKetua;

    const isSeksiPemilihLogin =
      matched.seksi === "SEKSI_PEMILIH" ||
      matched.role === "SEKSI_PEMILIH" ||
      matched.username.toLowerCase().includes("khulal") ||
      (matched.jabatan && matched.jabatan.toLowerCase().includes("pendaftaran pemilih")) ||
      (matched.jabatan && matched.jabatan.toLowerCase().includes("koordinator pantarlih"));

    const effectiveAssignedTps = isSuperAdmin || isSeksiPemilihLogin ? "SEMUA" : (matched.assignedTps || "SEMUA");

    // Generate dedicated session ID & track device session in database
    const sessionId = "sess_" + crypto.randomUUID().replace(/-/g, "");
    const deviceId = body.deviceId || "dev_" + crypto.randomUUID().slice(0, 8);
    
    const { detectClientAppVersion } = await import("@/lib/app-version");
    const { parseClientSource } = await import("@/lib/utils");
    const detectedClient = detectClientAppVersion(userAgent, body.appVersion);
    const clientSource = parseClientSource({ userAgent });

    const appVersion = body.appVersion || detectedClient.version;
    const deviceInfo =
      body.deviceInfo ||
      (detectedClient.isNativeApk
        ? `Aplikasi Android APK (${clientSource.platform})`
        : `${clientSource.browserName} (${clientSource.platform})`);

    const { SessionTracker } = await import("@/lib/session-tracker");
    await SessionTracker.recordLogin({
      userId: matched.id || matched.username,
      username: matched.username,
      sessionId,
      deviceId,
      deviceInfo,
      ipAddress: clientIp,
      appVersion,
    });

    const token = generateAuthToken(
      {
        username: matched.username,
        nama: `${matched.namaLengkap} (${matched.jabatan})`,
        role: matched.role,
        seksi: matched.seksi,
        jabatan: matched.jabatan,
        assignedTps: effectiveAssignedTps,
        isSuperAdmin,
        sessionId,
      },
      172800 // 48 hours session
    );

    // Audit log successful login
    dataStore.addAuditLog({
      user: matched.username,
      role: matched.role,
      aksi: "LOGIN_SUCCESS",
      entity: "AUTH",
      target: matched.namaLengkap,
      detail: `Petugas berhasil login ke sistem (${matched.jabatan}). Sesi: ${sessionId}.`,
      ipAddress: clientIp,
      userAgent,
    });

    const isDefault =
      isInitialDefaultPassword(password) ||
      isInitialDefaultPassword(storedPassword) ||
      verifyPassword("p2kd12345", storedPassword) ||
      verifyPassword("p2kd2026", storedPassword) ||
      verifyPassword("pantarlih123", storedPassword) ||
      verifyPassword("admin123", storedPassword);

    const response = NextResponse.json({
      success: true,
      message: "Autentikasi berhasil.",
      data: {
        username: matched.username,
        nama: `${matched.namaLengkap} (${matched.jabatan})`,
        role: matched.role,
        seksi: matched.seksi,
        jabatan: matched.jabatan,
        assignedTps: effectiveAssignedTps,
        isSuperAdmin,
        mustChangePassword: isDefault,
        token,
        sessionId,
      },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 172800, // 48 hours session
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server saat autentikasi." },
      { status: 500 }
    );
  }
}
