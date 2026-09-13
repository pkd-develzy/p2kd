import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";
import { hashPassword } from "@/lib/encryption";

// Helper to strip passwordHash from responses
function sanitizeAnggota<T extends { passwordHash?: string }>(agt: T): Omit<T, "passwordHash"> {
  const copy = { ...agt };
  delete copy.passwordHash;
  return copy;
}

// GET /api/admin/anggota?seksi=...
export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const seksi = searchParams.get("seksi") || "SEMUA";
    const forceRefresh = searchParams.get("refresh") === "true";
    await dataStore.ensureSynced(forceRefresh);
    const anggota = dataStore.getAnggotaList(seksi);

    return NextResponse.json(
      {
        success: true,
        data: anggota.map(sanitizeAnggota),
        total: anggota.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data anggota P2KD." },
      { status: 500 }
    );
  }
}

// POST /api/admin/anggota - Tambah / Daftarkan Anggota Baru
export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isSuperAdmin = user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.seksi === "PIMPINAN";
    const isSeksiPemilih = user.seksi === "SEKSI_PEMILIH";

    if (!isSuperAdmin && !isSeksiPemilih) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang mendaftarkan anggota P2KD." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      namaLengkap,
      nik,
      jabatan,
      seksi,
      seksiLabel,
      username,
      role,
      kontakWa,
      alamatDusun,
      assignedTps,
      status,
      skPenetapan,
      fotoUrl,
      password,
      customPassword,
    } = body;

    if (!namaLengkap || !jabatan || !seksi || !username) {
      return NextResponse.json(
        { success: false, message: "Nama lengkap, jabatan, seksi, dan username wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).toLowerCase().trim();

    // Check duplicate username
    const existingList = dataStore.getAnggotaList();
    const isDuplicate = existingList.some(
      (a) => a.username.toLowerCase().trim() === cleanUsername
    );

    if (isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          message: `Username '${cleanUsername}' sudah terdaftar dalam sistem. Silakan pilih username lain.`,
        },
        { status: 409 }
      );
    }

    const plainPass = password || customPassword || "p2kd2026";
    const passwordHash = hashPassword(plainPass);

    const newAnggota = await dataStore.addAnggota(
      {
        namaLengkap: namaLengkap.trim(),
        nik: nik ? nik.trim() : "332801" + Math.floor(1000000000 + Math.random() * 9000000000),
        jabatan: jabatan.trim(),
        seksi,
        seksiLabel: seksiLabel || seksi,
        username: cleanUsername,
        role: role || (seksi === "PIMPINAN" ? "SUPER_ADMIN" : seksi.toLowerCase()),
        kontakWa: kontakWa ? kontakWa.trim() : "081200000000",
        alamatDusun: alamatDusun ? alamatDusun.trim() : "Desa Kalisalak",
        assignedTps: assignedTps || "SEMUA",
        status: status || "AKTIF",
        skPenetapan: skPenetapan || "Keputusan BPD No. 04/BPD-KLS/VII/2026",
        fotoUrl: fotoUrl || undefined,
        passwordHash,
      },
      user.nama || user.username
    );

    return NextResponse.json({
      success: true,
      message: `Anggota ${newAnggota.namaLengkap} (${newAnggota.username}) berhasil didaftarkan. Kata sandi: '${plainPass}'.`,
      data: sanitizeAnggota(newAnggota),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan anggota P2KD." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/anggota - Update Anggota atau Reset Sandi
export async function PUT(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isSuperAdmin = user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.seksi === "PIMPINAN";
    const isSeksiPemilih = user.seksi === "SEKSI_PEMILIH";

    if (!isSuperAdmin && !isSeksiPemilih) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang memperbarui data anggota." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, action, customPassword, password, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID anggota wajib disertakan." },
        { status: 400 }
      );
    }

    const userName = user.nama || user.username;

    if (action === "reset_password") {
      const resetRes = dataStore.resetPasswordAnggota(id, userName);
      if (!resetRes) {
        return NextResponse.json(
          { success: false, message: "Anggota tidak ditemukan." },
          { status: 404 }
        );
      }
      const resetHash = hashPassword(resetRes.defaultPassword);
      await dataStore.updateAnggota(id, { passwordHash: resetHash }, userName);

      return NextResponse.json({
        success: true,
        message: `Kata sandi akun ${resetRes.username} berhasil direset ke '${resetRes.defaultPassword}'.`,
        data: resetRes,
      });
    }

    if (action === "update_password") {
      const { newPassword } = body;
      const agt = dataStore.getAnggotaById(id);
      if (!agt) {
        return NextResponse.json(
          { success: false, message: "Anggota tidak ditemukan." },
          { status: 404 }
        );
      }

      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      const passwordHash = hashPassword(newPassword);
      await dataStore.updateAnggota(id, { passwordHash }, userName);

      dataStore.addAuditLog({
        user: userName,
        role: user.role || "SUPER_ADMIN",
        aksi: "ANGGOTA_UPDATE_PASSWORD",
        entity: "ANGGOTA_P2KD",
        target: `${agt.namaLengkap} (${agt.username})`,
        detail: `Mengubah kata sandi akun panitia ${agt.namaLengkap} (${agt.jabatan}).`,
        ipAddress: "127.0.0.1",
      });

      return NextResponse.json({
        success: true,
        message: `Kata sandi akun ${agt.username} berhasil diperbarui.`,
        data: { username: agt.username, updated: true },
      });
    }

    // If updating member fields and new password supplied
    if (customPassword || password) {
      updateFields.passwordHash = hashPassword(customPassword || password);
    }

    const updated = await dataStore.updateAnggota(id, updateFields, userName);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Anggota tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data anggota P2KD berhasil diperbarui.",
      data: sanitizeAnggota(updated),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui data anggota." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/anggota - Hapus Anggota
export async function DELETE(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isSuperAdmin = user.isSuperAdmin || user.role === "SUPER_ADMIN" || user.seksi === "PIMPINAN";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Hanya Ketua / Superadmin yang berwenang menghapus anggota P2KD." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID anggota wajib disertakan." },
        { status: 400 }
      );
    }

    await dataStore.ensureSynced();
    const success = await dataStore.deleteAnggota(id, user.nama || user.username);
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Anggota tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Anggota P2KD berhasil dihapus.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menghapus data anggota." },
      { status: 500 }
    );
  }
}
