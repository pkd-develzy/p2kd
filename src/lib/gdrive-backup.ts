/**
 * gdrive-backup.ts
 * Layanan Pencadangan Otomatis Log Audit Aktivitas Pengguna ke Google Drive (Siklus 48 Jam)
 * Target Folder Resmi P2KD: https://drive.google.com/drive/folders/1DbuBW3z7N8MdECHc967gJz2G7zRSZ5kk?usp=sharing
 */

import { AuditLog } from "@/components/pages/admin/types";

export const GDRIVE_CONFIG = {
  FOLDER_ID: "1DbuBW3z7N8MdECHc967gJz2G7zRSZ5kk",
  FOLDER_URL: "https://drive.google.com/drive/folders/1DbuBW3z7N8MdECHc967gJz2G7zRSZ5kk?usp=sharing",
  DEFAULT_WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbz5r3Fy1d_U5z9UZTtcOUuF9XWaDl5zktNaoRMjmNcy5HtG4J0wd8T3bG065YigVwTA/exec",
  INTERVAL_HOURS: 48,
  INTERVAL_MS: 48 * 60 * 60 * 1000,
  APP_NAME: "P2KD Kalisalak 2026/2027 - Audit Trail Backup Vault",
};

export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Mendapatkan epoch timestamp (ms) dari item log dengan presisi tinggi.
 * Mendukung field createdAt (ISO 8601) maupun waktu format lokal WIB.
 */
export function getLogTimestamp(log: { waktu?: string; createdAt?: string }): number {
  if (log.createdAt) {
    const t = new Date(log.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (!log.waktu) return Date.now();

  const clean = log.waktu.replace(/WIB/i, "").trim();
  const match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[,\s]+(\d{1,2})[.:](\d{1,2})[.:](\d{1,2})/);
  if (match) {
    const [, day, month, year, hour, minute, second] = match;
    // Format WIB adalah UTC+7
    return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 7, Number(minute), Number(second));
  }

  const parsed = new Date(clean).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

/**
 * Memeriksa apakah log masih berada dalam jendela waktu 48 jam terakhir.
 */
export function isLogWithin48Hours(log: { waktu?: string; createdAt?: string }, now = Date.now()): boolean {
  const ts = getLogTimestamp(log);
  return (now - ts) <= FORTY_EIGHT_HOURS_MS;
}

/**
 * Filter daftar log agar hanya menyisakan log yang berada dalam rentang 48 jam.
 */
export function filterLogsWithin48Hours<T extends { waktu?: string; createdAt?: string }>(logs: T[], now = Date.now()): T[] {
  return logs.filter((log) => isLogWithin48Hours(log, now));
}

/**
 * Memisahkan log menjadi dua kelompok:
 * 1. activeLogs: log dalam rentang 48 jam terakhir (untuk tampilan menu)
 * 2. expiredLogs: log yang sudah melampaui 48 jam (wajib langsung disimpan ke Google Drive)
 */
export function partitionLogsBy48Hours<T extends { waktu?: string; createdAt?: string }>(logs: T[], now = Date.now()): {
  activeLogs: T[];
  expiredLogs: T[];
} {
  const activeLogs: T[] = [];
  const expiredLogs: T[] = [];

  for (const log of logs) {
    if (isLogWithin48Hours(log, now)) {
      activeLogs.push(log);
    } else {
      expiredLogs.push(log);
    }
  }

  return { activeLogs, expiredLogs };
}

export interface AuditBackupMetadata {
  backupId: string;
  backupName: string;
  timestampWib: string;
  timestampIso: string;
  totalRecords: number;
  sha256Hash: string;
  googleDriveFolderUrl: string;
  googleDriveFolderId: string;
  targetFileName: string;
  status: "BERHASIL" | "TERJADWAL" | "PROSES";
  operator: string;
}

export interface BackupPackage {
  metadata: AuditBackupMetadata;
  auditTrail: AuditLog[];
}

/**
 * Menghasilkan hash SHA-256 untuk memverifikasi integritas arsip backup
 */
export async function computeHash(content: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `hash-${Date.now().toString(36)}`;
}

/**
 * Membuat paket arsip backup log audit terstruktur dengan tanda tangan kriptografi
 */
export async function createAuditBackupPackage(
  auditLogs: AuditLog[],
  operator = "Sistem Otomatis (48 Jam)"
): Promise<BackupPackage> {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const fileName = `P2KD_AUDIT_LOG_48H_${dateStr}_${timeStr}.json`;
  const backupId = `BCK-48H-${dateStr}-${timeStr}`;

  const payloadString = JSON.stringify(auditLogs);
  const sha256Hash = await computeHash(payloadString);

  const metadata: AuditBackupMetadata = {
    backupId,
    backupName: `Arsip Log Audit Siklus 48 Jam - ${dateStr}`,
    timestampWib: now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    timestampIso: now.toISOString(),
    totalRecords: auditLogs.length,
    sha256Hash,
    googleDriveFolderUrl: GDRIVE_CONFIG.FOLDER_URL,
    googleDriveFolderId: GDRIVE_CONFIG.FOLDER_ID,
    targetFileName: fileName,
    status: "BERHASIL",
    operator,
  };

  return {
    metadata,
    auditTrail: auditLogs,
  };
}

/**
 * Membaca status siklus backup 48 jam saat ini
 */
export function getBackupScheduleStatus(): {
  lastBackupAt: number;
  lastBackupFormatted: string;
  nextBackupAt: number;
  nextBackupFormatted: string;
  isDue: boolean;
  remainingHours: number;
  folderUrl: string;
} {
  const fallbackLastBackup = Date.now() - 2 * 3600000; // default 2 jam yang lalu jika baru pertama kali
  let lastBackupAt = fallbackLastBackup;

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("p2kd_last_gdrive_audit_backup");
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          lastBackupAt = parsed;
        }
      }
    } catch {
      // Abaikan jika restricted
    }
  }

  const nextBackupAt = lastBackupAt + GDRIVE_CONFIG.INTERVAL_MS;
  const now = Date.now();
  const isDue = now >= nextBackupAt;
  const remainingMs = Math.max(0, nextBackupAt - now);
  const remainingHours = Math.round(remainingMs / (3600 * 1000));

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return {
    lastBackupAt,
    lastBackupFormatted: new Date(lastBackupAt).toLocaleDateString("id-ID", formatOptions),
    nextBackupAt,
    nextBackupFormatted: new Date(nextBackupAt).toLocaleDateString("id-ID", formatOptions),
    isDue,
    remainingHours,
    folderUrl: GDRIVE_CONFIG.FOLDER_URL,
  };
}

/**
 * Menyimpan catatan bahwa backup 48 jam baru saja berhasil dieksekusi
 */
export function recordBackupExecuted(timestamp = Date.now()): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("p2kd_last_gdrive_audit_backup", String(timestamp));
    } catch {
      // Abaikan jika restricted
    }
  }
}

/**
 * Mengirim paket arsip log ke Google Apps Script Webhook.
 * URL default mengarah langsung ke script resmi P2KD Kalisalak.
 */
export async function uploadPackageToGdriveWebhook(
  backupPackage: BackupPackage,
  customWebhookUrl?: string
): Promise<{
  success: boolean;
  status: "UPLOADED_TO_GDRIVE" | "WEBHOOK_FAILED";
  fileUrl?: string;
  fileId?: string;
  fileName?: string;
  feedback?: string;
}> {
  const webhookUrl =
    (customWebhookUrl && customWebhookUrl.trim()) ||
    process.env.GDRIVE_BACKUP_WEBHOOK_URL ||
    GDRIVE_CONFIG.DEFAULT_WEBHOOK_URL;

  try {
    const uploadRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backupPackage),
    });

    if (uploadRes.ok) {
      try {
        const uploadJson = await uploadRes.json();
        return {
          success: true,
          status: "UPLOADED_TO_GDRIVE",
          fileUrl: uploadJson.fileUrl,
          fileId: uploadJson.fileId,
          fileName: uploadJson.fileName,
          feedback: "Berhasil terunggah ke Google Drive",
        };
      } catch {
        return {
          success: true,
          status: "UPLOADED_TO_GDRIVE",
          feedback: "Unggah berhasil (respons non-JSON)",
        };
      }
    } else {
      return {
        success: false,
        status: "WEBHOOK_FAILED",
        feedback: `Webhook merespons status ${uploadRes.status}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      status: "WEBHOOK_FAILED",
      feedback: err instanceof Error ? err.message : "Gagal menghubungi webhook Google Drive",
    };
  }
}

