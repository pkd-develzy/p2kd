"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  ArrowRightLeft,
  UserX,
  Trash2,
  Users,
  UserCheck,
  RotateCcw,
  CheckSquare,
  Square,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge, PaginationControl } from "@/components/ui";
import { Voter, TPSItem } from "../types";

interface TabMasterPemilihProps {
  mode?: "DPS" | "DPT";
  voters: Voter[];
  tpsList: TPSItem[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectedTpsFilter: string;
  setSelectedTpsFilter: (tps: string) => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;
  isAdmin?: boolean;
  assignedTps?: string;
  onOpenAddVoter: () => void;
  onOpenEditVoter: (v: Voter) => void;
  onOpenMutasi: (v: Voter) => void;
  onOpenTms: (v: Voter) => void;
  onDeleteVoter: (v: Voter) => void;
  onPromoteToDpt?: (ids: string[]) => void;
  onRollbackToDps?: (ids: string[]) => void;
}

export const TabMasterPemilih: React.FC<TabMasterPemilihProps> = ({
  mode = "DPS",
  voters,
  tpsList,
  searchTerm,
  setSearchTerm,
  selectedTpsFilter,
  setSelectedTpsFilter,
  selectedStatusFilter,
  setSelectedStatusFilter,
  isAdmin = true,
  onOpenAddVoter,
  onOpenEditVoter,
  onOpenMutasi,
  onOpenTms,
  onDeleteVoter,
  onPromoteToDpt,
  onRollbackToDps,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Filter by Mode (DPS vs DPT)
  const modeFilteredVoters = voters.filter((v) => {
    if (mode === "DPT") {
      return v.tahap === "DPT";
    } else {
      return v.tahap !== "DPT"; // Default to DPS
    }
  });

  // 2. Ultra-Fast Instant Client-side Filter (< 1ms across loaded rows)
  const filteredVoters = modeFilteredVoters.filter((v) => {
    // Status Filter
    if (selectedStatusFilter !== "SEMUA" && v.statusAktif !== selectedStatusFilter) return false;

    // Wilayah RW Filter
    if (selectedTpsFilter !== "SEMUA") {
      const rwTarget = selectedTpsFilter.replace(/\D/g, "");
      const matchRw = v.rw && v.rw.replace(/\D/g, "") === rwTarget;
      const matchTps = v.tps && v.tps.toLowerCase().includes(selectedTpsFilter.toLowerCase());
      if (!matchRw && !matchTps) return false;
    }

    // Search Query (NIK, Nama, KK, RT/RW, Alamat)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = v.namaLengkap.toLowerCase().includes(q);
      const matchNik = v.nik.includes(q);
      const matchKk = v.kk ? v.kk.includes(q) : false;
      const matchAlamat = v.alamat ? v.alamat.toLowerCase().includes(q) : false;
      const matchRt = v.rt ? `rt ${v.rt}`.includes(q) || v.rt.includes(q) : false;
      const matchRw = v.rw ? `rw ${v.rw}`.includes(q) || v.rw.includes(q) : false;
      if (!matchName && !matchNik && !matchKk && !matchAlamat && !matchRt && !matchRw) return false;
    }

    return true;
  });

  const activeCount = filteredVoters.filter((v) => v.statusAktif === "AKTIF").length;
  const tmsCount = filteredVoters.filter((v) => v.statusAktif === "TMS").length;
  const lakiCount = filteredVoters.filter((v) => v.statusAktif === "AKTIF" && String(v.jenisKelamin).toUpperCase().startsWith("L")).length;
  const perempuanCount = filteredVoters.filter((v) => v.statusAktif === "AKTIF" && !String(v.jenisKelamin).toUpperCase().startsWith("L")).length;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = Math.max(1, Math.ceil(filteredVoters.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIdx = (activePage - 1) * pageSize;
  const pagedVoters = filteredVoters.slice(startIdx, startIdx + pageSize);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPaged = () => {
    const pagedIds = pagedVoters.map((v) => v.id);
    const allSelected = pagedIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pagedIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pagedIds])));
    }
  };

  const handlePromoteSelected = async () => {
    if (selectedIds.length === 0 || !onPromoteToDpt) return;
    setIsProcessing(true);
    try {
      await onPromoteToDpt(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRollbackSelected = async () => {
    if (selectedIds.length === 0 || !onRollbackToDps) return;
    setIsProcessing(true);
    try {
      await onRollbackToDps(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <Card
        className={`p-6 text-white border shadow-xl rounded-3xl ${
          mode === "DPT"
            ? "bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border-emerald-900/60"
            : "bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 border-blue-900/60"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="primary"
                className={`text-[10px] uppercase font-bold px-3 py-0.5 rounded-full ${
                  mode === "DPT"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }`}
              >
                {mode === "DPT" ? "1.2 DAFTAR PEMILIH TETAP (DPT)" : "1.1 DAFTAR PEMILIH SEMENTARA (DPS)"}
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                • {activeCount} Pemilih Aktif ({lakiCount} L • {perempuanCount} P) • {tmsCount} TMS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              {mode === "DPT" ? (
                <>
                  <UserCheck className="w-6 h-6 text-emerald-400" />
                  Daftar Pemilih Tetap (DPT) Terverifikasi Sah
                </>
              ) : (
                <>
                  <Users className="w-6 h-6 text-amber-400" />
                  Daftar Pemilih Sementara (DPS) - Tahap Verifikasi & Coklit
                </>
              )}
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed font-normal">
              {mode === "DPT"
                ? "Daftar pemilih ini berisi warga yang telah lolos verifikasi faktual lapangan dan telah disahkan masuk ke DPT. Data pemilih di sini siap ditetapkan pada Sidang Pleno DPT Pilkades Kalisalak."
                : "Daftar pemilih sementara yang sedang dalam proses pencocokan dan penelitian door-to-door. Pemilih yang sudah diverifikasi dapat langsung dipindahkan ke Daftar Pemilih Tetap (DPT)."}
            </p>
          </div>
        </div>
      </Card>

      {/* Filter & Action Toolbar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Cari nama, NIK, No. KK, atau alamat di ${mode === "DPT" ? "DPT" : "DPS"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Wilayah RW */}
            {isAdmin && (
              <select
                value={selectedTpsFilter}
                onChange={(e) => setSelectedTpsFilter(e.target.value)}
                className="h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="SEMUA">Semua Wilayah RW (13 Wilayah RW)</option>
                {tpsList.map((t) => (
                  <option key={t.id} value={t.nomorTps}>
                    {t.namaTps} ({t.lokasi})
                  </option>
                ))}
              </select>
            )}

            {/* Filter Status Aktif/TMS */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="SEMUA">Semua Status (Aktif & TMS)</option>
              <option value="AKTIF">Hanya Pemilih Aktif</option>
              <option value="TMS">Hanya Pemilih TMS</option>
            </select>

            {/* Bulk Actions Button */}
            {mode === "DPS" && selectedIds.length > 0 && onPromoteToDpt && (
              <Button
                variant="primary"
                size="sm"
                onClick={handlePromoteSelected}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md animate-bounce"
              >
                <UserCheck className="w-4 h-4 mr-1.5" />
                Verifikasi {selectedIds.length} Terpilih $\to$ Masuk DPT
              </Button>
            )}

            {mode === "DPT" && selectedIds.length > 0 && onRollbackToDps && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRollbackSelected}
                disabled={isProcessing}
                className="text-amber-700 border-amber-400 hover:bg-amber-50 font-bold text-xs shadow-sm"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Kembalikan {selectedIds.length} Terpilih ke DPS
              </Button>
            )}

            {/* Tambah Pemilih Button */}
            {mode === "DPS" && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAddVoter}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah Pemilih Baru
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table of Voters */}
      <Card className="overflow-hidden bg-white border-slate-200 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleSelectAllPaged}
                    title="Pilih Semua di Halaman Ini"
                    className="p-1 text-slate-500 hover:text-slate-800"
                  >
                    {pagedVoters.length > 0 && pagedVoters.every((v) => selectedIds.includes(v.id)) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4">NIK (Sensor Proteksi)</th>
                <th className="py-3 px-4">Nama Lengkap & JK</th>
                <th className="py-3 px-4">Wilayah / Domisili</th>
                <th className="py-3 px-4">Wilayah RW</th>
                <th className="py-3 px-4 text-center">Status Tahap</th>
                <th className="py-3 px-4 text-center">Aksi Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <div>
                        Tidak ada data pemilih yang berada di <strong>{mode === "DPT" ? "DPT" : "DPS"}</strong> untuk kriteria pencarian ini.
                      </div>
                      {mode === "DPT" && (
                        <p className="text-xs text-slate-400">
                          Silakan verifikasi data dari menu <strong>1.1 Daftar Pemilih Sementara (DPS)</strong> terlebih dahulu.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pagedVoters.map((p, idx) => {
                  const isSelected = selectedIds.includes(p.id);
                  const rtNum = (p.rt || "01").replace(/\D/g, "").padStart(2, "0");
                  const rwNum = (p.rw || "01").replace(/\D/g, "").padStart(2, "0");
                  const mejaName = p.tps && p.tps.trim()
                    ? p.tps.replace(/Meja\s*/gi, "")
                    : `RW ${rwNum}`;
                  const maskedNikDisplay = p.nikMasked || (p.nik ? `${p.nik.slice(0, 1)}*************${p.nik.slice(-2)}` : "****************");
                  const maskedKkDisplay = p.kk ? `${p.kk.slice(0, 1)}*************${p.kk.slice(-2)}` : "-";
                  const isLaki = String(p.jenisKelamin).toUpperCase().startsWith("L");

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-blue-50/60" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(p.id)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">{startIdx + idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {maskedNikDisplay}
                        <div className="text-[10px] text-slate-400 font-normal">KK: {maskedKkDisplay}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.namaLengkap}</div>
                        <div className="text-[10px] text-slate-500">
                          {isLaki ? "Laki-laki" : "Perempuan"} • Lahir: {p.tempatLahir}, {p.tanggalLahir}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">RT {rtNum} / RW {rwNum}</div>
                        <div className="text-[10px] text-slate-500">Desa Kalisalak</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="primary" className="text-[11px] font-bold">
                          {mejaName}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.statusAktif === "AKTIF" ? (
                          mode === "DPT" ? (
                            <Badge variant="success" className="text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Sah di DPT
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px] font-bold">
                              Draft DPS
                            </Badge>
                          )
                        ) : (
                          <Badge variant="danger" className="text-[10px]">
                            TMS ({p.alasanTms || "TIDAK MEMENUHI"})
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Verifikasi Masuk DPT (in DPS mode) */}
                          {mode === "DPS" && onPromoteToDpt && p.statusAktif === "AKTIF" && (
                            <button
                              onClick={() => onPromoteToDpt([p.id])}
                              title="Verifikasi & Pindahkan Masuk ke DPT"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Kembalikan ke DPS (in DPT mode) */}
                          {mode === "DPT" && onRollbackToDps && (
                            <button
                              onClick={() => onRollbackToDps([p.id])}
                              title="Kembalikan ke DPS (Perbaikan Data)"
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-300 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Koreksi Data */}
                          <button
                            onClick={() => onOpenEditVoter(p)}
                            title="Koreksi Data"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Mutasi RW */}
                          <button
                            onClick={() => onOpenMutasi(p)}
                            title="Pindah Wilayah RW"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* TMS */}
                          {p.statusAktif === "AKTIF" && (
                            <button
                              onClick={() => onOpenTms(p)}
                              title="Tandai TMS (Meninggal/Pindah)"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Hapus */}
                          {isAdmin && (
                            <button
                              onClick={() => onDeleteVoter(p)}
                              title="Hapus Permanen (Superadmin)"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-100 hover:text-rose-800 hover:border-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <PaginationControl
            currentPage={activePage}
            totalItems={filteredVoters.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      </Card>
    </div>
  );
};
