import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import {
  createAuditBackupPackage,
  GDRIVE_CONFIG,
} from "@/lib/gdrive-backup";

// GET/POST /api/cron/backup-audit - Otomatis dieksekusi setiap 48 jam melalui Vercel Cron
export async function GET(req: Request) {
  return handleBackupCron(req);
}

export async function POST(req: Request) {
  return handleBackupCron(req);
}

async function handleBackupCron(req: Request) {
  try {
    // Verifikasi CRON_SECRET jika dikonfigurasi di Environment
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, message: "Unauthorized cron execution" },
          { status: 401 }
        );
      }
    }

    await dataStore.ensureSynced();
    const auditLogs = dataStore.getAuditLogs(1000);
    const operator = "Vercel Cron Scheduler (48 Jam)";

    const backupPackage = await createAuditBackupPackage(auditLogs, operator);

    // Integrasi Google Apps Script Webhook jika dikonfigurasi
    const webhookUrl = process.env.GDRIVE_BACKUP_WEBHOOK_URL;
    let uploadStatus = "ARCHIVED_LOCALLY";

    if (webhookUrl) {
      try {
        const uploadRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backupPackage),
        });
        if (uploadRes.ok) {
          uploadStatus = "UPLOADED_TO_GDRIVE";
        }
      } catch (uploadErr) {
        console.warn("Gagal webhook Google Drive:", uploadErr);
      }
    }

    // Catat log audit aktivitas bahwa siklus 48 jam tercapai
    dataStore.addAuditLog({
      user: "SYSTEM_CRON_48H",
      role: "SYSTEM",
      aksi: "BACKUP_AUDIT_48H",
      entity: "SISTEM",
      target: backupPackage.metadata.targetFileName,
      detail: `Pencadangan otomatis 48 jam: ${backupPackage.metadata.totalRecords} log aktivitas terenkapsulasi SHA-256 (${backupPackage.metadata.sha256Hash.substring(0, 10)}...). Target Google Drive: ${GDRIVE_CONFIG.FOLDER_ID}`,
      ipAddress: "127.0.0.1",
      kategori: "CADANGAN_GDRIVE",
      severity: "INFO",
    });

    return NextResponse.json({
      success: true,
      message: "Cadangan log aktivitas 48 jam berhasil dieksekusi ke Google Drive.",
      metadata: backupPackage.metadata,
      driveFolderUrl: GDRIVE_CONFIG.FOLDER_URL,
      uploadStatus,
    });
  } catch (error) {
    console.error("Cron backup audit failed:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error on cron backup audit." },
      { status: 500 }
    );
  }
}
