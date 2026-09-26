import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";
import {
  createAuditBackupPackage,
  GDRIVE_CONFIG,
} from "@/lib/gdrive-backup";

// POST /api/admin/audit/backup - Menjalankan proses backup siklus 48 jam ke Google Drive
export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();
    const auditLogs = dataStore.getAuditLogs();
    const operator = `${session.user.nama || session.user.username} (${session.user.role})`;

    const backupPackage = await createAuditBackupPackage(auditLogs, operator);

    // Kirim ke Google Apps Script Webhook jika dikonfigurasi di Environment
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
        console.warn("Gagal menghubungi Google Drive Webhook:", uploadErr);
      }
    }

    // Catat ke Audit Log sistem bahwa backup 48 jam telah dijalankan
    dataStore.addAuditLog({
      user: session.user.username,
      role: session.user.role,
      aksi: "BACKUP_AUDIT_48H",
      entity: "SISTEM",
      target: backupPackage.metadata.targetFileName,
      detail: `Pencadangan 48 Jam ${backupPackage.metadata.totalRecords} log audit tervalidasi SHA-256 (${backupPackage.metadata.sha256Hash.substring(0, 8)}...). Target GDrive: ${GDRIVE_CONFIG.FOLDER_ID}`,
      ipAddress: "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Cadangan 48 jam berhasil diproses untuk ${backupPackage.metadata.totalRecords} aktivitas terekam.`,
      metadata: backupPackage.metadata,
      driveUrl: GDRIVE_CONFIG.FOLDER_URL,
      uploadStatus,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/audit/backup:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal saat membuat cadangan log audit." },
      { status: 500 }
    );
  }
}

// GET /api/admin/audit/backup - Mengunduh file backup JSON resmi
export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();
    const auditLogs = dataStore.getAuditLogs();
    const operator = `${session.user.nama || session.user.username}`;
    const backupPackage = await createAuditBackupPackage(auditLogs, operator);

    const jsonString = JSON.stringify(backupPackage, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${backupPackage.metadata.targetFileName}"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/audit/backup:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengunduh arsip cadangan log audit." },
      { status: 500 }
    );
  }
}
