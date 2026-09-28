import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession, isDeveloper } from "@/lib/auth-middleware";

import { GDRIVE_CONFIG } from "@/lib/gdrive-backup";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    // STRICT DEVELOPER ONLY ACCESS
    if (!isDeveloper(session.user)) {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message: "Akses Ditolak: Log Aktivitas dan Audit Trail hanya dapat diakses oleh Developer Sistem.",
        },
        { status: 403 }
      );
    }

    await dataStore.ensureSynced();

    // Otomatis arsipkan dan simpan log yang sudah melampaui 48 jam ke Google Apps Script Webhook
    dataStore.archiveAndPruneExpiredLogs().catch((err) => {
      console.warn("Background auto-archive expired logs failed:", err);
    });

    // Batasi log yang ditampilkan HANYA dalam rentang 48 jam
    const logs = dataStore.getAuditLogsWithin48Hours(500);

    return NextResponse.json({
      success: true,
      total: logs.length,
      retentionWindowHours: 48,
      gdriveWebhookUrl: GDRIVE_CONFIG.DEFAULT_WEBHOOK_URL,
      data: logs,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memuat log audit aktivitas." },
      { status: 500 }
    );
  }
}

// POST /api/admin/audit - Memaksa proses arsip segera untuk log > 48 jam ke Google Drive
export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    if (!isDeveloper(session.user)) {
      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Hanya untuk Developer Sistem." },
        { status: 403 }
      );
    }

    let customWebhook: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body && typeof body.webhookUrl === "string" && body.webhookUrl.trim()) {
        customWebhook = body.webhookUrl.trim();
      }
    } catch {
      // Body opsional
    }

    await dataStore.ensureSynced();
    const result = await dataStore.archiveAndPruneExpiredLogs(customWebhook);

    return NextResponse.json({
      success: true,
      message:
        result.archivedCount > 0
          ? `Sebanyak ${result.archivedCount} log aktivitas (> 48 jam) telah berhasil diamankan ke Google Drive.`
          : "Tidak ada log yang melampaui batas 48 jam. Semua log saat ini masih aktif dalam jendela 48 jam.",
      archivedCount: result.archivedCount,
      driveFileUrl: result.fileUrl,
      fileName: result.fileName,
      status: result.status,
    });
  } catch (error) {
    console.error("Error archiving expired logs:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengarsipkan log yang sudah 48 jam." },
      { status: 500 }
    );
  }
}
