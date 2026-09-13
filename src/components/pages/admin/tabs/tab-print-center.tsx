"use client";

import React, { useState } from "react";
import { Voter, TPSItem, AnggotaP2KD } from "../types";
import {
  Printer,
  FileText,
  Mail,
  Home,
  FileSpreadsheet,
  Download,
  Users,
  UserCheck,
  UserPlus,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge } from "@/components/ui";

// Print Components
import { PrintBeritaAcara } from "../print/print-berita-acara";
import { PrintDptTps } from "../print/print-dpt-tps";
import { PrintFormC6 } from "../print/print-form-c6";
import { PrintStikerCoklit } from "../print/print-stiker-coklit";
import { PrintModelA1Dps } from "../print/print-model-a1-dps";
import { PrintModelA2Dptb } from "../print/print-model-a2-dptb";
import { PrintModelA3Dpt } from "../print/print-model-a3-dpt";
import { PrintModelA4Salinan } from "../print/print-model-a4-salinan";

// Export Utilities
import {
  exportModelA1Excel,
  exportModelA1Pdf,
  exportModelA2Excel,
  exportModelA2Pdf,
  exportModelA3Excel,
  exportModelA3Pdf,
  exportModelA4Excel,
  exportModelA4Pdf,
} from "@/lib/print-models-export";

interface TabPrintCenterProps {
  voters: Voter[];
  tpsList: TPSItem[];
  nomorBeritaAcara: string;
  isDptLocked: boolean;
  lockHashSignature: string;
  isAdmin: boolean;
  assignedTps?: string;
  anggotaList?: AnggotaP2KD[];
}

type PrintDocType =
  | "MENU"
  | "MODEL_A1_DPS"
  | "MODEL_A2_DPTB"
  | "MODEL_A3_DPT"
  | "MODEL_A4_SALINAN"
  | "BERITA_ACARA"
  | "DPT_TPS"
  | "FORM_C6"
  | "STIKER_COKLIT";

export const TabPrintCenter: React.FC<TabPrintCenterProps> = ({
  voters,
  tpsList,
  nomorBeritaAcara,
  isDptLocked,
  lockHashSignature,
  isAdmin,
  assignedTps = "SEMUA",
  anggotaList = [],
}) => {
  const [activeDoc, setActiveDoc] = useState<PrintDocType>("MENU");
  const firstTpsName = tpsList[0]?.namaTps || "SEMUA";

  const dptVotersCount = voters.filter((v) => v.statusAktif === "AKTIF").length;

  // View Switchers
  if (activeDoc === "MODEL_A1_DPS") {
    return (
      <PrintModelA1Dps
        voters={voters}
        tpsList={tpsList}
        defaultTps={isAdmin ? "SEMUA" : assignedTps}
        isAdmin={isAdmin}
        onBack={() => setActiveDoc("MENU")}
      />
    );
  }

  if (activeDoc === "MODEL_A2_DPTB") {
    return (
      <PrintModelA2Dptb
        voters={voters}
        tpsList={tpsList}
        defaultTps={isAdmin ? "SEMUA" : assignedTps}
        isAdmin={isAdmin}
        onBack={() => setActiveDoc("MENU")}
      />
    );
  }

  if (activeDoc === "MODEL_A3_DPT") {
    return (
      <PrintModelA3Dpt
        voters={voters}
        tpsList={tpsList}
        isAdmin={isAdmin}
        onBack={() => setActiveDoc("MENU")}
      />
    );
  }

  if (activeDoc === "MODEL_A4_SALINAN") {
    return (
      <PrintModelA4Salinan
        voters={voters}
        tpsList={tpsList}
        defaultTps={isAdmin ? firstTpsName : assignedTps}
        isAdmin={isAdmin}
        onBack={() => setActiveDoc("MENU")}
      />
    );
  }

  if (activeDoc === "BERITA_ACARA") {
    return (
      <PrintBeritaAcara
        nomorBeritaAcara={nomorBeritaAcara}
        isDptLocked={isDptLocked}
        lockHashSignature={lockHashSignature}
        voters={voters}
        tpsList={tpsList}
        anggotaList={anggotaList}
        onBack={() => setActiveDoc("MENU")}
      />
    );
  }

  if (activeDoc === "DPT_TPS") {
    return (
      <PrintDptTps
        voters={voters}
        tpsList={tpsList}
        defaultTps={isAdmin ? firstTpsName : assignedTps}
        isAdmin={isAdmin}
        onBack={() => setActiveDoc("MENU")}
      />
    );
  }

  if (activeDoc === "FORM_C6") {
    return (
      <PrintFormC6
        voters={voters}
        tpsList={tpsList}
        defaultTps={isAdmin ? firstTpsName : assignedTps}
        isAdmin={isAdmin}
        onBack={() => setActiveDoc("MENU")}
      />
    );
  }

  if (activeDoc === "STIKER_COKLIT") {
    return (
      <PrintStikerCoklit
        voters={voters}
        tpsList={tpsList}
        defaultTps={isAdmin ? firstTpsName : assignedTps}
        isAdmin={isAdmin}
        onBack={() => setActiveDoc("MENU")}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full"
              >
                2. WILAYAH RW & LOGISTIK • PUSAT CETAK DOKUMEN RESMI
              </Badge>
              <span className="text-xs text-slate-400 font-medium">• Pilkades Kalisalak 2026/2027</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Printer className="w-6 h-6 text-blue-400" />
              Pusat Cetak & Unduh Dokumen Resmi Model A
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Unduh data Excel (.xlsx) dan dokumen PDF resmi untuk Model A.1 (DPS), Model A.2 (DPTb), Model A.3 (DPT Desa), dan Model A.4 (Salinan Tabung) sesuai standar regulasi pemilihan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportModelA3Excel(voters, tpsList)}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Unduh Master DPT Excel</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* SECTION 1: 4 DOKUMEN UTAMA MODEL A */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Empat (4) Format Resmi Dokumen Model A Pemilih
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Tersedia Cetak & Unduh Excel / PDF
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. MODEL A.1: DPS PILKADES (DENGAN 1 TABEL DIBAWAHNYA) */}
          <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                  <Users className="w-6 h-6" />
                </div>
                <Badge variant="warning" className="text-[10px] font-bold">
                  MODEL A.1 • DPS
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  Model A.1: Daftar Pemilih Sementara (DPS) Pilkades
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Lembar kerja pemutakhiran data pemilih. <strong className="text-amber-800">Dilengkapi 1 sub-tabel di bawahnya pada setiap 1 data daftar pemilih</strong> untuk catatan verifikasi faktual Coklit, koreksi data, dan paraf petugas.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportModelA1Excel(voters, isAdmin ? "SEMUA" : assignedTps)}
                  className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2.5"
                  title="Unduh file Excel Model A.1 lengkap dengan sub-tabel per pemilih"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportModelA1Pdf(voters, isAdmin ? "SEMUA" : assignedTps)}
                  className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 px-2.5"
                  title="Unduh dokumen PDF Model A.1"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  PDF
                </Button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveDoc("MODEL_A1_DPS")}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Buka / Cetak
              </Button>
            </div>
          </Card>

          {/* 2. MODEL A.2: DAFTAR PEMILIH TAMBAHAN (DPTb) */}
          <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                  <UserPlus className="w-6 h-6" />
                </div>
                <Badge variant="primary" className="text-[10px] font-bold">
                  MODEL A.2 • DPTb
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Model A.2: Daftar Pemilih Tambahan (DPTb)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Formulir pendaftaran dan rekapitulasi warga yang menggunakan hak pilih tambahan menggunakan KTP-el atau Surat Keterangan Pindah Masuk (SKPWNI) pasca penetapan DPS.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportModelA2Excel(voters, isAdmin ? "SEMUA" : assignedTps)}
                  className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportModelA2Pdf(voters, isAdmin ? "SEMUA" : assignedTps)}
                  className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 px-2.5"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  PDF
                </Button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveDoc("MODEL_A2_DPTB")}
                className="text-xs font-bold bg-blue-700 hover:bg-blue-600 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Buka / Cetak
              </Button>
            </div>
          </Card>

          {/* 3. MODEL A.3: DAFTAR PEMILIH TETAP (DPT) PILKADES */}
          <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <UserCheck className="w-6 h-6" />
                </div>
                <Badge variant="success" className="text-[10px] font-bold">
                  MODEL A.3 • DPT DESA
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Model A.3: Daftar Pemilih Tetap (DPT) Pilkades
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Buku Induk Resmi DPT Tingkat Desa Kalisalak hasil penetapan Rapat Pleno Terbuka P2KD. Memuat rekapitulasi 13 Tabung (L/P) dan pengesahan Ketua P2KD, Sekretaris, serta BPD.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportModelA3Excel(voters, tpsList)}
                  className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportModelA3Pdf(voters, tpsList)}
                  className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 px-2.5"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  PDF
                </Button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveDoc("MODEL_A3_DPT")}
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-600 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Buka / Cetak
              </Button>
            </div>
          </Card>

          {/* 4. MODEL A.4: SALINAN DAFTAR PEMILIH TETAP PER TABUNG */}
          <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700">
                  <FileText className="w-6 h-6" />
                </div>
                <Badge variant="primary" className="text-[10px] font-bold bg-cyan-100 text-cyan-800 border-cyan-300">
                  MODEL A.4 • SALINAN TABUNG
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Model A.4: Salinan Daftar Pemilih Tetap per Tabung
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Salinan resmi DPT per Tabung untuk dibagikan kepada Petugas Tabung, Pengawas Pemilihan, dan masing-masing Saksi Calon Kepala Desa lengkap dengan lembar Berita Acara Serah Terima.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportModelA4Excel(voters, isAdmin ? firstTpsName : assignedTps, false)}
                  className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportModelA4Pdf(voters, isAdmin ? firstTpsName : assignedTps, false)}
                  className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 px-2.5"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  PDF
                </Button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveDoc("MODEL_A4_SALINAN")}
                className="text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Buka / Cetak
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 2: DOKUMEN LOGISTIK & PEMUNGUTAN SUARA */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Dokumen Logistik & Surat Pemberitahuan Pemilih
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Berita Acara Pleno DPT (Superadmin Only) */}
          {isAdmin && (
            <Card className="p-4 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge variant={isDptLocked ? "danger" : "primary"} className="text-[10px]">
                    {isDptLocked ? "TERKUNCI" : "SIAP PLENO"}
                  </Badge>
                </div>
                <h4 className="text-xs font-black text-slate-900">
                  Berita Acara Pleno DPT (Form BA-DPT)
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Dokumen penetapan DPT memuat rekapitulasi 13 Tabung, segel digital SHA-256, dan kolom TTD Ketua P2KD, Sekretaris, & BPD.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                  {nomorBeritaAcara}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveDoc("BERITA_ACARA")}
                  className="text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Cetak BA
                </Button>
              </div>
            </Card>
          )}

          {/* 2. Surat Undangan Nyoblos (Form C6 Digital) */}
          <Card className="p-4 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Mail className="w-5 h-5" />
                </div>
                <Badge variant={dptVotersCount > 0 ? "success" : "warning"} className="text-[10px] font-bold">
                  MODEL C6 • {dptVotersCount} DPT
                </Badge>
              </div>
              <h4 className="text-xs font-black text-slate-900">
                Surat Undangan Nyoblos (Form C6)
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Cetak massal surat pemberitahuan pemilih ber-QR Code untuk 13 Tabung. Format 6 kartu undangan per lembar A4.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[10px] text-slate-500">
                6 Kartu / A4
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveDoc("FORM_C6")}
                className="text-xs font-bold bg-indigo-700 hover:bg-indigo-600"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Cetak C6
              </Button>
            </div>
          </Card>

          {/* 3. Stiker Coklit Rumah Warga */}
          <Card className="p-4 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Home className="w-5 h-5" />
                </div>
                <Badge variant="warning" className="text-[10px]">
                  MODEL A.A-PILKADES
                </Badge>
              </div>
              <h4 className="text-xs font-black text-slate-900">
                Stiker Coklit Rumah Warga
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Lembar stiker bukti pencocokan & penelitian door-to-door yang ditempel di rumah warga. Format 4 stiker per lembar A4.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[10px] text-slate-500">
                4 Stiker / A4
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveDoc("STIKER_COKLIT")}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Cetak Stiker
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
