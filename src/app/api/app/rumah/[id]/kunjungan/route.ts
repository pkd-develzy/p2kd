import { NextResponse } from "next/server";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";
import { RumahCoklitService, VerifikasiStatus } from "@/lib/rumah-coklit-service";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang menyimpan kunjungan Coklit." },
        { status: 403 }
      );
    }

    const { id: rumahId } = await context.params;
    const body = await req.json();
    const {
      qrToken,
      namaStikerManual,
      catatanKunjungan,
      stikerDitempel,
      verifikasiAnggota,
      idempotencyKey,
    } = body;

    if (!qrToken || !verifikasiAnggota || !Array.isArray(verifikasiAnggota)) {
      return NextResponse.json(
        { success: false, message: "QR Token dan data verifikasi anggota keluarga wajib disertakan." },
        { status: 400 }
      );
    }

    const typedVerifikasi = verifikasiAnggota.map(
      (v: { pemilihId: string; status: string; catatan?: string }) => ({
        pemilihId: v.pemilihId,
        status: (v.status || "SESUAI") as VerifikasiStatus,
        catatan: v.catatan,
      })
    );

    const result = await RumahCoklitService.submitKunjunganCoklit({
      rumahId,
      qrToken,
      petugasUsername: user.username,
      petugasNama: user.nama || user.username,
      tps: user.assignedTps || "Tabung Pemilihan",
      namaStikerManual,
      catatanKunjungan,
      stikerDitempel: stikerDitempel !== undefined ? Boolean(stikerDitempel) : true,
      verifikasiAnggota: typedVerifikasi,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error submitting kunjungan Coklit:", err);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan konfirmasi kunjungan Coklit." },
      { status: 500 }
    );
  }
}
