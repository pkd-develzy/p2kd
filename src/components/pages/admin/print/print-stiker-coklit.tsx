"use client";

import React, { useState } from "react";
import { Voter, TPSItem } from "../types";
import { Printer, ArrowLeft, Home } from "lucide-react";
import { Button, ActiveQRCode } from "@/components/ui";

interface PrintStikerCoklitProps {
  voters: Voter[];
  tpsList: TPSItem[];
  defaultTps?: string;
  isAdmin: boolean;
  onBack: () => void;
}

export const PrintStikerCoklit: React.FC<PrintStikerCoklitProps> = ({
  voters,
  tpsList,
  defaultTps,
  isAdmin,
  onBack,
}) => {
  const [selectedTps, setSelectedTps] = useState(defaultTps || tpsList[0]?.namaTps || "SEMUA");
  const [limitStiker, setLimitStiker] = useState<number>(4);

  const handlePrint = () => {
    window.print();
  };

  const tpsObj = tpsList.find((t) => t.namaTps === selectedTps) || tpsList[0];
  const tpsVoters = voters.filter(
    (v) =>
      v.statusAktif === "AKTIF" &&
      (tpsObj?.nomorTps ? v.tps.toLowerCase().includes(tpsObj.nomorTps.toLowerCase()) : true)
  );

  // Group by KK if available, otherwise individual
  const uniqueFamilies: { head: Voter; members: Voter[] }[] = [];
  const visitedKk = new Set<string>();

  for (const v of tpsVoters) {
    if (v.kk && v.kk.trim().length > 5) {
      if (!visitedKk.has(v.kk)) {
        visitedKk.add(v.kk);
        const members = tpsVoters.filter((m) => m.kk === v.kk);
        uniqueFamilies.push({ head: v, members });
      }
    } else {
      uniqueFamilies.push({ head: v, members: [v] });
    }
  }

  const displayedFamilies = uniqueFamilies.slice(0, limitStiker);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://www.p2kdkalisalak.my.id";

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs w-fit">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Pusat Cetak
        </Button>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Pilih Wilayah RW:</span>
            <select
              value={selectedTps}
              disabled={!isAdmin}
              onChange={(e) => setSelectedTps(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-blue-700 disabled:bg-slate-100"
            >
              {tpsList.map((t) => (
                <option key={t.id} value={t.namaTps}>
                  {t.namaTps} ({t.lokasi})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Jumlah Stiker:</span>
            <select
              value={limitStiker}
              onChange={(e) => setLimitStiker(Number(e.target.value))}
              className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
            >
              <option value={4}>4 Stiker Rumah (1 Lembar A4)</option>
              <option value={8}>8 Stiker Rumah (2 Lembar A4)</option>
              <option value={16}>16 Stiker Rumah (4 Lembar A4)</option>
              <option value={uniqueFamilies.length}>Semua Stiker {selectedTps} ({uniqueFamilies.length} Rumah)</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-bold bg-amber-600 hover:bg-amber-500 shadow-md text-white"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Stiker Coklit ({displayedFamilies.length} Rumah)
          </Button>
        </div>
      </div>

      {/* Grid Stiker Coklit (4 Stiker per A4 sheet) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto print:grid-cols-2 print:gap-4 print:max-w-full print:m-0 print:p-0">
        {displayedFamilies.map(({ head, members }) => {
          const rwNum = (head.rw || "01").replace(/\D/g, "").padStart(2, "0");
          const rtNum = (head.rt || "01").replace(/\D/g, "").padStart(2, "0");
          const maskedKk = head.kk && head.kk.length > 5
            ? `${head.kk.slice(0, 1)}*************${head.kk.slice(-2)}`
            : "****************";
          const qrPayloadUrl = `${baseUrl}/stiker-coklit?kk=${encodeURIComponent(head.kk || "")}&id=${encodeURIComponent(head.id)}`;

          return (
            <div
              key={head.id}
              className="bg-amber-50/60 text-black p-4 rounded-2xl border-3 border-amber-600 shadow-sm font-sans break-inside-avoid print:rounded-none print:border-black"
            >
              {/* Header Stiker */}
              <div className="text-center border-b-2 border-amber-600 pb-2 mb-2.5">
                <div className="text-[9.5px] font-black uppercase tracking-widest text-amber-900 flex items-center justify-center gap-1">
                  <Home className="w-3 h-3 text-amber-700" /> MODEL A.A-PILKADES (STIKER COKLIT)
                </div>
                <h3 className="text-xs font-black uppercase text-slate-950 mt-0.5">
                  TANDA BUKTI PENDAFTARAN & COKLIT PEMILIH
                </h3>
                <p className="text-[9px] font-semibold text-slate-700">
                  P2KD Desa Kalisalak • Kecamatan Margasari • Kabupaten Tegal
                </p>
              </div>

              {/* Data Rumah & KK */}
              <div className="space-y-1 text-[11px] mb-2.5 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600 font-medium">No. KK (Sensor)</span>
                  <span className="col-span-2 font-mono font-bold">{maskedKk}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600 font-medium">Kepala Keluarga</span>
                  <span className="col-span-2 font-black uppercase text-slate-900">{head.namaLengkap}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600 font-medium">Alamat Rumah</span>
                  <span className="col-span-2">{head.alamat} (RT {rtNum}/RW {rwNum})</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600 font-medium">Pemilih Terdaftar</span>
                  <span className="col-span-2 font-bold text-amber-900">
                    {members.length} Orang ({members.map((m) => m.namaLengkap).slice(0, 2).join(", ")}{members.length > 2 ? ", dkk" : ""})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600 font-medium">Wilayah Pemilihan</span>
                  <span className="col-span-2 font-bold text-blue-900">
                    RW {rwNum}
                  </span>
                </div>
              </div>

              {/* Footer Stiker with Active QR Code */}
              <div className="pt-2 border-t border-amber-300 flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-0.5 rounded border border-black shrink-0">
                    <ActiveQRCode value={qrPayloadUrl} size={54} className="w-13.5 h-13.5" />
                  </div>
                  <div className="space-y-0.5 max-w-30">
                    <div className="font-bold text-black text-[8px] uppercase">
                      SCAN QR COKLIT
                    </div>
                    <div className="text-[7px] text-slate-700 leading-tight">
                      Pindai untuk melihat daftar pemilih sah di rumah ini secara mandiri & aman.
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-4 shrink-0">
                  <span className="block font-medium">Petugas Pantarlih RW {rwNum}</span>
                  <div className="border-b border-black w-24 mx-auto"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
