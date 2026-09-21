import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { generateAuthToken, verifyPassword } from "@/lib/encryption";
import { isInitialDefaultPassword } from "@/lib/password-policy";
import { verifyTurnstileToken } from "@/lib/turnstile";

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

    // Canonical Server-Side Cloudflare Turnstile Siteverify
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "";

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

    const inputRaw = String(username).toLowerCase().trim();
    const cleanUsername = inputRaw.replace("@kalisalak.desa.id", "").trim();
    await dataStore.ensureSynced();
    // Include all database accounts including hidden ones for authentication
    const allAnggota = dataStore.getAnggotaList("SEMUA", true);
    const matched = allAnggota.find(
      (a) =>
        a.username.toLowerCase().trim() === cleanUsername ||
        a.username.toLowerCase().trim() === inputRaw ||
        `${a.username.toLowerCase().trim()}@kalisalak.desa.id` === inputRaw
    );

    if (!matched) {
      dataStore.addAuditLog({
        user: username,
        role: "UNKNOWN",
        aksi: "LOGIN_FAILED",
        entity: "AUTH",
        target: username,
        detail: "Percobaan login gagal: Akun tidak terdaftar di database.",
        ipAddress: "127.0.0.1",
      });

      return NextResponse.json(
        { success: false, message: "Username atau kata sandi tidak cocok." },
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

    // STRICT PASSWORD VERIFICATION
    const storedPassword = matched.passwordHash || "p2kd2026";
    const isPasswordValid = verifyPassword(password, storedPassword);

    if (!isPasswordValid) {
      dataStore.addAuditLog({
        user: matched.username,
        role: matched.role,
        aksi: "LOGIN_FAILED",
        entity: "AUTH",
        target: matched.namaLengkap,
        detail: `Percobaan login gagal untuk akun ${matched.username}: Kata sandi salah.`,
        ipAddress: "127.0.0.1",
      });

      return NextResponse.json(
        { success: false, message: "Username atau kata sandi tidak cocok." },
        { status: 401 }
      );
    }

    const isDeveloper = matched.username.toLowerCase() === "develzy" || matched.role === "DEVELOPER";
    const isKetua =
      matched.username.toLowerCase() === "khasanudin" ||
      matched.username.toLowerCase() === "admin_kalisalak" ||
      (Boolean(matched.jabatan) && matched.jabatan.toLowerCase().includes("ketua") && !matched.jabatan.toLowerCase().includes("seksi"));

    const isSuperAdmin = isDeveloper || isKetua;
    const token = generateAuthToken(
      {
        username: matched.username,
        nama: `${matched.namaLengkap} (${matched.jabatan})`,
        role: matched.role,
        seksi: matched.seksi,
        jabatan: matched.jabatan,
        assignedTps: matched.assignedTps || "SEMUA",
        isSuperAdmin,
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
      detail: `Petugas berhasil login ke sistem (${matched.jabatan}).`,
      ipAddress: "127.0.0.1",
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
        assignedTps: matched.assignedTps || "SEMUA",
        isSuperAdmin,
        mustChangePassword: isDefault,
        token,
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
