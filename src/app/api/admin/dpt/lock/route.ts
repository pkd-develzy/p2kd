import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();

    // Only Superadmin / Pimpinan can lock / unlock DPT
    if (!session.user.isSuperAdmin && session.user.role !== "SUPER_ADMIN" && session.user.seksi !== "PIMPINAN") {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Hanya Ketua P2KD / Superadmin yang berwenang mengunci atau membuka pleno DPT." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, nomorBeritaAcara, alasan } = body;
    const user = session.user.nama || session.user.username;

    if (action === "UNLOCK") {
      const state = await dataStore.unlockDPT(user, alasan || "Revisi Pleno");
      return NextResponse.json({
        success: true,
        message: "Status DPT berhasil dibuka kembali untuk perbaikan.",
        data: state,
      });
    }

    // Default action is LOCK
    const baNumber = nomorBeritaAcara || `BA/${Date.now().toString().slice(-4)}/P2KD-KLS/VIII/2026`;
    const state = await dataStore.lockDPT(user, baNumber);

    return NextResponse.json({
      success: true,
      message: "DPT Pilkades Kalisalak berhasil ditetapkan dan dikunci secara permanen dengan Segel Kriptografi.",
      data: state,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memproses penguncian DPT." },
      { status: 500 }
    );
  }
}
