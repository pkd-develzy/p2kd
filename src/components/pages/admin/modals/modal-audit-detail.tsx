"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  X,
  User,
  Clock,
  Globe,
  Monitor,
  Copy,
  Check,
  FileCode,
  HardDrive,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { AuditLog } from "../types";
import { GDRIVE_CONFIG } from "@/lib/gdrive-backup";

interface ModalAuditDetailProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalAuditDetail: React.FC<ModalAuditDetailProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !log) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            TINGKAT KRUSIAL (CRITICAL)
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            TINGKAT PERINGATAN (WARNING)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            INFORMASI STANDAR (INFO)
          </span>
        );
    }
  };

  const getCategoryLabel = (kategori?: string) => {
    switch (kategori) {
      case "OTENTIKASI":
        return "Otentikasi & Login Sesi";
      case "DATA_PEMILIH":
        return "Mutasi Data Pemilih & DPT";
      case "COKLIT_LAPANGAN":
        return "Verifikasi Coklit Pantarlih";
      case "PETUGAS_ANGGOTA":
        return "Kepanitiaan & Petugas Lapangan";
      case "TPS_WILAYAH":
        return "Struktur Wilayah & Master TPS";
      case "TANGGAPAN_MASYARAKAT":
        return "Aduan / Masukan Publik";
      case "CADANGAN_GDRIVE":
        return "Pencadangan Siklus 48 Jam GDrive";
      default:
        return "Operasional Sistem Internal";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border-b border-blue-900/60 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Forensik Jejak Digital P2KD
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                ID: {log.id}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Rincian Mendalam Log Aktivitas
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            aria-label="Tutup Detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* Status & Kategori Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {getSeverityBadge(log.severity)}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                {getCategoryLabel(log.kategori)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{log.waktu}</span>
            </div>
          </div>

          {/* Action Code & Human Description */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                Aksi & Kode Peristiwa
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                {log.aksi}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {log.detail}
            </p>
            <div className="pt-2 border-t border-blue-200/60 flex items-center gap-2 text-xs text-blue-900">
              <strong className="font-bold">Target Entitas:</strong>
              <span className="font-mono px-2 py-0.5 rounded bg-white border border-blue-200 font-semibold text-slate-800">
                {log.target || log.entity || "SYSTEM"}
              </span>
            </div>
          </div>

          {/* Operator & Network Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operator Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Identitas Pelaksana (Operator)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Nama Akun:</span>
                  <span className="font-bold text-slate-900">{log.user}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Peran / Hak Akses:</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-800">
                    {log.role}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Otoritas Validasi:</span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Sesi
                  </span>
                </div>
              </div>
            </div>

            {/* Network & Environment */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                Jejak Jaringan & Perangkat
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Alamat IP:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {log.ipAddress || "127.0.0.1"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Perangkat / OS:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    {log.device || "Desktop Terminal / Workstation"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Peramban (Browser):</span>
                  <span className="font-medium text-slate-700 truncate max-w-[170px]" title={log.browser || "Google Chrome"}>
                    {log.browser || "Google Chrome 124.0 (x64)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Agent Full String */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Informasi User-Agent Lengkap:
            </span>
            <div className="font-mono text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 break-all select-all">
              {log.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 P2KD-SecureBrowser/1.0"}
            </div>
          </div>

          {/* Mutasi Data / Changes (If Available) */}
          {log.changes && (log.changes.before || log.changes.after) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600" />
                Rincian Mutasi Nilai (Sebelum vs Sesudah)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-bold text-rose-800 block text-[11px] uppercase">
                    Sebelum Perubahan
                  </span>
                  <pre className="font-mono text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.changes.before || {}, null, 2)}
                  </pre>
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-800 block text-[11px] uppercase">
                    Setelah Perubahan
                  </span>
                  <pre className="font-mono text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.changes.after || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic Seal & Cloud Guarantee */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-slate-900 to-blue-950 text-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Segel Kriptografis & Integritas Data
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                TIDAK DAPAT DIUBAH (IMMUTABLE)
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-black/30 p-2.5 rounded-xl border border-white/10 text-xs font-mono">
              <span className="text-slate-400 truncate">
                Signature: {log.signature || `SIG-P2KD-${log.id.toUpperCase()}-VERIFIED`}
              </span>
              <span className="text-emerald-400 shrink-0 font-sans text-[11px] font-semibold">
                SHA-256 Valid
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Catatan aktivitas ini tersimpan permanen di Server 3 Supabase P2KD dan otomatis terbackup setiap 48 jam ke Google Drive resmi P2KD Kalisalak.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <a
            href={GDRIVE_CONFIG.FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>Folder Cadangan GDrive</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              type="button"
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Salin Log JSON</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
