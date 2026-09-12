"use client";

import React, { useState } from "react";
import { Voter, TPSItem, AnggotaP2KD } from "../types";
import { Printer, ArrowLeft, ShieldCheck, QrCode } from "lucide-react";
import { Button } from "@/components/ui";

interface PrintBeritaAcaraProps {
  nomorBeritaAcara: string;
  isDptLocked: boolean;
  lockHashSignature: string;
  voters: Voter[];
  tpsList: TPSItem[];
  anggotaList?: AnggotaP2KD[];
  onBack: () => void;
}

const HARI_INDO = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN_INDO = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function angkaKeTeks(n: number): string {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  if (n < 12) return bilangan[n];
  if (n < 20) return `${angkaKeTeks(n - 10)} Belas`;
  if (n < 100) return `${angkaKeTeks(Math.floor(n / 10))} Puluh ${angkaKeTeks(n % 10)}`.trim();
  if (n < 200) return `Seratus ${angkaKeTeks(n - 100)}`.trim();
  if (n < 1000) return `${angkaKeTeks(Math.floor(n / 100))} Ratus ${angkaKeTeks(n % 100)}`.trim();
  if (n < 2000) return `Seribu ${angkaKeTeks(n - 1000)}`.trim();
  if (n < 1000000) return `${angkaKeTeks(Math.floor(n / 1000))} Ribu ${angkaKeTeks(n % 1000)}`.trim();
  return String(n);
}

export const PrintBeritaAcara: React.FC<PrintBeritaAcaraProps> = ({
  nomorBeritaAcara,
  lockHashSignature,
  voters,
  tpsList,
  anggotaList = [],
  onBack,
}) => {
  const [printDate, setPrintDate] = useState<Date>(() => new Date());

  const handlePrint = () => {
    setPrintDate(new Date());
    window.print();
  };

  const now = printDate;
  const dayName = HARI_INDO[now.getDay()];
  const dateNum = now.getDate();
  const dateText = angkaKeTeks(dateNum);
  const monthName = BULAN_INDO[now.getMonth()];
  const yearNum = now.getFullYear();
  const yearText = angkaKeTeks(yearNum);
  const formattedNumericDate = `${String(dateNum).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${yearNum}`;
  const fullFormalDate = `${dateNum} ${monthName} ${yearNum}`;

  const activeVoters = voters.filter((v) => v.statusAktif === "AKTIF");
  const totalLaki = activeVoters.filter((v) => String(v.jenisKelamin).toUpperCase().startsWith("L")).length;
  const totalPerempuan = activeVoters.filter((v) => !String(v.jenisKelamin).toUpperCase().startsWith("L")).length;

  // Dynamic Signatories from Database Anggota List
  const ketuaP2KD =
    anggotaList.find(
      (a) =>
        a.jabatan.toLowerCase().includes("ketua p2kd") ||
        (a.seksi === "PIMPINAN" && a.jabatan.toLowerCase().includes("ketua"))
    ) ||
    anggotaList.find((a) => a.seksi === "PIMPINAN") || {
      namaLengkap: "Khasanudin, S.Pd.SD",
      jabatan: "Ketua P2KD",
    };

  const sekretarisP2KD =
    anggotaList.find(
      (a) =>
        a.jabatan.toLowerCase().includes("sekretaris") &&
        !a.jabatan.toLowerCase().includes("bpd")
    ) || {
      namaLengkap: "Mashady, M.H.",
      jabatan: "Sekretaris P2KD",
    };

  const ketuaBPD =
    anggotaList.find((a) => a.jabatan.toLowerCase().includes("bpd")) || {
      namaLengkap: "H. Sutarto, M.M.",
      jabatan: "Ketua BPD Kalisalak",
    };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Pusat Cetak
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Disarankan: Kertas A4 / F4 (Portrait), Margin Default
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-bold bg-blue-700 hover:bg-blue-600 shadow-md"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Dokumen (Print / PDF)
          </Button>
        </div>
      </div>

      {/* Official Document Sheet */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop Surat Resmi */}
        <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide">
            PANITIA PEMILIHAN KEPALA DESA (P2KD)
          </h3>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">
            DESA KALISALAK KECAMATAN MARGASARI
          </h2>
          <h3 className="text-sm font-bold uppercase">
            KABUPATEN TEGAL PROVINSI JAWA TENGAH
          </h3>
          <p className="text-[11px] font-sans text-slate-700 italic mt-1">
            Sekretariat: Jl. K. Abdullatif, Balai Desa Kalisalak, Margasari 52463
          </p>
        </div>

        {/* Judul Berita Acara */}
        <div className="text-center mb-6">
          <h4 className="text-base font-black underline uppercase tracking-wide">
            BERITA ACARA PLENO PENETAPAN
          </h4>
          <h5 className="text-xs font-bold uppercase mt-0.5">
            DAFTAR PEMILIH TETAP (DPT) PILKADES KALISALAK PERIODE 2027 – 2035
          </h5>
          <p className="font-mono text-xs font-bold mt-1">
            Nomor: {nomorBeritaAcara || "BA/01/P2KD-KLS/XII/2026"}
          </p>
        </div>

        {/* Isi Dokumen (Otomatis Tertanggal Realtime) */}
        <div className="text-xs leading-relaxed space-y-3 text-justify font-sans">
          <p>
            Pada hari ini, <strong>{dayName}</strong> tanggal <strong>{dateText}</strong> bulan{" "}
            <strong>{monthName}</strong> tahun <strong>{yearText}</strong> ({formattedNumericDate}), bertempat di Balai Desa Kalisalak, Panitia Pemilihan Kepala Desa (P2KD) Kalisalak telah melaksanakan Rapat Pleno Terbuka Penetapan Daftar Pemilih Tetap (DPT) Pemilihan Kepala Desa Kalisalak Periode 2027–2035.
          </p>
          <p>
            Rapat Pleno dihadiri oleh segenap Anggota P2KD, Koordinator Lapangan Wilayah RW 01 s/d RW 13, BPD, Perangkat Desa, serta Saksi dari masing-masing Calon Kepala Desa.
          </p>
          <p>
            Berdasarkan hasil rekapitulasi akhir pemutakhiran data pemilih, perbaikan DPSHP, dan penanganan tanggapan masyarakat, P2KD Kalisalak menetapkan rekapitulasi DPT sebagai berikut:
          </p>
        </div>

        {/* Tabel Rekapitulasi 13 Wilayah RW */}
        <div className="my-5">
          <table className="w-full text-xs font-sans border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 font-bold text-center">
                <th className="border border-black p-2 w-10">NO</th>
                <th className="border border-black p-2">WILAYAH RW</th>
                <th className="border border-black p-2">LOKASI PEMUNGUTAN SUARA</th>
                <th className="border border-black p-2 w-16">L</th>
                <th className="border border-black p-2 w-16">P</th>
                <th className="border border-black p-2 w-20">TOTAL DPT</th>
              </tr>
            </thead>
            <tbody>
              {tpsList.map((t, idx) => {
                const rwNum = t.nomorTps.replace(/\D/g, "").padStart(2, "0");
                const votersInRw = activeVoters.filter((v) => {
                  const vRw = (v.rw || "").replace(/\D/g, "").padStart(2, "0");
                  return vRw === rwNum || (v.tps && v.tps.includes(t.nomorTps));
                });
                const l = votersInRw.filter((v) => String(v.jenisKelamin).toUpperCase().startsWith("L")).length;
                const p = votersInRw.filter((v) => !String(v.jenisKelamin).toUpperCase().startsWith("L")).length;
                return (
                  <tr key={t.id} className="text-center">
                    <td className="border border-black p-1.5">{idx + 1}</td>
                    <td className="border border-black p-1.5 font-bold text-left">{t.namaTps}</td>
                    <td className="border border-black p-1.5 text-left">{t.lokasi}</td>
                    <td className="border border-black p-1.5">{l}</td>
                    <td className="border border-black p-1.5">{p}</td>
                    <td className="border border-black p-1.5 font-bold">{votersInRw.length}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-black text-center">
                <td colSpan={3} className="border border-black p-2 text-right">
                  TOTAL REKAPITULASI DPT DESA KALISALAK
                </td>
                <td className="border border-black p-2">{totalLaki}</td>
                <td className="border border-black p-2">{totalPerempuan}</td>
                <td className="border border-black p-2 text-blue-950 font-black">{activeVoters.length}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Security & SHA-256 Hash */}
        <div className="p-3 my-4 rounded border border-slate-400 bg-slate-50 font-sans text-[11px] flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="font-bold flex items-center gap-1.5 text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Segel Keamanan Kriptografi SHA-256 P2KD Kalisalak
            </div>
            <div className="font-mono text-[10px] text-slate-700 break-all">
              {lockHashSignature || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center">
            <QrCode className="w-10 h-10 text-slate-800" />
            <span className="text-[8px] text-slate-500">KODE OTENTIKASI</span>
          </div>
        </div>

        {/* Tanda Tangan Pleno (Otomatis Sesuai Data Anggota & Tanggal) */}
        <div className="mt-8 font-sans text-xs">
          <div className="text-center font-bold mb-6">
            Ditetapkan di: Kalisalak • Pada tanggal: {fullFormalDate}
            <div className="text-sm uppercase mt-0.5">PANITIA PEMILIHAN KEPALA DESA KALISALAK</div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-16">
              <div className="font-bold">{ketuaP2KD.jabatan || "Ketua P2KD"}</div>
              <div>
                <strong className="underline block uppercase">{ketuaP2KD.namaLengkap}</strong>
                <span className="text-[10px] text-slate-600">NIP. -</span>
              </div>
            </div>

            <div className="space-y-16">
              <div className="font-bold">{sekretarisP2KD.jabatan || "Sekretaris P2KD"}</div>
              <div>
                <strong className="underline block uppercase">{sekretarisP2KD.namaLengkap}</strong>
                <span className="text-[10px] text-slate-600">NIP. -</span>
              </div>
            </div>

            <div className="space-y-16">
              <div className="font-bold">{ketuaBPD.jabatan || "Ketua BPD Kalisalak"}</div>
              <div>
                <strong className="underline block uppercase">{ketuaBPD.namaLengkap}</strong>
                <span className="text-[10px] text-slate-600">NIP. -</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
