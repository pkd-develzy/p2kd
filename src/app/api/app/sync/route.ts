import { NextResponse } from "next/server";
import { verifyAdminSession, canAccessVoterData } from "@/lib/auth-middleware";
import { RumahCoklitService, VerifikasiStatus } from "@/lib/rumah-coklit-service";

interface SyncRecord {
  idempotencyKey: string;
  qrToken: string;
  rumah: {
    alamat: string;
    rt: string;
    rw: string;
    nomorRumah?: string;
    keteranganLokasi?: string;
    koordinatLat?: number;
    koordinatLng?: number;
  };
  kks?: Array<{
    noKk: string;
    kepalaKeluargaNama: string;
  }>;
  namaStikerManual?: string;
  catatanKunjungan?: string;
  verifikasiAnggota: Array<{
    pemilihId: string;
    status: VerifikasiStatus;
    catatan?: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak memiliki wewenang sinkronisasi." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const items: SyncRecord[] = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: true, message: "Tidak ada antrean sinkronisasi.", processed: 0, results: [] }
      );
    }

    const results: Array<{
      idempotencyKey: string;
      qrToken: string;
      success: boolean;
      message: string;
    }> = [];

    for (const item of items) {
      try {
        // 1. Register or update rumah
        const rumahRes = await RumahCoklitService.registerOrUpdateRumah({
          qrToken: item.qrToken,
          alamat: item.rumah.alamat,
          rt: item.rumah.rt,
          rw: item.rumah.rw,
          nomorRumah: item.rumah.nomorRumah,
          keteranganLokasi: item.rumah.keteranganLokasi,
          koordinatLat: item.rumah.koordinatLat,
          koordinatLng: item.rumah.koordinatLng,
          petugasUsername: user.username,
          petugasNama: user.nama || user.username,
          tps: user.assignedTps,
        });

        if (!rumahRes.success || !rumahRes.rumah) {
          results.push({
            idempotencyKey: item.idempotencyKey,
            qrToken: item.qrToken,
            success: false,
            message: rumahRes.message || "Gagal memproses data rumah.",
          });
          continue;
        }

        const rumahId = rumahRes.rumah.id;

        // 2. Link KKs if any
        if (item.kks && item.kks.length > 0) {
          for (const kk of item.kks) {
            await RumahCoklitService.linkKkToRumah({
              rumahId,
              noKk: kk.noKk,
              kepalaKeluargaNama: kk.kepalaKeluargaNama,
              rt: item.rumah.rt,
              rw: item.rumah.rw,
              alamat: item.rumah.alamat,
            });
          }
        }

        // 3. Submit visit
        const visitRes = await RumahCoklitService.submitKunjunganCoklit({
          rumahId,
          qrToken: item.qrToken,
          petugasUsername: user.username,
          petugasNama: user.nama || user.username,
          tps: user.assignedTps || "Tabung Pemilihan",
          namaStikerManual: item.namaStikerManual,
          catatanKunjungan: item.catatanKunjungan,
          verifikasiAnggota: item.verifikasiAnggota,
          idempotencyKey: item.idempotencyKey,
        });

        results.push({
          idempotencyKey: item.idempotencyKey,
          qrToken: item.qrToken,
          success: visitRes.success,
          message: visitRes.message,
        });
      } catch (err: unknown) {
        const error = err as Error;
        results.push({
          idempotencyKey: item.idempotencyKey,
          qrToken: item.qrToken,
          success: false,
          message: error?.message || "Kesalahan proses sinkronisasi item.",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi batch selesai: ${successCount} dari ${items.length} item berhasil disimpan.`,
      processed: items.length,
      successCount,
      results,
    });
  } catch (err) {
    console.error("Batch sync error:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat sinkronisasi batch." },
      { status: 500 }
    );
  }
}
