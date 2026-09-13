import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { generateAuthToken, verifyPassword } from "@/lib/encryption";
import { isInitialDefaultPassword } from "@/lib/password-policy";

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
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (
        !turnstileToken ||
        typeof turnstileToken !== "string" ||
        turnstileToken.length === 0 ||
        turnstileToken.length > 2048
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Verifikasi keamanan (Turnstile) wajib diselesaikan.",
          },
          { status: 403 }
        );
      }

      const clientIp =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "";

      try {
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

        if (!cfRes.ok) {
          throw new Error(`siteverify returned HTTP ${cfRes.status}`);
        }

        const cfData = await cfRes.json();

        if (!cfData.success) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Verifikasi keamanan sistem tidak valid atau telah kadaluarsa. Silakan coba kembali.",
            },
            { status: 403 }
          );
        }
      } catch (err) {
        console.error("Siteverify error:", err);
        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal memverifikasi respon keamanan ke server database.",
          },
          { status: 403 }
        );
      }
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

    const isSuperAdmin = matched.role === "SUPER_ADMIN" || matched.seksi === "PIMPINAN";
    const token = generateAuthToken({
      username: matched.username,
      nama: `${matched.namaLengkap} (${matched.jabatan})`,
      role: matched.role,
      seksi: matched.seksi,
      assignedTps: matched.assignedTps || "SEMUA",
      isSuperAdmin,
    });

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
      maxAge: 86400,
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
