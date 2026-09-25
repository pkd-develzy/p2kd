"use client";

import React, { useState, useMemo } from "react";
import { Voter, TPSItem } from "../types";
import {
  Printer,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Sparkles,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
  Layers,
  FileText,
} from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { exportModelA1Excel, exportModelA1Pdf, matchTpsVoter, sortVotersByKk } from "@/lib/print-models-export";
import { DAFTAR_RW_KALISALAK, normalizeWilayahCode } from "@/lib/kalisalak-wilayah";
import { fetchPemilihPaged } from "@/lib/secure-device-cache";

interface PrintModelA1DpsProps {
  voters: Voter[];
  tpsList: TPSItem[];
  defaultTps?: string;
  isAdmin: boolean;
  onBack: () => void;
}

export const PrintModelA1Dps: React.FC<PrintModelA1DpsProps> = ({
  voters,
  tpsList,
  defaultTps,
  isAdmin,
  onBack,
}) => {
  // State pilihan RW: jika non-admin dan punya assignedTps, langsung buka RW tersebut;
  // jika admin, default null (tampilan Grid 13 RW)
  const initialRw = useMemo(() => {
    if (!isAdmin && defaultTps && defaultTps !== "SEMUA") {
      return normalizeWilayahCode(defaultTps);
    }
    return null;
  }, [isAdmin, defaultTps]);

  const [selectedRw, setSelectedRw] = useState<string | null>(initialRw);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchGrid, setSearchGrid] = useState<string>("");
  const [searchVoter, setSearchVoter] = useState<string>("");
  const [lazyRwVoters, setLazyRwVoters] = useState<Record<string, Voter[]>>({});
  const [isLoadingRw, setIsLoadingRw] = useState(false);

  // Lazy-load RW data dari IndexedDB terenkripsi jika belum ada di props voters
  React.useEffect(() => {
    if (!selectedRw) return;
    const hasInProps = voters.some((v) => normalizeWilayahCode(v.rw) === selectedRw);
    if (hasInProps || (lazyRwVoters[selectedRw] && lazyRwVoters[selectedRw].length > 0)) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setIsLoadingRw(true);
    }, 0);

    fetchPemilihPaged(0, 200, { tps: `TPS ${selectedRw}` })
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setLazyRwVoters((prev) => ({ ...prev, [selectedRw]: res.data }));
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        if (isMounted) setIsLoadingRw(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedRw, voters, lazyRwVoters]);

  // ========================================================
  // REKAP DATA PER RW (Ultra-fast client aggregation < 5ms)
  // ========================================================
  const rwSummaries = useMemo(() => {
    return DAFTAR_RW_KALISALAK.map((rwItem) => {
      const rwCode = rwItem.value; // "01", "02", ...
      const tpsNum = rwItem.defaultTps; // "01", "02", ...
      const targetTps = tpsList.find(
        (t) =>
          normalizeWilayahCode(t.rw || t.nomorTps) === rwCode ||
          matchTpsVoter(t.namaTps, rwCode)
      );

      const rwVoters = voters.filter((v) => {
        const normVoterRw = normalizeWilayahCode(v.rw);
        const matchByRw = normVoterRw === rwCode;
        const matchByTps =
          matchTpsVoter(v.tps, `TPS ${tpsNum}`) ||
          matchTpsVoter(v.tps, `Tabung ${tpsNum}`) ||
          matchTpsVoter(v.tps, rwCode);
        return matchByRw || matchByTps;
      });

      const total = rwVoters.length;
      const lCount = rwVoters.filter((v) => v.jenisKelamin === "L").length;
      const pCount = rwVoters.filter((v) => v.jenisKelamin === "P").length;
      const sesuai = rwVoters.filter((v) => v.coklitStatus === "SESUAI").length;
      const ubah = rwVoters.filter((v) => v.coklitStatus === "UBAH_DATA").length;
      const tms = rwVoters.filter(
        (v) => v.coklitStatus === "TMS" || v.statusAktif === "TMS"
      ).length;
      const selesai = sesuai + ubah + tms;
      const belum = Math.max(0, total - selesai);
      const persentase = total > 0 ? Math.round((selesai / total) * 100) : 0;

      return {
        rwItem,
        rwCode,
        tpsNum,
        namaTabung: targetTps?.namaTabung || `Tabung ${tpsNum}`,
        lokasi: targetTps?.lokasi || `Balai Pertemuan RW ${rwCode}, Desa Kalisalak`,
        total,
        lCount,
        pCount,
        sesuai,
        ubah,
        tms,
        selesai,
        belum,
        persentase,
        voters: sortVotersByKk(rwVoters),
      };
    });
  }, [voters, tpsList]);

  // Statistik Keseluruhan Desa
  const totalDesa = useMemo(() => {
    const total = voters.length;
    const l = voters.filter((v) => v.jenisKelamin === "L").length;
    const p = voters.filter((v) => v.jenisKelamin === "P").length;
    const selesai = voters.filter(
      (v) =>
        v.coklitStatus === "SESUAI" ||
        v.coklitStatus === "UBAH_DATA" ||
        v.coklitStatus === "TMS" ||
        v.statusAktif === "TMS"
    ).length;
    const belum = Math.max(0, total - selesai);
    return { total, l, p, selesai, belum };
  }, [voters]);

  // Filter RW pada tampilan Grid
  const filteredGridRw = useMemo(() => {
    if (!searchGrid.trim()) return rwSummaries;
    const q = searchGrid.toLowerCase().trim();
    return rwSummaries.filter(
      (rw) =>
        rw.rwItem.label.toLowerCase().includes(q) ||
        rw.rwCode.includes(q) ||
        rw.namaTabung.toLowerCase().includes(q) ||
        rw.lokasi.toLowerCase().includes(q)
    );
  }, [rwSummaries, searchGrid]);

  // ========================================================
  // VIEW 1: GRID OVERVIEW PER RW (RINGAN, INSTAN, BEBAS FREEZE)
  // ========================================================
  if (selectedRw === null) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Header Action & Navigasi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali ke Pusat Cetak
              </Button>
              <Badge
                variant="warning"
                className="text-[10px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-900 border-amber-300"
              >
                MODEL A.1 • DPS PILKADES
              </Badge>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight pt-1">
              Pilih Wilayah RW untuk Membuka Lembar Kerja DPS
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Data dipilah per Wilayah RW untuk mencegah beban komputasi berlebih. Setiap lembar kerja memuat 1 sub-tabel verifikasi faktual Coklit per data pemilih sesuai standar regulasi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari RW atau Tabung..."
                value={searchGrid}
                onChange={(e) => setSearchGrid(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Ringkasan Banner Seluruh Desa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-linear-to-r from-amber-950 via-slate-900 to-blue-950 text-white p-5 rounded-3xl border border-amber-900/40 shadow-sm">
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Cakupan Wilayah
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              13 Wilayah RW
            </div>
            <div className="text-[11px] text-slate-400">13 Tabung Pemilihan</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Total Pemilih DPS
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {totalDesa.total.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-slate-300">Jiwa</span>
            </div>
            <div className="text-[11px] text-slate-400">
              L: {totalDesa.l} • P: {totalDesa.p}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Sudah Diverifikasi
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {totalDesa.selesai.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-slate-300">Jiwa</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {totalDesa.total > 0
                ? `${Math.round((totalDesa.selesai / totalDesa.total) * 100)}% Progres Coklit`
                : "0%"}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Belum Coklit
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {totalDesa.belum.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-slate-300">Jiwa</span>
            </div>
            <div className="text-[11px] text-slate-400">Perlu Verifikasi Faktual</div>
          </div>
        </div>

        {/* Grid 13 Wilayah RW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGridRw.map((rw) => (
            <Card
              key={rw.rwCode}
              className="p-5 bg-white border border-slate-200/90 hover:border-amber-500 hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Card RW */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 font-black text-base flex items-center justify-center border border-amber-200/60 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      {rw.rwCode}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">
                        {rw.rwItem.label}
                      </h3>
                      <p className="text-[11px] font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                        {rw.namaTabung}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border-slate-300"
                  >
                    {rw.total} Jiwa
                  </Badge>
                </div>

                {/* Lokasi RW */}
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {rw.lokasi}
                </p>

                {/* Status Coklit & Mini Progress Bar */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">Progres Coklit:</span>
                    <span className="font-bold text-slate-900">
                      {rw.selesai} / {rw.total} ({rw.persentase}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${rw.persentase}%` }}
                    />
                  </div>

                  {/* Breakdown Badge */}
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-center font-medium">
                    <div className="bg-emerald-50 text-emerald-800 py-0.5 rounded border border-emerald-200/60 font-bold">
                      ✓ {rw.sesuai} Sesuai
                    </div>
                    <div className="bg-blue-50 text-blue-800 py-0.5 rounded border border-blue-200/60 font-bold">
                      ✎ {rw.ubah} Ubah
                    </div>
                    <div className="bg-rose-50 text-rose-800 py-0.5 rounded border border-rose-200/60 font-bold">
                      ✕ {rw.tms} TMS
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Buka Lembar Kerja, Unduh Excel, Unduh PDF */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedRw(rw.rwCode)}
                  className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs justify-between group-hover:bg-amber-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Buka Lembar DPS {rw.rwItem.label}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportModelA1Excel(rw.voters, `Wilayah RW ${rw.rwCode}`)}
                    className="text-[11px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7 px-2 justify-center"
                    title={`Unduh Excel Model A.1 khusus ${rw.rwItem.label}`}
                  >
                    <FileSpreadsheet className="w-3 h-3 mr-1 text-emerald-600" />
                    Excel (.xlsx)
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportModelA1Pdf(rw.voters, `Wilayah RW ${rw.rwCode}`)}
                    className="text-[11px] font-bold text-rose-700 border-rose-300 hover:bg-rose-50 h-7 px-2 justify-center"
                    title={`Unduh PDF Model A.1 khusus ${rw.rwItem.label}`}
                  >
                    <Download className="w-3 h-3 mr-1 text-rose-600" />
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW 2: DETAIL LEMBAR KERJA MODEL A.1 RW TERPILIH
  // (HANYA ~300-500 PEMILIH, INSTAN, BEBAS FREEZE, SIAP CETAK)
  // ========================================================
  const activeRwObj = DAFTAR_RW_KALISALAK.find((r) => r.value === selectedRw);
  const activeRwLabel = activeRwObj ? activeRwObj.label : `RW ${selectedRw}`;
  const activeTabungInfo = tpsList.find(
    (t) =>
      normalizeWilayahCode(t.rw || t.nomorTps) === selectedRw ||
      matchTpsVoter(t.namaTps, selectedRw)
  );
  const activeTabungNama =
    activeTabungInfo?.namaTabung || `Tabung ${selectedRw}`;

  // Filter pemilih khusus RW ini (diurutkan per nomor KK & peran keluarga)
  const voterPool = (selectedRw && lazyRwVoters[selectedRw] && lazyRwVoters[selectedRw].length > 0)
    ? lazyRwVoters[selectedRw]
    : voters;

  const rawRwVoters = sortVotersByKk(
    voterPool.filter((v) => {
      const normVoterRw = normalizeWilayahCode(v.rw);
      const matchByRw = normVoterRw === selectedRw;
      const matchByTps =
        matchTpsVoter(v.tps, `TPS ${selectedRw}`) ||
        matchTpsVoter(v.tps, `Tabung ${selectedRw}`) ||
        matchTpsVoter(v.tps, selectedRw);
      return matchByRw || matchByTps;
    })
  );

  // Terapkan filter status & pencarian pemilih
  const filteredVoters = rawRwVoters.filter((v) => {
    if (filterStatus === "SESUAI" && v.coklitStatus !== "SESUAI") return false;
    if (filterStatus === "UBAH_DATA" && v.coklitStatus !== "UBAH_DATA") return false;
    if (filterStatus === "TMS" && v.coklitStatus !== "TMS" && v.statusAktif !== "TMS") return false;
    if (filterStatus === "BELUM" && v.coklitStatus && v.coklitStatus !== "BELUM_COKLIT") return false;

    if (searchVoter.trim()) {
      const q = searchVoter.toLowerCase().trim();
      return (
        v.namaLengkap.toLowerCase().includes(q) ||
        v.nik.includes(q) ||
        (v.kk && v.kk.includes(q)) ||
        (v.alamat && v.alamat.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const lCount = filteredVoters.filter((v) => v.jenisKelamin === "L").length;
  const pCount = filteredVoters.filter((v) => v.jenisKelamin === "P").length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRw(null)}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali ke Pilihan RW
            </Button>
          )}

          {!isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali ke Pusat Cetak
            </Button>
          )}

          <Badge
            variant="warning"
            className="text-[10px] font-bold bg-amber-500/10 text-amber-900 border-amber-300"
          >
            MODEL A.1 • {activeRwLabel} ({filteredVoters.length} Pemilih)
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* RW Quick Switcher Dropdown */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span>Ganti RW:</span>
              <select
                value={selectedRw}
                onChange={(e) => setSelectedRw(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-amber-800"
              >
                {DAFTAR_RW_KALISALAK.map((rw) => (
                  <option key={rw.value} value={rw.value}>
                    {rw.label} (Tabung {rw.defaultTps})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="ALL">Semua Data</option>
              <option value="BELUM">Belum Coklit</option>
              <option value="SESUAI">Sesuai</option>
              <option value="UBAH_DATA">Diperbaiki</option>
              <option value="TMS">TMS</option>
            </select>
          </div>

          {/* Search Pemilih */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama/NIK..."
              value={searchVoter}
              onChange={(e) => setSearchVoter(e.target.value)}
              className="h-8 pl-8 pr-2.5 text-xs rounded-lg border border-slate-300 bg-white w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Download Excel RW */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA1Excel(filteredVoters, `Wilayah ${activeRwLabel}`)}
            className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Excel
          </Button>

          {/* Download PDF RW */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA1Pdf(filteredVoters, `Wilayah ${activeRwLabel}`)}
            className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 h-8"
          >
            <Download className="w-4 h-4 mr-1.5 text-rose-600" />
            PDF
          </Button>

          {/* Print A4 */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white h-8"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Dokumen
          </Button>
        </div>
      </div>

      {/* Printable Sheet (Standard Resmi Model A.1 DPS Pilkades Kalisalak) */}
      <div className="bg-white text-black p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-lg max-w-6xl mx-auto font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop Resmi */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            MODEL A.1-PILKADES (LEMBAR KERJA PEMUTAKHIRAN DPS)
          </div>
          <h3 className="text-sm font-bold uppercase">
            DAFTAR PEMILIH SEMENTARA (DPS) PEMILIHAN KEPALA DESA KALISALAK 2026/2027
          </h3>
          <h2 className="text-base font-black uppercase tracking-wide mt-0.5">
            LEMBAR KERJA COKLIT PANTARLIH • WILAYAH: {activeRwLabel.toUpperCase()} ({activeTabungNama.toUpperCase()})
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Kecamatan Margasari, Kabupaten Tegal • Format Standar Berkas Faktual Lapangan
          </p>
        </div>

        {/* Ringkasan */}
        <div className="flex items-center justify-between text-xs mb-4 pb-2 border-b border-slate-200">
          <div>
            Total Pemilih {activeRwLabel}: <strong>{filteredVoters.length} Orang</strong> (L: <strong>{lCount}</strong>, P: <strong>{pCount}</strong>)
          </div>
          <div className="text-[11px] text-slate-500 italic">
            * Setiap 1 data pemilih dilengkapi 1 sub-tabel verifikasi faktual lapangan
          </div>
        </div>

        {/* Daftar Pemilih dengan Sub-Tabel */}
        <div className="space-y-3">
          {isLoadingRw ? (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 animate-spin text-amber-600" />
              Memuat data pemilih terenkripsi untuk {activeRwLabel}...
            </div>
          ) : filteredVoters.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
              Tidak ada data pemilih yang sesuai kriteria filter di {activeRwLabel}.
            </div>
          ) : (
            filteredVoters.map((v, idx) => {
              const isSesuai = v.coklitStatus === "SESUAI";
              const isUbah = v.coklitStatus === "UBAH_DATA";
              const isTms = v.coklitStatus === "TMS" || v.statusAktif === "TMS";

              return (
                <div
                  key={v.id}
                  className="border border-black rounded-lg overflow-hidden text-xs break-inside-avoid"
                >
                  {/* Baris 1: Tabel Data Utama Pemilih */}
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-black text-slate-800">
                        <th className="p-1.5 w-8 text-center border-r border-black">NO</th>
                        <th className="p-1.5 w-36 border-r border-black">NOMOR NIK</th>
                        <th className="p-1.5 w-36 border-r border-black">NOMOR KK</th>
                        <th className="p-1.5 border-r border-black">NAMA LENGKAP</th>
                        <th className="p-1.5 w-10 text-center border-r border-black">JK</th>
                        <th className="p-1.5 w-40 border-r border-black">TEMPAT / TGL LAHIR</th>
                        <th className="p-1.5 w-16 text-center border-r border-black">KAWIN</th>
                        <th className="p-1.5 border-r border-black">ALAMAT DOMISILI</th>
                        <th className="p-1.5 w-12 text-center border-r border-black">RT/RW</th>
                        <th className="p-1.5 w-20 text-center">TABUNG</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-medium bg-white">
                        <td className="p-1.5 text-center font-bold border-r border-black">{idx + 1}</td>
                        <td className="p-1.5 font-mono font-bold border-r border-black">{v.nik}</td>
                        <td className="p-1.5 font-mono border-r border-black">{v.kk || "-"}</td>
                        <td className="p-1.5 font-bold uppercase text-slate-950 border-r border-black">
                          {v.namaLengkap}
                        </td>
                        <td className="p-1.5 text-center border-r border-black">{v.jenisKelamin}</td>
                        <td className="p-1.5 border-r border-black">
                          {v.tempatLahir}, {v.tanggalLahir}
                        </td>
                        <td className="p-1.5 text-center border-r border-black">
                          {v.statusPerkawinan === "S" ? "Kawin" : v.statusPerkawinan === "B" ? "Belum" : "Pernah"}
                        </td>
                        <td className="p-1.5 border-r border-black truncate max-w-xs">{v.alamat}</td>
                        <td className="p-1.5 text-center border-r border-black">
                          {v.rt}/{v.rw}
                        </td>
                        <td className="p-1.5 text-center font-bold text-blue-900">
                          {v.tps.replace(/TPS/gi, "Tabung")}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Baris 2: SUB-TABEL VERIFIKASI COKLIT DI BAWAHNYA */}
                  <div className="bg-slate-50 border-t border-black p-2">
                    <div className="text-[10px] font-black text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Sub-Tabel Verifikasi Faktual Lapangan (Model A.1)
                    </div>

                    <table className="w-full text-[10.5px] border border-slate-400 bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold text-center border-b border-slate-400">
                          <th className="p-1 border-r border-slate-400 w-36">STATUS FAKTUAL</th>
                          <th className="p-1 border-r border-slate-400">KOREKSI ELEMEN DATA</th>
                          <th className="p-1 border-r border-slate-400">CATATAN LAPANGAN / BUKTI</th>
                          <th className="p-1 border-r border-slate-400 w-44">PETUGAS VERIFIKATOR</th>
                          <th className="p-1 border-r border-slate-400 w-28">TGL VERIFIKASI</th>
                          <th className="p-1 w-24">PARAF PETUGAS</th>
                          <th className="p-1 w-24 border-l border-slate-400">PARAF PEMILIH</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          {/* Status */}
                          <td className="p-1.5 border-r border-slate-400 text-left font-bold">
                            <div className="space-y-0.5 text-[10px]">
                              <div className={`flex items-center gap-1 ${isSesuai ? "text-emerald-700 font-black" : "text-slate-500"}`}>
                                <span>{isSesuai ? "[✓]" : "[ ]"}</span>
                                <span>SESUAI</span>
                              </div>
                              <div className={`flex items-center gap-1 ${isUbah ? "text-blue-700 font-black" : "text-slate-500"}`}>
                                <span>{isUbah ? "[✓]" : "[ ]"}</span>
                                <span>UBAH DATA</span>
                              </div>
                              <div className={`flex items-center gap-1 ${isTms ? "text-rose-700 font-black" : "text-slate-500"}`}>
                                <span>{isTms ? "[✓]" : "[ ]"}</span>
                                <span>TMS</span>
                              </div>
                            </div>
                          </td>

                          {/* Koreksi Data */}
                          <td className="p-1.5 border-r border-slate-400 text-left">
                            {v.coklitCatatan ? (
                              <span className="font-semibold text-blue-900">{v.coklitCatatan}</span>
                            ) : (
                              <span className="text-slate-300 font-mono select-none">..........................................................................</span>
                            )}
                          </td>

                          {/* Catatan Lapangan */}
                          <td className="p-1.5 border-r border-slate-400 text-left">
                            {v.alasanTms ? (
                              <span className="font-bold text-rose-700">TMS: {v.alasanTms}</span>
                            ) : (
                              <span className="text-slate-300 font-mono select-none">..........................................................................</span>
                            )}
                          </td>

                          {/* Petugas Verifikator */}
                          <td className="p-1.5 border-r border-slate-400 text-left font-semibold">
                            {v.coklitPetugas || <span className="text-slate-300 font-mono select-none">................................................</span>}
                          </td>

                          {/* Tanggal */}
                          <td className="p-1.5 border-r border-slate-400 text-center font-mono text-[10px]">
                            {v.coklitTanggal || <span className="text-slate-300 select-none">..../..../2026</span>}
                          </td>

                          {/* Paraf Petugas */}
                          <td className="p-1.5 text-center">
                            <div className="h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400">
                              Paraf
                            </div>
                          </td>

                          {/* Paraf Pemilih */}
                          <td className="p-1.5 border-l border-slate-400 text-center">
                            <div className="h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400">
                              Paraf
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Pengesahan Pantarlih */}
        <div className="mt-8 text-xs flex justify-between items-end">
          <div className="text-[10px] text-slate-500 max-w-sm">
            * Lembar Kerja Model A.1 ini dicetak dan dikelola melalui Sistem Informasi Pemilih P2KD Desa Kalisalak 2026/2027 untuk Wilayah {activeRwLabel}.
          </div>

          <div className="text-center space-y-12">
            <div>
              Kalisalak, 14 September 2026
              <div className="font-bold uppercase">Petugas Pantarlih / Koordinator {activeRwLabel} ({activeTabungNama})</div>
            </div>
            <div>
              <strong className="underline block font-bold uppercase">
                ( .................................................. )
              </strong>
              <span className="text-[10px] text-slate-600">Nama Terang & Tanda Tangan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
