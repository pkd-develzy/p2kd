"use client";

import React, { useState } from "react";
import {
  HardDrive,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { GDRIVE_CONFIG } from "@/lib/gdrive-backup";

interface ModalGdriveWebhookProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (url: string) => void;
}

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    // ID Folder Resmi P2KD Kalisalak
    var folderId = "1DbuBW3z7N8MdECHc967gJz2G7zRSZ5kk";
    var folder = DriveApp.getFolderById(folderId);
    var payload = JSON.parse(e.postData.contents);
    var fileName = (payload.metadata && payload.metadata.targetFileName) 
      ? payload.metadata.targetFileName 
      : ("P2KD_AUDIT_LOG_48H_" + new Date().getTime() + ".json");
      
    var fileContent = JSON.stringify(payload, null, 2);
    var file = folder.createFile(fileName, fileContent, "application/json");
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const ModalGdriveWebhook: React.FC<ModalGdriveWebhookProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("p2kd_gdrive_webhook_url") || "";
    }
    return "";
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveAndTest = async () => {
    if (!webhookUrl.trim()) {
      localStorage.removeItem("p2kd_gdrive_webhook_url");
      setTestResult({
        type: "error",
        text: "URL Webhook kosong. Otomatisasi dinonaktifkan.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Simpan ke local storage
      localStorage.setItem("p2kd_gdrive_webhook_url", webhookUrl.trim());

      // Lakukan uji tes cadangan
      const res = await fetch("/api/admin/audit/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });
      const data = await res.json();

      if (data.uploadStatus === "UPLOADED_TO_GDRIVE") {
        setTestResult({
          type: "success",
          text: "KONEKSI BERHASIL! Berkas cadangan tes telah berhasil dibuat dan masuk langsung ke folder Google Drive Anda.",
        });
        onSaved(webhookUrl.trim());
      } else {
        setTestResult({
          type: "error",
          text: data.webhookFeedback || "Gagal menghubungkan ke Webhook. Pastikan hak akses Web App disetel ke 'Anyone'.",
        });
      }
    } catch (err) {
      setTestResult({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat menguji URL Webhook.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Hubungkan Unggah Otomatis Google Drive
              </h3>
              <p className="text-xs text-slate-300">
                Pencadangan Langsung ke Folder Resmi tanpa Klik Manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Info Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-xs text-amber-950">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Mengapa Google Drive memerlukan izin ini?</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-800">
              Folder Google Drive Anda (ID: <strong className="font-mono">{GDRIVE_CONFIG.FOLDER_ID}</strong>) adalah akun Google pribadi yang terlindungi. Google mengharuskan izin perantara resmi (Google Apps Script gratis) agar website dan sistem cron 48 jam dapat membuat file di folder tersebut.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-slate-900 text-xs">
              Langkah Cepat (Hanya 1 Menit):
            </h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
              <li>
                Buka{" "}
                <a
                  href="https://script.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  script.google.com <ExternalLink className="w-3 h-3" />
                </a>{" "}
                menggunakan akun Google pemilik folder Drive.
              </li>
              <li>Klik tombol <strong>+ New Project</strong> (Proyek baru).</li>
              <li>Hapus teks yang ada, lalu salin dan tempelkan kode di bawah ini:</li>
            </ol>
          </div>

          {/* Script Box */}
          <div className="relative">
            <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
              {APPS_SCRIPT_CODE}
            </pre>
            <button
              onClick={handleCopyCode}
              type="button"
              className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Script</span>
                </>
              )}
            </button>
          </div>

          <ol start={4} className="list-decimal pl-5 space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
            <li>
              Klik tombol biru <strong>Deploy</strong> (kanan atas) &rarr; pilih <strong>New deployment</strong>.
            </li>
            <li>
              Pilih jenis: <strong>Web app</strong>. Pada bagian <em>Who has access</em>, pilih <strong>Anyone</strong> (Siapa saja). Lalu klik <strong>Deploy</strong>.
            </li>
            <li>Salin <strong>Web App URL</strong> yang muncul dan tempelkan ke kolom di bawah ini:</li>
          </ol>

          {/* Webhook Input Field */}
          <div className="space-y-1.5 pt-2">
            <label className="block font-bold text-slate-800 text-xs">
              URL Webhook Google Apps Script:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button
                onClick={handleSaveAndTest}
                disabled={testing}
                type="button"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>{testing ? "Menguji..." : "Simpan & Uji"}</span>
              </button>
            </div>
          </div>

          {/* Feedback Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.type === "success"
                  ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                  : "bg-rose-50 border border-rose-300 text-rose-800"
              }`}
            >
              {testResult.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <a
            href={GDRIVE_CONFIG.FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>Buka Folder Drive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
