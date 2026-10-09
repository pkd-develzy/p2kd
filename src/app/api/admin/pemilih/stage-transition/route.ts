import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import { dataStore } from "@/lib/data-store";
import {
  verifyAdminSession,
  isDeveloper,
  isKetuaP2KD,
  isSeksiPemilih,
} from "@/lib/auth-middleware";
import type { VoterStage } from "@/types/voter-stages";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const { searchParams } = new URL(req.url);
    const pemilihId = searchParams.get("pemilihId");

    if (!pemilihId) {
      return NextResponse.json(
        { success: false, message: "Parameter pemilihId wajib disertakan." },
        { status: 400 }
      );
    }

    const history = await SupabaseDbService.getRiwayatTahapList(pemilihId);
    return NextResponse.json({ success: true, data: history });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const isAuthorized = isDeveloper(user) || isKetuaP2KD(user) || isSeksiPemilih(user);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akses Ditolak: Hanya Developer, Ketua P2KD, dan Seksi 1 yang berwenang menetapkan transisi tahapan pemilih.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, ids, targetTahap, alasan, batchRef } = body;
    const userName = user.nama || user.username || "Petugas P2KD";
    const userRole = user.role || "SEKSI_PEMILIH";

    if (!targetTahap) {
      return NextResponse.json(
        { success: false, message: "Target tahap wajib diisi (CALON_DPS, DPS, DPSHP, atau DPT)." },
        { status: 400 }
      );
    }

    // Single voter transition
    if (id && typeof id === "string") {
      const res = await SupabaseDbService.transitionPemilihTahap(
        id,
        targetTahap as VoterStage,
        userName,
        userRole,
        alasan || `Penetapan status ${targetTahap} oleh ${userName}`,
        batchRef
      );

      if (!res.success) {
        return NextResponse.json({ success: false, message: res.message }, { status: 400 });
      }

      await dataStore.ensureSynced(true);

      // Notify Telegram
      try {
        const { notifyPetugasActivity } = await import("@/lib/telegram");
        void notifyPetugasActivity({
          namaPetugas: userName,
          rolePetugas: userRole,
          aktivitas: `Transisi Tahap Pemilih ke ${targetTahap}`,
          perubahanStatus: `${res.fromTahap} ➜ ${res.toTahap}`,
          rincian: alasan || `Penetapan status pemilih ke ${targetTahap}.`,
        }).catch(() => {});
      } catch {}

      return NextResponse.json({
        success: true,
        message: res.message,
        fromTahap: res.fromTahap,
        toTahap: res.toTahap,
      });
    }

    // Batch voters transition
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const res = await SupabaseDbService.batchTransitionPemilihTahap(
        ids,
        targetTahap as VoterStage,
        userName,
        userRole,
        alasan || `Penetapan pleno massal tahap ${targetTahap} (${ids.length} pemilih)`,
        batchRef
      );

      if (!res.success) {
        return NextResponse.json(
          {
            success: false,
            message: res.message,
            errors: res.errors,
          },
          { status: 400 }
        );
      }

      await dataStore.ensureSynced(true);

      // Notify Telegram
      try {
        const { notifyPetugasActivity } = await import("@/lib/telegram");
        void notifyPetugasActivity({
          namaPetugas: userName,
          rolePetugas: userRole,
          aktivitas: `Pleno Transisi Tahap ke ${targetTahap}`,
          perubahanStatus: `Diproses: ${res.count} Pemilih`,
          rincian: alasan || `Penetapan pleno massal ${res.count} pemilih ke tahap ${targetTahap}.`,
        }).catch(() => {});
      } catch {}

      return NextResponse.json({
        success: true,
        count: res.count,
        failedCount: res.failedCount,
        message: res.message,
        errors: res.errors,
      });
    }

    return NextResponse.json(
      { success: false, message: "ID atau daftar ID pemilih wajib disertakan." },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("Error in POST /api/admin/pemilih/stage-transition:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
