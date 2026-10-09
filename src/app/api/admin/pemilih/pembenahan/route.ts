import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import {
  verifyAdminSession,
  isDeveloper,
  isKetuaP2KD,
  isSeksiPemilih,
  canAccessVoterData,
} from "@/lib/auth-middleware";
import type { PembenahanType, ValidationStatus } from "@/types/voter-stages";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    if (!canAccessVoterData(session.user)) {
      return NextResponse.json({ success: false, message: "Akses Ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const pemilihId = searchParams.get("pemilihId") || undefined;
    const statusValidasi = (searchParams.get("statusValidasi") as ValidationStatus) || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

    const list = await SupabaseDbService.getPembenahanDpshpList({
      pemilihId,
      statusValidasi,
      limit,
    });

    return NextResponse.json({ success: true, data: list });
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
    if (!canAccessVoterData(user)) {
      return NextResponse.json({ success: false, message: "Akses Ditolak." }, { status: 403 });
    }

    const body = await req.json();
    const {
      pemilihId,
      jenisPembenahan,
      fieldChanged,
      oldValue,
      newValue,
      alasan,
      autoValidate = false,
    } = body;

    if (!pemilihId || !jenisPembenahan || !alasan) {
      return NextResponse.json(
        { success: false, message: "Parameter pemilihId, jenisPembenahan, dan alasan wajib diisi." },
        { status: 400 }
      );
    }

    // Only Admin/Ketua/Seksi 1 can auto-validate
    const canValidate = isDeveloper(user) || isKetuaP2KD(user) || isSeksiPemilih(user);
    const shouldAutoValidate = autoValidate && canValidate;

    const res = await SupabaseDbService.createPembenahanDpshp({
      pemilihId,
      jenisPembenahan: jenisPembenahan as PembenahanType,
      fieldChanged,
      oldValue: oldValue ? String(oldValue) : undefined,
      newValue: newValue ? String(newValue) : undefined,
      alasan,
      petugasPengusul: user.nama || user.username || "Petugas Lapangan",
      autoValidate: shouldAutoValidate,
      petugasPemvalidasi: shouldAutoValidate ? (user.nama || user.username) : undefined,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, message: res.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      id: res.id,
      message: res.message,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    const canValidate = isDeveloper(user) || isKetuaP2KD(user) || isSeksiPemilih(user);
    if (!canValidate) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Hanya Developer, Ketua P2KD, dan Seksi 1 yang berwenang memvalidasi pembenahan DPSHP.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { pembenahanId, statusValidasi } = body;

    if (!pembenahanId || !statusValidasi || !["VALID", "DITOLAK", "PENDING"].includes(statusValidasi)) {
      return NextResponse.json(
        { success: false, message: "Parameter pembenahanId dan statusValidasi ('VALID' | 'DITOLAK') wajib valid." },
        { status: 400 }
      );
    }

    const res = await SupabaseDbService.validatePembenahanDpshp(
      pembenahanId,
      statusValidasi as ValidationStatus,
      user.nama || user.username || "Panitia Pleno"
    );

    if (!res.success) {
      return NextResponse.json({ success: false, message: res.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
