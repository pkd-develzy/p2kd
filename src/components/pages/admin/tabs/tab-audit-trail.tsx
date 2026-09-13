"use client";

import React, { useState } from "react";
import { FileSpreadsheet, ShieldCheck, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, PaginationControl } from "@/components/ui";
import { AuditLog } from "../types";

interface TabAuditTrailProps {
  auditLogs: AuditLog[];
}

export const TabAuditTrail: React.FC<TabAuditTrailProps> = ({ auditLogs }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const startIdx = (currentPage - 1) * pageSize;
  const pagedLogs = auditLogs.slice(startIdx, startIdx + pageSize);

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full"
              >
                Log Rekam Jejak Sistem
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                • {auditLogs.length} Aktivitas Terekam
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <History className="w-6 h-6 text-blue-400" />
              Audit Trail & Rekam Jejak Aktivitas
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Seluruh mutasi data pemilih, pendaftaran calon, pergantian status, login petugas, dan penguncian DPT tercatat permanen (*immutable*) demi transparansi dan akuntabilitas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a href="/api/admin/export?type=AUDIT" download title="Unduh Log Audit (.xlsx)">
              <button
                type="button"
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Ekspor Excel Audit</span>
              </button>
            </a>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden bg-white border-slate-200 shadow-sm rounded-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Rincian Log Aktivitas Pengguna</span>
          </h3>
          <Badge variant="primary" className="text-[10px]">
            {auditLogs.length} Log Terkini
          </Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada catatan aktivitas audit.
            </div>
          ) : (
            pagedLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between text-xs gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-blue-700">
                      {log.aksi}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-800">{log.target}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.detail}</p>
                </div>

                <div className="text-right shrink-0 space-y-0.5">
                  <div className="text-[11px] font-medium text-slate-500">{log.waktu}</div>
                  <div className="text-[10px] text-slate-400">
                    Oleh: <strong className="text-slate-700">{log.user}</strong> ({log.role})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-4 pb-4">
          <PaginationControl
            currentPage={currentPage}
            totalItems={auditLogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
          />
        </div>
      </Card>
    </div>
  );
};
