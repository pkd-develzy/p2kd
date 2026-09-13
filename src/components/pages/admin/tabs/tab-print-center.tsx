"use client";

import React, { useState } from "react";
import { Voter, TPSItem, AnggotaP2KD } from "../types";
import {
  Printer,
  FileText,
  Mail,
  Home,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge } from "@/components/ui";
import { PrintBeritaAcara } from "../print/print-berita-acara";
import { PrintDptTps } from "../print/print-dpt-tps";
import { PrintFormC6 } from "../print/print-form-c6";
import { PrintStikerCoklit } from "../print/print-stiker-coklit";

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

type PrintDocType = "MENU" | "BERITA_ACARA" | "DPT_TPS" | "FORM_C6" | "STIKER_COKLIT";

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

  const dptVotersCount = voters.filter((v) => v.statusAktif === "AKTIF" && v.tahap === "DPT").length;
  const dpsVotersCount = voters.filter((v) => v.statusAktif === "AKTIF" && v.tahap !== "DPT").length;

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
    <div className="space-y-5">
      {/* Hero Header */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full"
              >
                Pusat Cetak Dokumen Resmi (Print Center)
              </Badge>
              <span className="text-xs text-slate-400 font-medium">• Standar Regulasi Pilkades</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Printer className="w-6 h-6 text-blue-400" />
              Cetak Dokumen Fisik & Formulir Resmi Pilkades 2027
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Seluruh format dokumen telah disesuaikan dengan standar layout resmi kop surat desa, tanda tangan panitia, saksi, dan segel verifikasi QR Code.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a href="/api/admin/export?type=FULL" download>
              <button
                type="button"
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Unduh Master Excel (.xlsx)</span>
              </button>
            </a>
          </div>
        </div>
      </Card>

      {/* Grid Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Berita Acara Pleno DPT (Superadmin Only) */}
        {isAdmin && (
          <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                <FileText className="w-6 h-6" />
              </div>
              <Badge variant={isDptLocked ? "danger" : "primary"} className="text-[10px]">
                {isDptLocked ? "TERKUNCI & SELESAI" : "SIAP PLENO"}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">
                1. Berita Acara Pleno DPT (Form BA-DPT)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dokumen penetapan resmi DPT Pilkades Kalisalak 2026 memuat rekapitulasi L/P 7 TPS, segel digital SHA-256, dan kolom tanda tangan Ketua P2KD, Sekretaris, serta BPD.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] font-mono text-slate-600 font-semibold">
                No: {nomorBeritaAcara}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveDoc("BERITA_ACARA")}
                className="text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Buka / Cetak
              </Button>
            </div>
          </Card>
        )}

        {/* 2. Lembar DPT Resmi per TPS (Model A-Pilkades) */}
        <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Printer className="w-6 h-6" />
            </div>
            <Badge variant="success" className="text-[10px]">
              MODEL A-PILKADES
            </Badge>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">
              2. Lembar DPT Resmi per TPS (Siap Tempel)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Daftar pemilih tetap per TPS format siap cetak untuk dipasang di papan pengumuman balai desa, pos ronda, dan TPS masing-masing.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-600 font-semibold">
              {isAdmin ? `Semua (${tpsList.length}) TPS Terdaftar` : `Khusus ${assignedTps}`}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveDoc("DPT_TPS")}
              className="text-xs font-bold bg-emerald-700 hover:bg-emerald-600"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Buka / Cetak DPT
            </Button>
          </div>
        </Card>

        {/* 3. Surat Pemberitahuan / Undangan Nyoblos (Form C6 Digital) */}
        <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
              <Mail className="w-6 h-6" />
            </div>
            <Badge
              variant={dptVotersCount > 0 ? "success" : "warning"}
              className="text-[10px] font-bold"
            >
              {dptVotersCount > 0 ? `MODEL C6 • ${dptVotersCount} DPT` : "MODEL C6 • KHUSUS DPT"}
            </Badge>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">
              3. Surat Undangan Nyoblos (Form C6 Digital)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Cetak massal surat pemberitahuan pemungutan suara per warga. <strong>Hanya diterbitkan untuk pemilih berstatus DPT</strong> (pemilih berstatus DPS tidak dimasukkan).
            </p>
          </div>

          {dptVotersCount === 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Belum ada DPT ({dpsVotersCount} pemilih masih berstatus DPS). Form C6 hanya bisa dicetak setelah pemilih ditetapkan ke DPT.
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-600 font-semibold">
              Format 6 Kartu per Lembar A4
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveDoc("FORM_C6")}
              className={`text-xs font-bold ${
                dptVotersCount > 0
                  ? "bg-indigo-700 hover:bg-indigo-600"
                  : "bg-slate-600 hover:bg-slate-500"
              }`}
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Buka / Cetak C6
            </Button>
          </div>
        </Card>

        {/* 4. Lembar Stiker Coklit Lapangan (Model A.A-Pilkades) */}
        <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow space-y-3">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Home className="w-6 h-6" />
            </div>
            <Badge variant="warning" className="text-[10px]">
              MODEL A.A-PILKADES
            </Badge>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">
              4. Stiker Coklit Rumah Warga (Stiker Door-to-Door)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Lembar stiker bukti pencocokan dan penelitian (Coklit) yang ditempelkan di rumah warga setelah dicoklit oleh petugas Pantarlih.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-600 font-semibold">
              Format 4 Stiker per Lembar A4
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveDoc("STIKER_COKLIT")}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Buka / Cetak Stiker
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
