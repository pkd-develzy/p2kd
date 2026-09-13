"use client";

import React, { useState } from "react";
import { Voter, TPSItem } from "../types";
import { Printer, ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button, ActiveQRCode, Badge, Card } from "@/components/ui";

interface PrintFormC6Props {
  voters: Voter[];
  tpsList: TPSItem[];
  defaultTps?: string;
  isAdmin: boolean;
  onBack: () => void;
}

export const PrintFormC6: React.FC<PrintFormC6Props> = ({
  voters,
  tpsList,
  defaultTps,
  isAdmin,
  onBack,
}) => {
  const [selectedTps, setSelectedTps] = useState(defaultTps || tpsList[0]?.namaTps || "SEMUA");
  const [limitPrint, setLimitPrint] = useState<number>(12); // Number of cards to preview/print

  const handlePrint = () => {
    window.print();
  };

  const tpsObj = tpsList.find((t) => t.namaTps === selectedTps) || tpsList[0];

  // STRICT FILTER: Form C6 (Surat Undangan Nyoblos) HANYA untuk pemilih berstatus DPT & AKTIF!
  const dptVotersAll = voters.filter(
    (v) => v.statusAktif === "AKTIF" && v.tahap === "DPT"
  );
  const dpsVotersCount = voters.filter(
    (v) => v.statusAktif === "AKTIF" && v.tahap !== "DPT"
  ).length;

  const tpsVoters = dptVotersAll.filter(
    (v) =>
      (tpsObj?.nomorTps ? v.tps.toLowerCase().includes(tpsObj.nomorTps.toLowerCase()) : true)
  );

  const displayedVoters = tpsVoters.slice(0, limitPrint);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://www.p2kdkalisalak.my.id";

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs w-fit">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Pusat Cetak
          </Button>

          <Badge
            variant={dptVotersAll.length > 0 ? "success" : "warning"}
            className="text-[10px] font-bold"
          >
            {dptVotersAll.length > 0
              ? `KHUSUS DPT (${dptVotersAll.length} Pemilih)`
              : "KHUSUS DPT (0 Pemilih DPT)"}
          </Badge>
        </div>

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
            <span>Jumlah Kartu:</span>
            <select
              value={limitPrint}
              onChange={(e) => setLimitPrint(Number(e.target.value))}
              disabled={tpsVoters.length === 0}
              className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold disabled:bg-slate-100"
            >
              <option value={6}>6 Pemilih (1 Lembar A4)</option>
              <option value={12}>12 Pemilih (2 Lembar A4)</option>
              <option value={24}>24 Pemilih (4 Lembar A4)</option>
              <option value={tpsVoters.length || 1}>
                Semua Pemilih DPT {selectedTps.replace(/TPS/gi, "Tabung")} ({tpsVoters.length} Kartu)
              </option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={displayedVoters.length === 0}
            className="text-xs font-bold bg-blue-700 hover:bg-blue-600 shadow-md disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Form C6 ({displayedVoters.length} Undangan)
          </Button>
        </div>
      </div>

      {/* Notice DPS Excluded (Hidden on Print) */}
      {dpsVotersCount > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Ketentuan Regulasi:</strong> Form C6 hanya dicetak untuk pemilih yang telah berstatus <strong>DPT ({dptVotersAll.length} pemilih)</strong>. Sebanyak <strong>{dpsVotersCount} pemilih berstatus DPS otomatis tidak dimasukkan</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Empty State if NO DPT Voters */}
      {dptVotersAll.length === 0 ? (
        <Card className="p-8 bg-amber-50/80 border border-amber-200 rounded-3xl text-center space-y-4 max-w-2xl mx-auto shadow-sm">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-amber-950">
              Form C6 Belum Tersedia (Masih Tahap DPS)
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed max-w-lg mx-auto">
              Surat Pemberitahuan Pemungutan Suara (Model C6-Pilkades) secara hukum <strong>hanya berlaku dan diterbitkan bagi warga yang telah disahkan ke dalam Daftar Pemilih Tetap (DPT)</strong>.
            </p>
            <p className="text-xs text-amber-800 leading-relaxed max-w-lg mx-auto">
              Saat ini, seluruh <strong>{dpsVotersCount} pemilih aktif</strong> masih berada pada tahap <strong>Daftar Pemilih Sementara (DPS)</strong> sehingga tidak dapat dibuatkan surat undangan C6.
            </p>
          </div>
          <div className="pt-2 border-t border-amber-200">
            <p className="text-[11px] text-amber-700 font-medium">
              💡 <em>Langkah Selanjutnya: Silakan tetapkan pemilih dari DPS ke DPT pada tab <strong>Master Pemilih (DPS)</strong> atau lakukan sidang pleno penetapan DPT terlebih dahulu.</em>
            </p>
          </div>
        </Card>
      ) : displayedVoters.length === 0 ? (
        <Card className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-2 max-w-2xl mx-auto">
          <p className="text-xs text-slate-500 font-medium">
            Tidak ada pemilih DPT aktif pada wilayah {selectedTps.replace(/TPS/gi, "Tabung")}.
          </p>
        </Card>
      ) : (
        /* Grid of C6 Invitation Cards (Layout for 2 columns per A4 page) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto print:grid-cols-2 print:gap-3 print:max-w-full print:m-0 print:p-0">
        {displayedVoters.map((v) => {
          const rwNum = (v.rw || "01").replace(/\D/g, "").padStart(2, "0");
          const rtNum = (v.rt || "01").replace(/\D/g, "").padStart(2, "0");
          const mejaName = v.tps && v.tps.trim() ? v.tps.replace(/Meja\s*/gi, "") : `RW ${rwNum}`;
          const maskedNik = v.nikMasked || (v.nik ? `${v.nik.slice(0, 1)}*************${v.nik.slice(-2)}` : "****************");
          const verifyUrl = `${baseUrl}/verifikasi-c6?id=${encodeURIComponent(v.id)}`;

          return (
            <div
              key={v.id}
              className="bg-white text-black p-4 rounded-xl border-2 border-dashed border-slate-400 shadow-xs text-xs font-sans relative break-inside-avoid print:border-black print:rounded-none"
            >
              {/* Header Card */}
              <div className="flex items-start justify-between border-b border-black pb-2 mb-2">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                    MODEL C6-PILKADES (SURAT PEMBERITAHUAN PEMUNGUTAN SUARA)
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-tight">
                    P2KD DESA KALISALAK TAHUN 2026 / 2027
                  </h4>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[10px] bg-black text-white px-2 py-0.5 rounded-sm print:bg-black print:text-white">
                    {mejaName}
                  </span>
                </div>
              </div>

              {/* Body Card */}
              <div className="space-y-1.5 mb-2.5 text-[10px]">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600">Nama Pemilih</span>
                  <span className="col-span-2 font-black text-black text-xs uppercase">{v.namaLengkap}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600">NIK Terdaftar</span>
                  <span className="col-span-2 font-mono font-bold">{maskedNik}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600">Lokasi Tabung</span>
                  <span className="col-span-2">{v.alamat} (RT {rtNum} / RW {rwNum})</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600">Wilayah Pemilihan</span>
                  <span className="col-span-2 font-bold text-blue-950">
                    {mejaName}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-600">Hari / Waktu</span>
                  <span className="col-span-2 font-bold text-emerald-800">
                    Rabu, 02 September 2026 • 07.00 - 13.00 WIB
                  </span>
                </div>
              </div>

              {/* Footer C6 with Active Realtime QR Code */}
              <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-600">
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0 bg-white p-0.5 rounded border border-black print:border-black">
                    <ActiveQRCode
                      value={verifyUrl}
                      size={60}
                      className="w-15 h-15"
                    />
                  </div>
                  <div className="space-y-0.5 max-w-37.5">
                    <div className="font-bold text-black text-[9px] uppercase tracking-tight">
                      QR VERIFIKASI REALTIME
                    </div>
                    <div className="text-[7.5px] leading-tight text-slate-600">
                      Scan dengan kamera HP petugas untuk cek keaslian DPT secara instan.
                    </div>
                    <div className="font-bold text-[8px] text-black">
                      Wajib bawa KTP-el / KK asli
                    </div>
                  </div>
                </div>

                <div className="text-center shrink-0">
                  <span className="font-medium">Ketua KPPS {mejaName}</span>
                  <div className="mt-5 border-b border-black w-24 mx-auto"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
};
