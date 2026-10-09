"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  CheckSquare,
  Square,
  Edit,
  ArrowRightLeft,
  UserX,
  Trash2,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Voter } from "@/components/pages/admin/types";
import { formatNamaGelar } from "@/lib/nama-gelar";

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
  viewMode?: "auto" | "desktop" | "mobile";
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
  height = 560,
  viewMode = "auto",
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

  // 1. DESKTOP SPREADSHEET TABLE ROW RENDERER
  const renderDesktopTable = () => (
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
            p.nikMasked ||
            (p.nik
              ? `${p.nik.slice(0, 1)}*************${p.nik.slice(-2)}`
              : "****************");
          const maskedKkDisplay = p.kk
            ? `${p.kk.slice(0, 1)}*************${p.kk.slice(-2)}`
            : "-";
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
                <div className="text-[10px] text-slate-400 font-normal">
                  KK: {maskedKkDisplay}
                </div>
              </div>

              {/* Nama & JK */}
              <div className="flex-1 min-w-45 px-3 truncate">
                <div className="font-bold text-slate-900 truncate">
                  {formatNamaGelar(p.namaLengkap)}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {isLaki ? "Laki-laki" : "Perempuan"} • Lahir: {p.tempatLahir},{" "}
                  {p.tanggalLahir}
                </div>
              </div>

              {/* Domisili */}
              <div className="w-36 px-3 shrink-0 truncate">
                <div className="font-semibold text-slate-900">
                  RT {rtNum} / RW {rwNum}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Desa Kalisalak
                </div>
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
                ) : p.tahap === "DPT" ? (
                  <Badge variant="success" className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border-emerald-300">
                    DPT Tetap
                  </Badge>
                ) : p.tahap === "DPSHP" ? (
                  <Badge variant="info" className="text-[10px] font-bold bg-teal-100 text-teal-800 border-teal-300">
                    DPSHP
                  </Badge>
                ) : p.tahap === "DPS" ? (
                  <Badge variant="warning" className="text-[10px] font-bold bg-amber-100 text-amber-800 border-amber-300">
                    DPS (Pleno)
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-[10px] font-bold bg-blue-100 text-blue-800 border-blue-300">
                    Calon DPS
                  </Badge>
                )}
                {p.sumberData === "DPTB" && (
                  <span className="block mt-0.5 text-[9px] font-black text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                    Sumber: DPTb
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="w-36 px-3 shrink-0 flex items-center justify-center gap-1">
                {/* Stage-aware Action Button */}
                {p.tahap === "DPT" ? (
                  onRollbackToDps && (
                    <button
                      type="button"
                      onClick={() => onRollbackToDps([p.id])}
                      title="Kembalikan ke DPSHP"
                      className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-300 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )
                ) : (
                  onPromoteToDpt && p.statusAktif === "AKTIF" && (
                    <button
                      type="button"
                      onClick={() => onPromoteToDpt([p.id])}
                      title={
                        p.tahap === "DPSHP"
                          ? "Pleno Final: Sahkan Masuk ke DPT"
                          : p.tahap === "DPS"
                          ? "Usulkan ke DPSHP (Hasil Pembenahan)"
                          : "Pleno Penetapan: Masuk ke DPS"
                      }
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                        p.tahap === "DPSHP"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-300"
                          : p.tahap === "DPS"
                          ? "bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border-teal-300"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-blue-300"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  )
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenEditVoter(p)}
                  title="Koreksi Data"
                  className="h-7 w-7 p-0 text-slate-600 hover:text-blue-600 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenMutasi(p)}
                  title="Pindah Wilayah TPS"
                  className="h-7 w-7 p-0 text-slate-600 hover:text-amber-600 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenTms(p)}
                  title="Tandai TMS"
                  className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600 cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteVoter(p)}
                    title="Hapus Pemilih"
                    className="h-7 w-7 p-0 text-slate-600 hover:text-rose-700 cursor-pointer"
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

  // 2. MOBILE NATIVE VOTER CARD RENDERER (100% Full-Width, Nol Scroll Kanan-Kiri)
  const renderMobileCards = () => (
    <div className="space-y-3 w-full">
      {voters.map((p, idx) => {
        const isSelected = selectedIds.includes(p.id);
        const rtNum = (p.rt || "01").replace(/\D/g, "").padStart(2, "0");
        const rwNum = (p.rw || "01").replace(/\D/g, "").padStart(2, "0");
        const maskedNikDisplay =
          p.nikMasked ||
          (p.nik
            ? `${p.nik.slice(0, 1)}*************${p.nik.slice(-2)}`
            : "****************");
        const maskedKkDisplay = p.kk
          ? `${p.kk.slice(0, 1)}*************${p.kk.slice(-2)}`
          : "-";
        const isLaki = String(p.jenisKelamin).toUpperCase().startsWith("L");

        return (
          <div
            key={p.id}
            className={`w-full p-3.5 sm:p-4 rounded-2xl bg-white border transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-50/25 ring-2 ring-blue-500/20 shadow-xs"
                : "border-slate-200 shadow-2xs hover:border-slate-300"
            }`}
          >
            {/* 1. Header Bar: Checkbox + No. Urut + Wilayah RW/RT + Status Badge */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleSelect(p.id)}
                  className="p-1 -m-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title={isSelected ? "Batal Pilih" : "Pilih Pemilih"}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  #{startIdx + idx + 1}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  RW {rwNum} • RT {rtNum}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {p.statusAktif === "TMS" ? (
                  <Badge variant="danger" className="text-[10px] font-bold">
                    TMS: {p.alasanTms || "Tidak Memenuhi"}
                  </Badge>
                ) : p.tahap === "DPT" ? (
                  <Badge variant="success" className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border-emerald-300">
                    DPT Tetap
                  </Badge>
                ) : p.tahap === "DPSHP" ? (
                  <Badge variant="info" className="text-[10px] font-bold bg-teal-100 text-teal-800 border-teal-300">
                    DPSHP
                  </Badge>
                ) : p.tahap === "DPS" ? (
                  <Badge variant="warning" className="text-[10px] font-bold bg-amber-100 text-amber-800 border-amber-300">
                    DPS (Pleno)
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-[10px] font-bold bg-blue-100 text-blue-800 border-blue-300">
                    Calon DPS
                  </Badge>
                )}
                {p.sumberData === "DPTB" && (
                  <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                    DPTb
                  </span>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onDeleteVoter(p)}
                    className="w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center active:scale-95 transition-all cursor-pointer ml-1"
                    title="Hapus Pemilih"
                    aria-label="Hapus Pemilih"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Identitas Pemilih: Nama Balok, Gender & Tanggal Lahir */}
            <div className="pt-2.5 space-y-1">
              <div className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                {formatNamaGelar(p.namaLengkap)}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 font-medium">
                <span
                  className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    isLaki
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "bg-pink-50 text-pink-700 border border-pink-200"
                  }`}
                >
                  {isLaki ? "Laki-laki" : "Perempuan"}
                </span>
                <span>•</span>
                <span>
                  Lahir: {p.tempatLahir}, {p.tanggalLahir}
                </span>
              </div>
            </div>

            {/* 3. Nomor Dokumen (Proteksi NIK & KK) */}
            <div className="mt-2.5 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 text-[11px] font-mono">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">
                  NIK Sensor
                </span>
                <span className="font-bold text-slate-800 tracking-tight">
                  {maskedNikDisplay}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">
                  Nomor KK
                </span>
                <span className="text-slate-600 tracking-tight">
                  {maskedKkDisplay}
                </span>
              </div>
            </div>

            {/* 4. Touch-Friendly Action Buttons: Balanced 2x2 Grid with Zero Empty Space */}
            <div className="pt-3 grid grid-cols-2 gap-2 border-t border-slate-100">
              {/* Tombol 1: Transisi Tahap Sesuai Status Aktual */}
              {p.tahap === "DPT" ? (
                <button
                  type="button"
                  disabled={!onRollbackToDps}
                  onClick={() => onRollbackToDps?.([p.id])}
                  className="w-full h-10 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Ke DPSHP</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={p.statusAktif !== "AKTIF" || !onPromoteToDpt}
                  onClick={() => onPromoteToDpt?.([p.id])}
                  className={`w-full h-10 px-3 rounded-xl disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer ${
                    p.tahap === "DPSHP"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : p.tahap === "DPS"
                      ? "bg-teal-600 hover:bg-teal-500"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {p.tahap === "DPSHP" ? "Masuk DPT" : p.tahap === "DPS" ? "Usul DPSHP" : "Tetapkan DPS"}
                  </span>
                </button>
              )}

              {/* Tombol 2: Koreksi Data */}
              <button
                type="button"
                onClick={() => onOpenEditVoter(p)}
                className="w-full h-10 px-3 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Koreksi</span>
              </button>

              {/* Tombol 3: Mutasi TPS */}
              <button
                type="button"
                onClick={() => onOpenMutasi(p)}
                className="w-full h-10 px-3 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Mutasi</span>
              </button>

              {/* Tombol 4: TMS */}
              <button
                type="button"
                onClick={() => onOpenTms(p)}
                className="w-full h-10 px-3 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">TMS</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (viewMode === "desktop") {
    return renderDesktopTable();
  }

  if (viewMode === "mobile") {
    return renderMobileCards();
  }

  // viewMode === "auto" -> Responsive Dual-Mode
  return (
    <>
      <div className="hidden md:block w-full">{renderDesktopTable()}</div>
      <div className="block md:hidden w-full">{renderMobileCards()}</div>
    </>
  );
};
