"use client";

import React, { useState } from "react";
import { Voter, TPSItem } from "../types";
import { Printer, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button, ActiveQRCode, Badge, Card } from "@/components/ui";
import { formatNomorManual } from "@/regulations";

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
  const [limitPrint, setLimitPrint] = useState<number>(10);
  const [nomorUndanganManual, setNomorUndanganManual] = useState<string>("");
  const [tanggalPencoblosan, setTanggalPencoblosan] = useState<string>("Rabu, 02 September 2026");
  const [jamPencoblosan, setJamPencoblosan] = useState<string>("07.00 - 13.00 WIB");

  const handlePrint = () => {
    window.print();
  };

  const tpsObj = tpsList.find((t) => t.namaTps === selectedTps) || tpsList[0];

  // Form C6 (Surat Undangan Resmi) HANYA untuk pemilih berstatus DPT & AKTIF
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

  // Sesuai Perbup Tegal, format default nomor surat adalah titik-titik manual
  const displayNomorSurat = formatNomorManual(nomorUndanganManual, "...... / Pan Pilkades / ...... / ......");

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
              ? `LAMPIRAN XXXVIII PERBUP TEGAL • ${dptVotersAll.length} DPT`
              : "KHUSUS DPT (0 Pemilih DPT)"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Pilih Wilayah:</span>
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
              <option value={4}>4 Pemilih (2 Lembar A4)</option>
              <option value={10}>10 Pemilih (5 Lembar A4)</option>
              <option value={20}>20 Pemilih (10 Lembar A4)</option>
              <option value={tpsVoters.length || 1}>
                Semua Pemilih {selectedTps} ({tpsVoters.length} Kartu)
              </option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Nomor Manual:</span>
            <input
              type="text"
              value={nomorUndanganManual}
              onChange={(e) => setNomorUndanganManual(e.target.value)}
              placeholder="Kosongkan untuk titik-titik"
              className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 font-mono w-40 bg-white"
              title="Sesuai Perbup Tegal, nomor surat dikosongkan agar diisi/dicap manual oleh Panitia"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Hari & Tgl:</span>
            <input
              type="text"
              value={tanggalPencoblosan}
              onChange={(e) => setTanggalPencoblosan(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg border border-slate-300 w-36 bg-white font-medium"
              title="Tanggal pelaksanaan pemungutan suara"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Waktu:</span>
            <input
              type="text"
              value={jamPencoblosan}
              onChange={(e) => setJamPencoblosan(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg border border-slate-300 w-28 bg-white font-medium"
              title="Jam pelaksanaan pemungutan suara"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={displayedVoters.length === 0}
            className="text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white shadow-md disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Undangan
          </Button>
        </div>
      </div>

      {/* Warning jika masih DPS */}
      {dptVotersAll.length === 0 ? (
        <Card className="p-8 bg-amber-50/80 border border-amber-200 rounded-3xl text-center space-y-4 max-w-2xl mx-auto shadow-sm">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-amber-950">
              Surat Undangan Pemilih Belum Tersedia (Masih Tahap DPS)
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed max-w-lg mx-auto">
              Sesuai Peraturan Bupati Tegal Nomor 27 Tahun 2018 Lampiran XXXVIII, Surat Undangan/Pemberitahuan Pemungutan Suara <strong>hanya dapat diterbitkan bagi warga yang telah disahkan ke dalam Daftar Pemilih Tetap (DPT)</strong>.
            </p>
            <p className="text-xs text-amber-800 leading-relaxed max-w-lg mx-auto">
              Saat ini terdapat <strong>{dpsVotersCount} pemilih</strong> masih berstatus <strong>Daftar Pemilih Sementara (DPS)</strong>. Silakan selesaikan rapat pleno penetapan DPT terlebih dahulu.
            </p>
          </div>
        </Card>
      ) : displayedVoters.length === 0 ? (
        <Card className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-2 max-w-2xl mx-auto">
          <p className="text-xs text-slate-500 font-medium">
            Tidak ada pemilih DPT aktif pada wilayah {selectedTps}.
          </p>
        </Card>
      ) : (
        /* Lembar Surat Undangan Resmi Sesuai Lampiran XXXVIII Perbup Tegal No. 27 Tahun 2018 */
        <div className="space-y-6 max-w-4xl mx-auto print:space-y-0 print:max-w-full">
          {displayedVoters.map((v) => {
            const rwNum = (v.rw || "01").replace(/\D/g, "").padStart(2, "0");
            const rtNum = (v.rt || "01").replace(/\D/g, "").padStart(2, "0");
            const verifyUrl = `${baseUrl}/verifikasi-c6?id=${encodeURIComponent(v.id)}`;
            const tpsAlamat = tpsObj?.lokasi || `Wilayah RW ${rwNum}`;

            return (
              <div
                key={v.id}
                className="bg-white text-black p-6 sm:p-8 rounded-2xl border-2 border-slate-300 shadow-md font-sans text-xs break-inside-avoid print:shadow-none print:border-black print:rounded-none print:p-6 print:m-0 print:mb-8"
              >
                {/* Header Dokumen Lampiran Resmi */}
                <div className="flex justify-between items-start text-[9px] text-slate-500 mb-2 border-b border-slate-200 pb-1">
                  <span>MODEL C6-PILKADES</span>
                  <span className="font-bold uppercase tracking-wider">
                    LAMPIRAN XXXVIII PERBUP TEGAL NO. 27 TAHUN 2018
                  </span>
                </div>

                {/* Kop Panitia Pemilihan Kepala Desa */}
                <div className="text-center border-b-2 border-black pb-2 mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    PANITIA PEMILIHAN KEPALA DESA
                  </h3>
                  <h2 className="text-sm font-black uppercase tracking-wide">
                    DESA KALISALAK KECAMATAN MARGASARI
                  </h2>
                  <h3 className="text-xs font-bold uppercase">
                    KABUPATEN TEGAL
                  </h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Sekretariat: Gedung Balai Desa Kalisalak, Jl. K. Abdul Latief, Kalisalak, Margasari 52463
                  </p>
                </div>

                {/* Nomor & Tujuan Surat (Format Asli Perbup) */}
                <div className="flex justify-between items-start mb-4 text-[11px] leading-relaxed">
                  <div className="space-y-0.5">
                    <div>{displayNomorSurat}</div>
                    <div>Lampiran : -</div>
                    <div>Perihal : <strong>Undangan Pemungutan Suara</strong></div>
                  </div>

                  <div className="text-left w-56">
                    <p>Kepada</p>
                    <p>Yth. Sdr/Sdri. <strong className="uppercase">{v.namaLengkap}</strong></p>
                    <p className="text-slate-700">Alamat: RT {rtNum} / RW {rwNum}, Desa Kalisalak</p>
                    <p className="mt-0.5">di - <span className="underline">Tempat</span></p>
                  </div>
                </div>

                {/* Isi Surat Undangan */}
                <div className="space-y-2.5 text-[11px] leading-relaxed text-justify mb-5">
                  <p>
                    Mengharap dengan hormat atas kehadiran Bapak/Ibu/Saudara/Saudari besok pada:
                  </p>

                  <div className="pl-6 space-y-1">
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-3 font-semibold">Hari / Tanggal</span>
                      <span className="col-span-1">:</span>
                      <span className="col-span-8 font-bold">{tanggalPencoblosan}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-3 font-semibold">Waktu / Jam</span>
                      <span className="col-span-1">:</span>
                      <span className="col-span-8 font-bold">{jamPencoblosan}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-3 font-semibold">Tempat TPS</span>
                      <span className="col-span-1">:</span>
                      <span className="col-span-8 font-bold">{selectedTps} ({tpsAlamat})</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-3 font-semibold">Acara</span>
                      <span className="col-span-1">:</span>
                      <span className="col-span-8">
                        Pemungutan suara dalam rangka Pemilihan Kepala Desa Kalisalak Kecamatan Margasari Kabupaten Tegal.
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 text-slate-800">
                      <span className="col-span-3 font-semibold">Keterangan</span>
                      <span className="col-span-1">:</span>
                      <span className="col-span-8 italic font-semibold">
                        Hadir dengan membawa Surat Undangan ini dan KTP-el / Surat Keterangan Kependudukan.
                      </span>
                    </div>
                  </div>

                  <p className="pt-1">
                    Demikian untuk menjadikan perhatian, atas kehadirannya disampaikan terima kasih.
                  </p>
                </div>

                {/* Tanda Tangan Penerima & Panitia */}
                <div className="grid grid-cols-2 gap-4 text-[11px] pt-2 mb-6">
                  <div className="space-y-12">
                    <div>
                      <p>Diterima Tanggal: ....................................</p>
                      <p className="mt-1">Yang Menerima,</p>
                    </div>
                    <div>
                      <p className="border-b border-black w-40"></p>
                      <p className="text-[10px] text-slate-500 mt-0.5">(Nama Terang Pemilih)</p>
                    </div>
                  </div>

                  <div className="text-right space-y-12">
                    <div>
                      <p className="font-bold uppercase">PANITIA PEMILIHAN KEPALA DESA</p>
                      <p className="font-bold uppercase">DESA KALISALAK</p>
                      <p className="mt-1 font-semibold">Ketua,</p>
                    </div>
                    <div>
                      <p className="font-bold underline uppercase">KHASANUDIN, S.Pd.SD</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">(Tanda tangan & Cap)</p>
                    </div>
                  </div>
                </div>

                {/* Garis Potong Resmi Sesuai Perbup ("Potong di-sini") */}
                <div className="relative my-4">
                  <div className="border-t-2 border-dashed border-black"></div>
                  <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest print:bg-white">
                    ✂ Potong di sini (Tanda Terima Petugas KPPS) ✂
                  </div>
                </div>

                {/* Bagian Bukti Penerimaan / Tanda Terima */}
                <div className="pt-2 text-[10.5px] leading-relaxed">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-wide">
                        BUKTI TANDA TERIMA SURAT UNDANGAN PEMILIHAN KEPALA DESA
                      </p>
                      <div className="grid grid-cols-12 gap-1 text-[10px]">
                        <span className="col-span-3 text-slate-600">Nama Pemilih</span>
                        <span className="col-span-1">:</span>
                        <span className="col-span-8 font-bold uppercase">{v.namaLengkap}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 text-[10px]">
                        <span className="col-span-3 text-slate-600">Nomor NIK</span>
                        <span className="col-span-1">:</span>
                        <span className="col-span-8 font-mono">{v.nikMasked || v.nik}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 text-[10px]">
                        <span className="col-span-3 text-slate-600">Alamat / Wilayah</span>
                        <span className="col-span-1">:</span>
                        <span className="col-span-8">{v.alamat} (RT {rtNum} / RW {rwNum}) - {selectedTps}</span>
                      </div>
                    </div>

                    {/* QR Code Verifikasi Kehadiran */}
                    <div className="text-center shrink-0 pl-4">
                      <div className="bg-white p-1 rounded border border-black inline-block">
                        <ActiveQRCode value={verifyUrl} size={50} />
                      </div>
                      <p className="text-[8px] font-mono text-slate-500 mt-0.5">Scan Hadir</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3 text-[10px]">
                    <div>
                      <p>Tanggal Penyerahan: ....................................</p>
                      <div className="mt-8">
                        <p className="border-b border-black w-36"></p>
                        <p className="text-[9px] text-slate-500">Tanda Tangan Pemilih / Keluarga</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p>Petugas Pengantar (P2KD/KPPS):</p>
                      <div className="mt-8">
                        <p className="border-b border-black w-36 ml-auto"></p>
                        <p className="text-[9px] text-slate-500">Nama Terang Petugas</p>
                      </div>
                    </div>
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
