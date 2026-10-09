import { NextResponse } from "next/server";
import { SupabaseDbService } from "@/lib/supabase-db";
import {
  verifyAdminSession,
  canAccessVoterData,
  isPantarlih,
  isDeveloper,
  isKetuaP2KD,
  isSeksiPemilih,
} from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const user = session.user;
    if (!canAccessVoterData(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Anda tidak memiliki wewenang mengakses modul Data Pemilih.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tahapParam = searchParams.get("tahap") || "SEMUA";
    const statusParam = searchParams.get("status") || "SEMUA";
    const searchParam = searchParams.get("search") || "";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);

    const isFieldOfficer =
      isPantarlih(user) && !isKetuaP2KD(user) && !isDeveloper(user) && !isSeksiPemilih(user);

    let cleanTps: string | undefined = undefined;
    if (isFieldOfficer) {
      if (!user.assignedTps || user.assignedTps === "SEMUA") {
        return NextResponse.json(
          {
            success: false,
            message: "Akses Ditolak: Petugas lapangan belum memiliki wilayah binaan TPS/RW.",
          },
          { status: 403 }
        );
      }
      cleanTps = user.assignedTps;
    } else {
      const tpsQuery = searchParams.get("tps");
      if (tpsQuery && tpsQuery !== "SEMUA") {
        cleanTps = tpsQuery;
      }
    }

    const cleanStatus = statusParam !== "SEMUA" ? statusParam : undefined;
    const cleanTahap = tahapParam !== "SEMUA" ? tahapParam : undefined;

    const limit = Math.min(100, Math.max(1, limitParam));
    const offset = Math.max(0, (pageParam - 1) * limit);

    // 1. Search Query
    if (searchParam && searchParam.trim().length > 0) {
      const searchResults = await SupabaseDbService.searchPemilih(searchParam.trim(), {
        tps: cleanTps,
        limit,
      });

      return NextResponse.json({
        success: true,
        total: searchResults.length,
        page: 1,
        limit,
        totalPages: 1,
        tahap: tahapParam,
        assignedTps: cleanTps,
        data: searchResults,
      });
    }

    // 2. Filtered & Paged Query
    const pagedResult = await SupabaseDbService.fetchPemilihPaged(offset, limit, {
      tps: cleanTps,
      statusAktif: cleanStatus,
      tahap: cleanTahap,
    });

    return NextResponse.json({
      success: true,
      total: pagedResult.total,
      page: pageParam,
      limit,
      totalPages: Math.ceil(pagedResult.total / limit) || 1,
      tahap: tahapParam,
      assignedTps: cleanTps,
      data: pagedResult.data,
    });
  } catch (err) {
    console.error("Error in GET /api/app/pemilih:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data pemilih untuk aplikasi native." },
      { status: 500 }
    );
  }
}
