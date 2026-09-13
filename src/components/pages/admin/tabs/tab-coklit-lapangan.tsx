"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Search,
  Check,
  MapPin,
  Clock,
  Sparkles,
  FileSpreadsheet,
  LayoutGrid,
  List,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge, PaginationControl } from "@/components/ui";
import { Voter, TPSItem } from "../types";

interface TabCoklitLapanganProps {
  voters: Voter[];
  tpsList: TPSItem[];
  currentTps: string;
  setCurrentTps: (tps: string) => void;
  isAdmin: boolean;
  onUpdateCoklitStatus: (
    voterId: string,
    status: "SESUAI" | "UBAH_DATA" | "TMS" | "BELUM_COKLIT",
    catatan?: string
  ) => void;
  onOpenEditVoter: (v: Voter) => void;
  onOpenAddVoter: () => void;
  onOpenTms: (v: Voter) => void;
}

export const TabCoklitLapangan: React.FC<TabCoklitLapanganProps> = ({
  voters,
  tpsList,
  currentTps,
  setCurrentTps,
  isAdmin,
  onUpdateCoklitStatus,
  onOpenEditVoter,
  onOpenAddVoter,
  onOpenTms,
}) => {
  const [filterCoklit, setFilterCoklit] = useState<"ALL" | "BELUM" | "SESUAI" | "UBAH_DATA" | "TMS">("ALL");
  const [searchCoklit, setSearchCoklit] = useState("");
  const [viewMode, setViewMode] = useState<"CARD" | "TABLE">("CARD");

  // Filter voters for Coklit tab
  const filteredVoters = voters.filter((v) => {
    // 1. RW / TPS Filter
    if (
      currentTps !== "SEMUA" &&
      !v.rw.toLowerCase().includes(currentTps.toLowerCase()) &&
      !v.tps.toLowerCase().includes(currentTps.toLowerCase())
    ) {
      return false;
    }

    // 2. Status Coklit Filter
    if (filterCoklit === "BELUM" && v.coklitStatus && v.coklitStatus !== "BELUM_COKLIT") return false;
    if (filterCoklit === "SESUAI" && v.coklitStatus !== "SESUAI") return false;
    if (filterCoklit === "UBAH_DATA" && v.coklitStatus !== "UBAH_DATA") return false;
    if (filterCoklit === "TMS" && v.coklitStatus !== "TMS" && v.statusAktif !== "TMS") return false;

    // 3. Search Query
    if (searchCoklit) {
      const q = searchCoklit.toLowerCase().trim();
      return (
        v.namaLengkap.toLowerCase().includes(q) ||
        v.nik.includes(q) ||
        v.alamat.toLowerCase().includes(q) ||
        v.rt.includes(q) ||
        v.rw.includes(q)
      );
    }

    return true;
  });

  // Calculate Coklit Statistics
  const tpsVoters = currentTps === "SEMUA"
    ? voters
    : voters.filter(
        (v) =>
          v.rw.toLowerCase().includes(currentTps.toLowerCase()) ||
          v.tps.toLowerCase().includes(currentTps.toLowerCase())
      );

  const total = tpsVoters.length;
  const sesuai = tpsVoters.filter((v) => v.coklitStatus === "SESUAI").length;
  const ubah = tpsVoters.filter((v) => v.coklitStatus === "UBAH_DATA").length;
  const tms = tpsVoters.filter((v) => v.coklitStatus === "TMS" || v.statusAktif === "TMS").length;
  const selesai = sesuai + ubah + tms;
  const belum = Math.max(0, total - selesai);
  const persentase = total > 0 ? Math.round((selesai / total) * 100) : 0;

  const [currentPageCard, setCurrentPageCard] = useState(1);
  const [currentPageTable, setCurrentPageTable] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const startIdxCard = (currentPageCard - 1) * pageSize;
  const pagedVotersCard = filteredVoters.slice(startIdxCard, startIdxCard + pageSize);
  const startIdxTable = (currentPageTable - 1) * pageSize;
  const pagedVotersTable = filteredVoters.slice(startIdxTable, startIdxTable + pageSize);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header & Progress Native Card */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary" className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 mr-1 inline text-amber-400" />
                Aplikasi Lapangan Koordinator RW
              </Badge>
              <span className="text-xs text-slate-400 font-medium">•</span>
              <span className="text-xs text-blue-200 font-semibold">
                {currentTps === "SEMUA" ? "Seluruh Wilayah RW (RW 01 s/d RW 13)" : `Wilayah Tugas ${currentTps}`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              Pencocokan & Penelitian Data Pemilih (Coklit Wilayah RW)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl font-normal">
              Gunakan lembar kerja ini saat verifikasi faktual door-to-door per lingkungan RW. Tandai status pemilih, lakukan koreksi identitas, atau laporkan data TMS secara seketika.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {isAdmin && (
              <select
                value={currentTps}
                onChange={(e) => setCurrentTps(e.target.value)}
                className="h-10 px-3 text-xs font-bold rounded-2xl bg-white/10 text-white border border-white/20 focus:outline-none backdrop-blur-md"
              >
                <option value="SEMUA" className="text-slate-900">Semua Wilayah RW</option>
                {tpsList.map((t) => (
                  <option key={t.id} value={t.rw || t.namaTps} className="text-slate-900">
                    {t.namaTabung || t.namaTps}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddVoter}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-2xl py-2.5 px-4 shadow-md"
            >
              <Plus className="w-4 h-4 mr-1" />
              Temuan Baru
            </Button>
          </div>
        </div>

        {/* Progress Bar & Realtime Percentage */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-blue-200">Progres Coklit Lapangan</span>
            <span className="text-emerald-400">{selesai} dari {total} Pemilih ({persentase}%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex border border-slate-700/60">
            <div
              style={{ width: `${(sesuai / (total || 1)) * 100}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Sesuai: ${sesuai}`}
            />
            <div
              style={{ width: `${(ubah / (total || 1)) * 100}%` }}
              className="bg-blue-500 h-full transition-all duration-500"
              title={`Data Diperbaiki: ${ubah}`}
            />
            <div
              style={{ width: `${(tms / (total || 1)) * 100}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`TMS: ${tms}`}
            />
          </div>
        </div>
      </Card>

      {/* 2. KPI Metrics in Native Proportional Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <Card className="p-3 bg-white border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total DPS</div>
          <div className="text-lg font-black text-slate-900 mt-0.5">{total}</div>
          <div className="text-[10px] text-slate-400">Target Tabung</div>
        </Card>

        <Card className="p-3 bg-amber-50/50 border-amber-200 shadow-2xs">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Belum Coklit</div>
          <div className="text-lg font-black text-amber-900 mt-0.5">{belum}</div>
          <div className="text-[10px] text-amber-600 font-medium">Sisa Kunjungan</div>
        </Card>

        <Card className="p-3 bg-emerald-50/50 border-emerald-200 shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Data Sesuai</div>
          <div className="text-lg font-black text-emerald-900 mt-0.5">{sesuai}</div>
          <div className="text-[10px] text-emerald-600 font-medium">✓ Valid</div>
        </Card>

        <Card className="p-3 bg-blue-50/50 border-blue-200 shadow-2xs">
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Diperbaiki</div>
          <div className="text-lg font-black text-blue-900 mt-0.5">{ubah}</div>
          <div className="text-[10px] text-blue-600 font-medium">Koreksi Data</div>
        </Card>

        <Card className="p-3 bg-rose-50/50 border-rose-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">TMS / Pindah</div>
          <div className="text-lg font-black text-rose-900 mt-0.5">{tms}</div>
          <div className="text-[10px] text-rose-600 font-medium">Disaring</div>
        </Card>
      </div>

      {/* 3. Search & Filter Bar (Touch-Optimized) */}
      <Card className="p-3 bg-white border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIK, alamat, RT/RW..."
              value={searchCoklit}
              onChange={(e) => setSearchCoklit(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setViewMode("CARD")}
              title="Tampilan Kartu Lapangan"
              className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                viewMode === "CARD"
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              title="Tampilan Tabel Kompak"
              className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                viewMode === "TABLE"
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <button
            onClick={() => setFilterCoklit("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterCoklit === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({tpsVoters.length})
          </button>

          <button
            onClick={() => setFilterCoklit("BELUM")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterCoklit === "BELUM"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
            }`}
          >
            Belum Coklit ({belum})
          </button>

          <button
            onClick={() => setFilterCoklit("SESUAI")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterCoklit === "SESUAI"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
          >
            Sesuai ({sesuai})
          </button>

          <button
            onClick={() => setFilterCoklit("UBAH_DATA")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterCoklit === "UBAH_DATA"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60"
            }`}
          >
            Diperbaiki ({ubah})
          </button>

          <button
            onClick={() => setFilterCoklit("TMS")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterCoklit === "TMS"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60"
            }`}
          >
            TMS ({tms})
          </button>
        </div>
      </Card>

      {/* 4. Voters List (Card / Table Mode) */}
      {viewMode === "CARD" ? (
        <div className="space-y-2.5">
          {filteredVoters.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200 text-slate-400 text-xs">
              Tidak ada data pemilih yang sesuai filter pencarian Coklit.
            </Card>
          ) : (
            pagedVotersCard.map((voter) => {
              const isSesuai = voter.coklitStatus === "SESUAI";
              const isUbah = voter.coklitStatus === "UBAH_DATA";
              const isTms = voter.coklitStatus === "TMS" || voter.statusAktif === "TMS";
              const isBelum = !voter.coklitStatus || voter.coklitStatus === "BELUM_COKLIT";

              return (
                <Card
                  key={voter.id}
                  className={`p-3.5 transition-all ${
                    isSesuai
                      ? "bg-emerald-50/30 border-emerald-200/80"
                      : isUbah
                      ? "bg-blue-50/30 border-blue-200/80"
                      : isTms
                      ? "bg-rose-50/30 border-rose-200/80 opacity-85"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {voter.nik}
                        </span>
                        <span className="text-slate-300">•</span>
                        <Badge variant="primary" className="text-[10px] font-bold py-0">
                          {voter.tps}
                        </Badge>
                        {isSesuai && (
                          <Badge variant="success" className="text-[10px] font-bold py-0">
                            <Check className="w-3 h-3 mr-0.5 inline" /> SESUAI
                          </Badge>
                        )}
                        {isUbah && (
                          <Badge variant="primary" className="text-[10px] font-bold py-0">
                            <Edit className="w-3 h-3 mr-0.5 inline" /> DIPERBAIKI
                          </Badge>
                        )}
                        {isTms && (
                          <Badge variant="danger" className="text-[10px] font-bold py-0">
                            <XCircle className="w-3 h-3 mr-0.5 inline" /> TMS
                          </Badge>
                        )}
                        {isBelum && (
                          <Badge variant="warning" className="text-[10px] font-bold py-0">
                            <Clock className="w-3 h-3 mr-0.5 inline" /> BELUM
                          </Badge>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 tracking-tight">
                        {voter.namaLengkap}
                      </h4>

                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>JK: <strong>{voter.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}</strong></span>
                        <span>Lahir: <strong>{voter.tempatLahir}, {voter.tanggalLahir}</strong></span>
                        <span>Status: <strong>{voter.statusPerkawinan === "S" ? "Kawin" : voter.statusPerkawinan === "B" ? "Belum" : "Pernah"}</strong></span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{voter.alamat} (RT {voter.rt} / RW {voter.rw})</span>
                      </div>

                      {voter.coklitTanggal && (
                        <div className="text-[10.5px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-emerald-950 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600 inline shrink-0" />
                            Diverifikasi oleh:
                          </span>
                          <span className="font-black text-emerald-900 bg-white/90 px-1.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
                            {voter.coklitPetugas || "Khasanudin, S.Pd.SD (Ketua P2KD)"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-emerald-700 font-semibold">{voter.coklitTanggal}</span>
                          {voter.coklitCatatan && (
                            <span className="text-slate-600 italic">({voter.coklitCatatan})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right 1-Tap Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => onUpdateCoklitStatus(voter.id, "SESUAI")}
                        className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all ${
                          isSesuai
                            ? "bg-emerald-700 text-white ring-2 ring-emerald-400"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isSesuai ? "Sesuai ✓" : "Sesuai"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEditVoter(voter)}
                        className="h-8 px-2.5 rounded-xl text-xs font-bold border border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-1 bg-white shadow-2xs transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Ubah Data
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenTms(voter)}
                        className="h-8 px-2.5 rounded-xl text-xs font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 flex items-center gap-1 bg-white shadow-2xs transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        TMS
                      </button>

                      {(isSesuai || isUbah || isTms) && (
                        <button
                          type="button"
                          onClick={() => onUpdateCoklitStatus(voter.id, "BELUM_COKLIT")}
                          title="Reset Status Coklit"
                          className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
          {filteredVoters.length > 0 && (
            <div className="mt-3">
              <PaginationControl
                currentPage={currentPageCard}
                totalItems={filteredVoters.length}
                pageSize={pageSize}
                onPageChange={setCurrentPageCard}
                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPageCard(1); }}
              />
            </div>
          )}
        </div>
      ) : (
        /* TABLE MODE */
        <Card className="overflow-hidden border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Pemilih</th>
                  <th className="py-2.5 px-3">NIK & Identitas</th>
                  <th className="py-2.5 px-3">Alamat & Tabung</th>
                  <th className="py-2.5 px-3">Status Coklit</th>
                  <th className="py-2.5 px-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedVotersTable.map((voter, idx) => {
                  const isSesuai = voter.coklitStatus === "SESUAI";
                  const isUbah = voter.coklitStatus === "UBAH_DATA";
                  const isTms = voter.coklitStatus === "TMS" || voter.statusAktif === "TMS";

                  return (
                    <tr key={voter.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400 font-medium">
                        {startIdxTable + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {voter.namaLengkap}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-800">{voter.nik}</div>
                        <div className="text-[10px] text-slate-400">
                          {voter.jenisKelamin === "L" ? "L" : "P"} • {voter.tanggalLahir}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{voter.alamat} (RT {voter.rt}/{voter.rw})</div>
                        <div className="text-[10px] font-bold text-blue-700">{voter.tps}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isSesuai ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            SESUAI
                          </span>
                        ) : isUbah ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            DIPERBAIKI
                          </span>
                        ) : isTms ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            TMS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            BELUM
                          </span>
                        )}
                        {voter.coklitTanggal && (
                          <div className="text-[9.5px] text-slate-500 mt-1 font-medium leading-tight">
                            Oleh: <strong className="text-emerald-800 font-bold">{voter.coklitPetugas || "Khasanudin, S.Pd.SD"}</strong>
                            <span className="block text-[9px] text-slate-400 font-mono">Tgl: {voter.coklitTanggal}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onUpdateCoklitStatus(voter.id, "SESUAI")}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xs"
                            title="Sesuai"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEditVoter(voter)}
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-2xs"
                            title="Ubah Data"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenTms(voter)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs"
                            title="TMS"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredVoters.length > 0 && (
            <div className="px-3 pb-3">
              <PaginationControl
                currentPage={currentPageTable}
                totalItems={filteredVoters.length}
                pageSize={pageSize}
                onPageChange={setCurrentPageTable}
                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPageTable(1); }}
              />
            </div>
          )}
        </Card>
      )}

      {/* 5. Quick Export Report */}
      <Card className="p-3.5 bg-white border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div>
          <span className="font-bold text-slate-800 block">Laporan Hasil Coklit P2KD:</span>
          <span className="text-slate-500 text-[11px]">Format Excel (.xlsx) mencakup rekap status door-to-door dan stiker coklit warga.</span>
        </div>
        <a href={`/api/admin/export?type=PEMILIH&tps=${currentTps}`} download>
          <Button variant="outline" size="sm" className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8 px-3">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Unduh Berkas (.xlsx)
          </Button>
        </a>
      </Card>
    </div>
  );
};
