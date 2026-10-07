"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckSquare, Square, Edit, ArrowRightLeft, UserX, Trash2, UserCheck, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Voter } from "@/components/pages/admin/types";

interface VirtualVoterTableProps {
  voters: Voter[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenEditVoter: (v: Voter) => void;
  onOpenMutasi: (v: Voter) => void;
  onOpenTms: (v: Voter) => void;
  onDeleteVoter: (v: Voter) => void;
  onPromoteToDpt?: (ids: string[]) => void;
  onRollbackToDps?: (ids: string[]) => void;
  isAdmin?: boolean;
  startIdx?: number;
  mode?: "DPS" | "DPT";
  height?: number | string;
}

export const VirtualVoterTable: React.FC<VirtualVoterTableProps> = ({
  voters,
  selectedIds,
  onToggleSelect,
  onOpenEditVoter,
  onOpenMutasi,
  onOpenTms,
  onDeleteVoter,
  onPromoteToDpt,
  onRollbackToDps,
  isAdmin = true,
  startIdx = 0,
  mode = "DPS",
  height = 560,
}) => {
  "use no memo";
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: voters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
    overscan: 5,
  });

  if (voters.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      className="overflow-auto border-t border-slate-100 relative will-change-scroll"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const p = voters[virtualRow.index];
          if (!p) return null;

          const isSelected = selectedIds.includes(p.id);
          const rtNum = (p.rt || "01").replace(/\D/g, "").padStart(2, "0");
          const rwNum = (p.rw || "01").replace(/\D/g, "").padStart(2, "0");
          const wilayahRwDisplay = `Wilayah RW ${rwNum}`;
          const maskedNikDisplay =
            p.nikMasked || (p.nik ? `${p.nik.slice(0, 1)}*************${p.nik.slice(-2)}` : "****************");
          const maskedKkDisplay = p.kk ? `${p.kk.slice(0, 1)}*************${p.kk.slice(-2)}` : "-";
          const isLaki = String(p.jenisKelamin).toUpperCase().startsWith("L");

          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`flex items-center text-xs border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${
                isSelected ? "bg-blue-50/60" : ""
              }`}
            >
              {/* Checkbox */}
              <div className="w-10 text-center shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleSelect(p.id)}
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              </div>

              {/* No */}
              <div className="w-12 text-center text-slate-400 font-semibold shrink-0">
                {startIdx + virtualRow.index + 1}
              </div>

              {/* NIK */}
              <div className="w-44 px-3 font-mono font-bold text-slate-900 shrink-0 truncate">
                {maskedNikDisplay}
                <div className="text-[10px] text-slate-400 font-normal">KK: {maskedKkDisplay}</div>
              </div>

              {/* Nama & JK */}
              <div className="flex-1 min-w-45 px-3 truncate">
                <div className="font-bold text-slate-900 truncate">{p.namaLengkap}</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {isLaki ? "Laki-laki" : "Perempuan"} • Lahir: {p.tempatLahir}, {p.tanggalLahir}
                </div>
              </div>

              {/* Domisili */}
              <div className="w-36 px-3 shrink-0 truncate">
                <div className="font-semibold text-slate-900">
                  RT {rtNum} / RW {rwNum}
                </div>
                <div className="text-[10px] text-slate-500 truncate">Desa Kalisalak</div>
              </div>

              {/* RW */}
              <div className="w-32 px-3 shrink-0 text-center">
                <Badge variant="primary" className="text-[11px] font-bold">
                  {wilayahRwDisplay}
                </Badge>
              </div>

              {/* Status */}
              <div className="w-32 px-3 shrink-0 text-center">
                {p.statusAktif === "TMS" ? (
                  <Badge variant="danger" className="text-[10px] font-bold">
                    TMS: {p.alasanTms || "Tidak Memenuhi"}
                  </Badge>
                ) : p.coklitStatus === "SESUAI" ? (
                  <Badge variant="success" className="text-[10px] font-bold">
                    ✓ Sesuai
                  </Badge>
                ) : p.coklitStatus === "UBAH_DATA" ? (
                  <Badge variant="warning" className="text-[10px] font-bold">
                    Koreksi
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-[10px] font-bold">
                    {mode === "DPT" ? "DPT Tetap" : "Calon DPS"}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="w-36 px-3 shrink-0 flex items-center justify-center gap-1">
                {/* Promote to DPT in DPS mode */}
                {mode === "DPS" && onPromoteToDpt && p.statusAktif === "AKTIF" && (
                  <button
                    type="button"
                    onClick={() => onPromoteToDpt([p.id])}
                    title="Verifikasi & Pindahkan Masuk ke DPT"
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Rollback to DPS in DPT mode */}
                {mode === "DPT" && onRollbackToDps && (
                  <button
                    type="button"
                    onClick={() => onRollbackToDps([p.id])}
                    title="Kembalikan ke DPS (Perbaikan Data)"
                    className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenEditVoter(p)}
                  title="Koreksi Data"
                  className="h-7 w-7 p-0 text-slate-600 hover:text-blue-600"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenMutasi(p)}
                  title="Pindah Wilayah TPS"
                  className="h-7 w-7 p-0 text-slate-600 hover:text-amber-600"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenTms(p)}
                  title="Tandai TMS"
                  className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                >
                  <UserX className="w-3.5 h-3.5" />
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteVoter(p)}
                    title="Hapus Pemilih"
                    className="h-7 w-7 p-0 text-slate-600 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
