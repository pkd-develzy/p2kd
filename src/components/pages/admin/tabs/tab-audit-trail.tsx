"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  ShieldCheck,
  History,
  CloudUpload,
  HardDrive,
  ExternalLink,
  Download,
  Search,
  Filter,
  AlertTriangle,
  Info,
  Clock,
  User,
  Monitor,
  CheckCircle2,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, PaginationControl } from "@/components/ui";
import { AuditLog } from "../types";
import {
  GDRIVE_CONFIG,
  getBackupScheduleStatus,
  recordBackupExecuted,
} from "@/lib/gdrive-backup";
import { ModalAuditDetail } from "../modals/modal-audit-detail";

interface TabAuditTrailProps {
  auditLogs: AuditLog[];
}

export const TabAuditTrail: React.FC<TabAuditTrailProps> = ({ auditLogs }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AuditLog | null>(null);

  // Status backup GDrive 48 jam
  const [backupSchedule, setBackupSchedule] = useState(() => getBackupScheduleStatus());
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Eksekusi Backup Manual ke Google Drive
  const handleTriggerBackupNow = async () => {
    setIsBackingUp(true);
    setBackupMessage(null);
    try {
      const res = await fetch("/api/admin/audit/backup", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        recordBackupExecuted(Date.now());
        setBackupSchedule(getBackupScheduleStatus());
        setBackupMessage({
          type: "success",
          text: `Cadangan 48 Jam berhasil dibuat (${data.metadata?.totalRecords || auditLogs.length} data). Tersinkron ke Google Drive.`,
        });
      } else {
        setBackupMessage({
          type: "error",
          text: data.message || "Gagal membuat cadangan ke Google Drive.",
        });
      }
    } catch {
      setBackupMessage({
        type: "error",
        text: "Koneksi ke server gagal saat proses pencadangan.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Filter logs berdasarkan search, kategori, dan severity
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Filter Kategori
      if (selectedCategory !== "ALL") {
        const cat = (log.kategori || "").toUpperCase();
        if (selectedCategory === "OTENTIKASI" && !cat.includes("OTENTIKASI") && !log.aksi.includes("LOGIN")) return false;
        if (selectedCategory === "DATA_PEMILIH" && !cat.includes("PEMILIH") && !log.aksi.includes("PEMILIH") && !log.aksi.includes("DPS") && !log.aksi.includes("DPT")) return false;
        if (selectedCategory === "COKLIT" && !cat.includes("COKLIT") && !log.aksi.includes("COKLIT")) return false;
        if (selectedCategory === "PETUGAS" && !cat.includes("PETUGAS") && !cat.includes("ANGGOTA") && !log.aksi.includes("PETUGAS")) return false;
        if (selectedCategory === "TPS" && !cat.includes("TPS") && !log.aksi.includes("TPS")) return false;
        if (selectedCategory === "ADUAN" && !cat.includes("ADUAN") && !cat.includes("TANGGAPAN") && !log.aksi.includes("ADUAN")) return false;
        if (selectedCategory === "BACKUP" && !cat.includes("CADANGAN") && !cat.includes("GDRIVE") && !log.aksi.includes("BACKUP")) return false;
      }

      // Filter Severity
      if (selectedSeverity !== "ALL") {
        if ((log.severity || "INFO") !== selectedSeverity) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = (log.user || "").toLowerCase().includes(q);
        const matchAksi = (log.aksi || "").toLowerCase().includes(q);
        const matchTarget = (log.target || "").toLowerCase().includes(q);
        const matchDetail = (log.detail || "").toLowerCase().includes(q);
        const matchIp = (log.ipAddress || "").toLowerCase().includes(q);
        const matchId = (log.id || "").toLowerCase().includes(q);
        if (!matchUser && !matchAksi && !matchTarget && !matchDetail && !matchIp && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, selectedCategory, selectedSeverity, searchQuery]);

  const startIdx = (currentPage - 1) * pageSize;
  const pagedLogs = filteredLogs.slice(startIdx, startIdx + pageSize);

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            CRITICAL
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header with GDrive 48-Hour Integration */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-xl rounded-3xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full"
              >
                Log Rekam Jejak Forensik P2KD
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                • {auditLogs.length} Total Aktivitas Terekam
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Immutable & SHA-256 Verified
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <History className="w-6 h-6 text-blue-400" />
              Rincian Log Aktivitas Pengguna & Audit Trail
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
              Seluruh rekam jejak aksi operator, mutasi data pemilih, pendaftaran petugas, penugasan wilayah, dan penguncian pleno tersimpan permanen tanpa celah modifikasi, serta otomatis terbackup ke Google Drive resmi setiap 48 jam.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleTriggerBackupNow}
              disabled={isBackingUp}
              type="button"
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              title="Cadangkan log audit ke Google Drive sekarang"
            >
              {isBackingUp ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CloudUpload className="w-4 h-4 text-white" />
              )}
              <span>{isBackingUp ? "Mencadangkan..." : "Cadangkan ke GDrive"}</span>
            </button>

            <a
              href={GDRIVE_CONFIG.FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm cursor-pointer"
              title="Buka Folder Google Drive Resmi Cadangan P2KD"
            >
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Buka GDrive</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="/api/admin/audit/backup"
              download
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm cursor-pointer"
              title="Unduh Berkas Arsip Cadangan (.json)"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Arsip (.json)</span>
            </a>

            <a
              href="/api/admin/export?type=AUDIT"
              download
              title="Unduh Log Audit Excel (.xlsx)"
            >
              <button
                type="button"
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Excel</span>
              </button>
            </a>
          </div>
        </div>

        {/* 48-Hour Automated Google Drive Backup Banner */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Siklus Backup Otomatis
              </div>
              <div className="text-white font-bold text-xs flex items-center gap-1.5">
                <span>Setiap 48 Jam Sekali</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                  AKTIF
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Cadangan Terakhir
              </div>
              <div className="text-white font-bold text-xs">
                {backupSchedule.lastBackupFormatted}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Folder GDrive Resmi
              </div>
              <a
                href={GDRIVE_CONFIG.FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-white font-mono text-[11px] truncate block underline decoration-blue-500/50"
                title={GDRIVE_CONFIG.FOLDER_ID}
              >
                .../{GDRIVE_CONFIG.FOLDER_ID.substring(0, 16)}...
              </a>
            </div>
          </div>
        </div>

        {/* Feedback message banner */}
        {backupMessage && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs flex items-center justify-between gap-3 ${
              backupMessage.type === "success"
                ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/80 border border-rose-500/50 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {backupMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{backupMessage.text}</span>
            </div>
            <button
              onClick={() => setBackupMessage(null)}
              className="text-xs text-white/60 hover:text-white underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </Card>

      {/* Forensic Search & Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-xs rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama user, aksi, target, detail, atau IP..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Semua Tingkat (Severity)</option>
              <option value="CRITICAL">Tingkat Krusial (CRITICAL)</option>
              <option value="WARNING">Tingkat Peringatan (WARNING)</option>
              <option value="INFO">Informasi Biasa (INFO)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Kategori:
          </span>
          {[
            { id: "ALL", label: "Semua Aktivitas" },
            { id: "OTENTIKASI", label: "Otentikasi & Login" },
            { id: "DATA_PEMILIH", label: "Data Pemilih & DPT" },
            { id: "COKLIT", label: "Coklit Lapangan" },
            { id: "PETUGAS", label: "Petugas / Anggota" },
            { id: "TPS", label: "Struktur TPS" },
            { id: "ADUAN", label: "Aduan Masyarakat" },
            { id: "BACKUP", label: "Backup 48H GDrive" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden bg-white border-slate-200 shadow-xs rounded-2xl">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Rekam Jejak Digital Terperinci
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredLogs.length} catatan aktivitas
            </span>
          </div>
        </div>

        {/* Content list */}
        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Tidak ada log aktivitas yang cocok dengan filter atau pencarian saat ini.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                  setSelectedSeverity("ALL");
                }}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            pagedLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLogForDetail(log)}
                className="p-4 hover:bg-blue-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                title="Klik untuk melihat rincian mendalam aktivitas ini"
              >
                {/* Left side: Action code, severity, target, detail */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {log.aksi}
                    </span>
                    {getSeverityBadge(log.severity)}
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-900 text-xs truncate max-w-xs">
                      {log.target || log.entity || "SYSTEM"}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                    {log.detail}
                  </p>

                  {/* Forensic pills */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-slate-500">
                      IP: <strong>{log.ipAddress || "127.0.0.1"}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Monitor className="w-3 h-3 text-slate-400" />
                      {log.device || "Desktop Terminal"}
                    </span>
                  </div>
                </div>

                {/* Right side: Timestamp, User & Action Button */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 space-y-1 gap-2">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700 flex items-center md:justify-end gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{log.waktu}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center md:justify-end gap-1 mt-0.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>
                        <strong className="text-slate-800">{log.user}</strong> ({log.role})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLogForDetail(log);
                    }}
                    className="px-3 py-1 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Rincian</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <PaginationControl
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>
      </Card>

      {/* Modal Rincian Forensik Aktivitas */}
      <ModalAuditDetail
        log={selectedLogForDetail}
        isOpen={!!selectedLogForDetail}
        onClose={() => setSelectedLogForDetail(null)}
      />
    </div>
  );
};
