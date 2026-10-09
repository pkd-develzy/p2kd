"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  RotateCcw,
  CheckSquare,
  Square,
  LayoutGrid,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge, PaginationControl } from "@/components/ui";
import { Voter, TPSItem, DbStatus } from "../types";
import { VirtualVoterTable } from "@/features/pemilih/components/virtual-voter-table";
import { useDebounce } from "@/hooks/use-debounce";

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
  dbStatus?: DbStatus | null;
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
  assignedTps,
  dbStatus,
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
  const [selectedStage, setSelectedStage] = useState<"SEMUA" | "CALON_DPS" | "DPS" | "DPSHP" | "DPT" | "DPTB">("SEMUA");

  // Local debounced search for ultra-smooth 60 FPS input experience
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const debouncedSearch = useDebounce(localSearch, 300);

  // Sync debounced search back to parent
  React.useEffect(() => {
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, setSearchTerm]);

  // 1. Filter by Mode (DPS vs DPT)
  const modeFilteredVoters = voters.filter((v) => {
    if (mode === "DPT") {
      return v.tahap === "DPT";
    } else {
      return v.tahap !== "DPT"; // Calon DPS, DPS, DPSHP
    }
  });

  // Base Scoped Voters for 4-Stage Grid Statistics
  const baseScopedVoters = voters.filter((v) => {
    if (selectedTpsFilter !== "SEMUA") {
      const rwTarget = selectedTpsFilter.replace(/\D/g, "");
      const matchRw = v.rw && v.rw.replace(/\D/g, "") === rwTarget;
      const matchTps = v.tps && v.tps.toLowerCase().includes(selectedTpsFilter.toLowerCase());
      if (!matchRw && !matchTps) return false;
    }
    return true;
  });

  const isDefaultView = !localSearch.trim() && selectedTpsFilter === "SEMUA" && selectedStatusFilter === "SEMUA" && selectedStage === "SEMUA" && (!assignedTps || isAdmin);

  // Jika DPS belum pernah diplenokan secara resmi di sistem (dbStatus.localStats.dps === 0),
  // maka seluruh data lapangan pra-pleno sah berstatus CALON_DPS.
  const isDpsEstablished = (dbStatus?.localStats?.dps ?? 0) > 0;

  const resolveVoterStage = (v: typeof baseScopedVoters[number]) => {
    if (!isDpsEstablished) {
      return v.tahap === "DPT" ? "DPT" : "CALON_DPS";
    }
    return (v.tahap || "CALON_DPS");
  };

  const calonDpsCount = isDefaultView && dbStatus?.localStats?.calonDps !== undefined
    ? dbStatus.localStats.calonDps
    : baseScopedVoters.filter((v) => resolveVoterStage(v) === "CALON_DPS").length;

  const dpsCount = isDefaultView && dbStatus?.localStats?.dps !== undefined
    ? dbStatus.localStats.dps
    : (!isDpsEstablished ? 0 : baseScopedVoters.filter((v) => v.tahap === "DPS").length);

  const dpshpCount = isDefaultView && dbStatus?.localStats?.dpshp !== undefined
    ? dbStatus.localStats.dpshp
    : baseScopedVoters.filter((v) => v.tahap === "DPSHP").length;

  const dptCount = isDefaultView && dbStatus?.localStats?.dpt !== undefined
    ? dbStatus.localStats.dpt
    : (voters.filter((v) => v.tahap === "DPT").length || (dbStatus?.localStats?.dpt ?? 0));

  const dptbCount = isDefaultView && dbStatus?.localStats?.dptb !== undefined
    ? dbStatus.localStats.dptb
    : voters.filter((v) => v.sumberData === "DPTB").length;

  // 2. Ultra-Fast Instant Client-side Filter (< 1ms across loaded rows)
  const filteredVoters = modeFilteredVoters.filter((v) => {
    // Stage Filter for Grid
    if (selectedStage !== "SEMUA") {
      const currentStage = resolveVoterStage(v);
      if (selectedStage === "CALON_DPS") {
        if (currentStage !== "CALON_DPS") return false;
      } else if (selectedStage === "DPS") {
        if (currentStage !== "DPS") return false;
      } else if (selectedStage === "DPSHP") {
        if (v.tahap !== "DPSHP") return false;
      } else if (selectedStage === "DPT") {
        if (v.tahap !== "DPT") return false;
      } else if (selectedStage === "DPTB") {
        if (v.sumberData !== "DPTB") return false;
      }
    }

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
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
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
            ? "bg-linear-to-r from-emerald-950 via-teal-950 to-slate-950 border-emerald-900/60"
            : "bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 border-blue-900/60"
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
                {mode === "DPT" ? "1.2 DAFTAR PEMILIH TETAP (DPT)" : "1.1 CALON DPS (DATA PEMILIH SAAT INI)"}
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
                  <Users className="w-6 h-6 text-blue-400" />
                  Daftar Calon DPS (Data Pemutakhiran Menuju DPS)
                </>
              )}
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed font-normal">
              {mode === "DPT"
                ? "Daftar pemilih ini berisi warga yang telah lolos verifikasi faktual lapangan dan telah disahkan masuk ke DPT. Data pemilih di sini siap ditetapkan pada Sidang Pleno DPT Pilkades Kalisalak."
                : "Daftar pemilih saat ini berstatus CALON DPS yang sedang dalam proses pencocokan dan penelitian door-to-door per lingkungan RW sebelum disahkan menjadi DPS, DPSHP, DPSHP Akhir, hingga DPT."}
            </p>
          </div>
        </div>
      </Card>

      {/* 2. GRID 4 TAHAPAN: CALON DPS - DPS - DPSHP - DPSHP Akhir */}
      {mode === "DPS" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
              <span>Tahapan Pemutakhiran Data Pemilih</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedStage(selectedStage === "DPTB" ? "SEMUA" : "DPTB")}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                  selectedStage === "DPTB"
                    ? "bg-purple-600 text-white border-purple-500 shadow-xs"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                }`}
              >
                DPTb: {dptbCount}
              </button>
              {selectedStage !== "SEMUA" && (
                <button
                  type="button"
                  onClick={() => setSelectedStage("SEMUA")}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* Stage 1: CALON DPS */}
            <button
              type="button"
              onClick={() => setSelectedStage(selectedStage === "CALON_DPS" ? "SEMUA" : "CALON_DPS")}
              className={`p-3.5 sm:p-4 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                selectedStage === "CALON_DPS"
                  ? "bg-linear-to-br from-blue-600 to-indigo-700 text-white border-blue-500 shadow-lg shadow-blue-600/30 scale-[1.02]"
                  : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${selectedStage === "CALON_DPS" ? "text-blue-200" : "text-blue-600"}`}>
                  Tahap 1
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedStage === "CALON_DPS" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>
                  Aktif Saat Ini
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black mt-2 tracking-tight">CALON DPS</div>
              <div className={`text-xl sm:text-2xl font-black mt-0.5 ${selectedStage === "CALON_DPS" ? "text-white" : "text-slate-900"}`}>
                {calonDpsCount}
              </div>
              <div className={`text-[10px] mt-1 truncate ${selectedStage === "CALON_DPS" ? "text-blue-200" : "text-slate-500"}`}>
                Data Pemilih Saat Ini
              </div>
            </button>

            {/* Stage 2: DPS */}
            <button
              type="button"
              onClick={() => setSelectedStage(selectedStage === "DPS" ? "SEMUA" : "DPS")}
              className={`p-3.5 sm:p-4 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                selectedStage === "DPS"
                  ? "bg-linear-to-br from-amber-600 to-orange-700 text-white border-amber-500 shadow-lg shadow-amber-600/30 scale-[1.02]"
                  : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${selectedStage === "DPS" ? "text-amber-200" : "text-amber-600"}`}>
                  Tahap 2
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedStage === "DPS" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"}`}>
                  Pleno Penetapan
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black mt-2 tracking-tight">DPS</div>
              <div className={`text-xl sm:text-2xl font-black mt-0.5 ${selectedStage === "DPS" ? "text-white" : "text-slate-900"}`}>
                {dpsCount}
              </div>
              <div className={`text-[10px] mt-1 truncate ${selectedStage === "DPS" ? "text-amber-200" : "text-slate-500"}`}>
                Daftar Pemilih Sementara
              </div>
            </button>

            {/* Stage 3: DPSHP */}
            <button
              type="button"
              onClick={() => setSelectedStage(selectedStage === "DPSHP" ? "SEMUA" : "DPSHP")}
              className={`p-3.5 sm:p-4 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                selectedStage === "DPSHP"
                  ? "bg-linear-to-br from-teal-600 to-emerald-700 text-white border-teal-500 shadow-lg shadow-teal-600/30 scale-[1.02]"
                  : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${selectedStage === "DPSHP" ? "text-teal-200" : "text-teal-600"}`}>
                  Tahap 3
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedStage === "DPSHP" ? "bg-white/20 text-white" : "bg-teal-50 text-teal-700"}`}>
                  Pembenahan Sah
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black mt-2 tracking-tight">DPSHP</div>
              <div className={`text-xl sm:text-2xl font-black mt-0.5 ${selectedStage === "DPSHP" ? "text-white" : "text-slate-900"}`}>
                {dpshpCount}
              </div>
              <div className={`text-[10px] mt-1 truncate ${selectedStage === "DPSHP" ? "text-teal-200" : "text-slate-500"}`}>
                Hasil Pembenahan Valid
              </div>
            </button>

            {/* Stage 4: DPT */}
            <button
              type="button"
              onClick={() => setSelectedStage(selectedStage === "DPT" ? "SEMUA" : "DPT")}
              className={`p-3.5 sm:p-4 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                selectedStage === "DPT"
                  ? "bg-linear-to-br from-indigo-600 to-purple-700 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 scale-[1.02]"
                  : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${selectedStage === "DPT" ? "text-indigo-200" : "text-indigo-600"}`}>
                  Tahap 4
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedStage === "DPT" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"}`}>
                  Pleno Final
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black mt-2 tracking-tight">DPT</div>
              <div className={`text-xl sm:text-2xl font-black mt-0.5 ${selectedStage === "DPT" ? "text-white" : "text-slate-900"}`}>
                {dptCount}
              </div>
              <div className={`text-[10px] mt-1 truncate ${selectedStage === "DPT" ? "text-indigo-200" : "text-slate-500"}`}>
                Daftar Pemilih Tetap
              </div>
            </button>
          </div>

          {selectedStage !== "SEMUA" && (
            <div className="px-3 py-2 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs text-blue-900 animate-in fade-in duration-200">
              <span className="font-semibold">
                Menyaring data pemilih: <span className="font-black underline">{selectedStage.replace("_", " ")}</span> ({filteredVoters.length} pemilih ditemukan)
              </span>
              <button
                type="button"
                onClick={() => setSelectedStage("SEMUA")}
                className="text-[11px] font-black text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                Reset Filter ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Cari nama, NIK, No. KK, atau alamat di ${mode === "DPT" ? "DPT" : "DPS"}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch("")}
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
                className="h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs"
              >
                <option value="SEMUA">Semua Wilayah RW (13 RW • Beban Penuh)</option>
                {tpsList.map((t) => (
                  <option key={t.id} value={t.nomorTps}>
                    Wilayah RW {t.nomorTps} ({t.namaTps} • {t.lokasi})
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
                Verifikasi {selectedIds.length} Terpilih → Masuk DPT
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

      {/* Table & Cards of Voters */}
      <Card className="overflow-hidden bg-white border-slate-200 shadow-sm rounded-2xl">
        {/* 1. DESKTOP VIEW (≥ md): Spreadsheet Table dengan Virtualizer */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-225">
            {/* Header */}
            <div className="flex items-center bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs py-3">
              <div className="w-10 text-center shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllPaged}
                  title="Pilih Semua di Halaman Ini"
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {pagedVoters.length > 0 && pagedVoters.every((v) => selectedIds.includes(v.id)) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
              <div className="w-12 text-center shrink-0">No</div>
              <div className="w-44 px-3 shrink-0">NIK (Sensor Proteksi)</div>
              <div className="flex-1 min-w-45 px-3">Nama Lengkap & JK</div>
              <div className="w-36 px-3 shrink-0">Wilayah / Domisili</div>
              <div className="w-32 px-3 shrink-0 text-center">Wilayah RW</div>
              <div className="w-32 px-3 shrink-0 text-center">Status Tahap</div>
              <div className="w-36 px-3 shrink-0 text-center">Aksi Petugas</div>
            </div>

            {/* Desktop Table Body */}
            {filteredVoters.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                  <Users className="w-8 h-8 text-slate-300" />
                  <div className="text-sm font-semibold text-slate-700">
                    {selectedStage === "DPSHP" ? (
                      "Belum Ada Data Pemilih DPSHP (0)"
                    ) : selectedStage === "DPS" ? (
                      "Belum Ada Data Pemilih DPS (0)"
                    ) : selectedStage === "DPT" ? (
                      "Belum Ada Data Pemilih DPT (0)"
                    ) : selectedStage === "DPTB" ? (
                      "Belum Ada Data Pemilih Tambahan DPTb (0)"
                    ) : (
                      `Tidak ada data pemilih yang berada di tahap ${mode === "DPT" ? "DPT" : "Calon DPS"}`
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {selectedStage === "DPSHP" ? (
                      "Indikator DPSHP bernilai 0 karena belum ada data DPS yang melalui dan lolos proses pembenahan sah. Seluruh 7.787 data pemilih saat ini masih berada di tahap awal Calon DPS."
                    ) : selectedStage === "DPS" ? (
                      "Belum ada data Calon DPS yang diproses dan ditetapkan menjadi DPS melalui sidang pleno."
                    ) : selectedStage === "DPT" ? (
                      "DPT hanya dapat ditetapkan dari data DPSHP yang telah memenuhi syarat sidang pleno final penetapan DPT."
                    ) : selectedStage === "DPTB" ? (
                      "Data pemilih tambahan (DPTb) belum tercatat. Setiap pemilih tambahan wajib diproses ke DPS terlebih dahulu sebelum tahapan berikutnya."
                    ) : (
                      "Sesuaikan kata kunci pencarian atau reset filter untuk menampilkan data pemilih."
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <VirtualVoterTable
                voters={pagedVoters}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onOpenEditVoter={onOpenEditVoter}
                onOpenMutasi={onOpenMutasi}
                onOpenTms={onOpenTms}
                onDeleteVoter={onDeleteVoter}
                onPromoteToDpt={onPromoteToDpt}
                onRollbackToDps={onRollbackToDps}
                isAdmin={isAdmin}
                startIdx={startIdx}
                mode={mode}
                height={540}
                viewMode="desktop"
              />
            )}
          </div>
        </div>

        {/* 2. MOBILE NATIVE VIEW (< md): 100% Full-Width Cards, NOL Scroll Kanan-Kiri */}
        <div className="block md:hidden w-full">
          {/* Mobile Batch Action & Status Bar */}
          <div className="flex items-center justify-between p-3 bg-slate-50/90 border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={handleSelectAllPaged}
              className="flex items-center gap-2 font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {pagedVoters.length > 0 && pagedVoters.every((v) => selectedIds.includes(v.id)) ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Pilih Semua Halaman ({pagedVoters.length})</span>
            </button>
            {selectedIds.length > 0 && (
              <Badge variant="primary" className="text-[10px] font-bold">
                {selectedIds.length} Terpilih
              </Badge>
            )}
          </div>

          {/* Mobile Cards Container */}
          {filteredVoters.length === 0 ? (
            <div className="py-12 text-center text-slate-400 px-4">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold">Tidak ada data pemilih untuk pencarian ini.</div>
            </div>
          ) : (
            <div className="p-3 w-full">
              <VirtualVoterTable
                voters={pagedVoters}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onOpenEditVoter={onOpenEditVoter}
                onOpenMutasi={onOpenMutasi}
                onOpenTms={onOpenTms}
                onDeleteVoter={onDeleteVoter}
                onPromoteToDpt={onPromoteToDpt}
                onRollbackToDps={onRollbackToDps}
                isAdmin={isAdmin}
                startIdx={startIdx}
                mode={mode}
                viewMode="mobile"
              />
            </div>
          )}
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
