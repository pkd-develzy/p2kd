"use client";

import React, { useState } from "react";
import { Voter, TPSItem, AnggotaP2KD } from "../types";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { formatNomorManual } from "@/regulations";
import { KONSIDERAN_HUKUM_PILKADES } from "@/lib/regulations/document-templates";

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
  const [docType, setDocType] = useState<"BERITA_ACARA" | "SK_LAMPIRAN_XVII">("BERITA_ACARA");
  const [customNomor, setCustomNomor] = useState<string>(nomorBeritaAcara || "");

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
  const totalPemilih = activeVoters.length;

  // Nomor Dokumen: Sesuai regulasi, jika tidak diisi manual oleh panitia, tampilkan garis titik-titik kosong
  const displayNomor = formatNomorManual(customNomor, "............................................................");

  // Pejabat Penandatangan Dinamis dari Database Anggota
  const ketuaP2KD =
    anggotaList.find(
      (a) =>
        a.jabatan.toLowerCase().includes("ketua p2kd") ||
        (a.seksi === "PIMPINAN" && a.jabatan.toLowerCase().includes("ketua"))
    ) ||
    anggotaList.find((a) => a.seksi === "PIMPINAN") || {
      namaLengkap: "Khasanudin, S.Pd.SD",
      jabatan: "Ketua Panitia",
    };

  const sekretarisP2KD =
    anggotaList.find(
      (a) =>
        a.jabatan.toLowerCase().includes("sekretaris") &&
        !a.jabatan.toLowerCase().includes("bpd")
    ) || {
      namaLengkap: "Mashady, M.H.",
      jabatan: "Sekretaris Panitia",
    };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Pusat Cetak
          </Button>

          {/* Selector Jenis Dokumen Resmi */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDocType("BERITA_ACARA")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                docType === "BERITA_ACARA"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Berita Acara Pleno DPT
            </button>
            <button
              onClick={() => setDocType("SK_LAMPIRAN_XVII")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                docType === "SK_LAMPIRAN_XVII"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. SK Penetapan DPT (Lampiran XVII)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Input Manual Nomor Dokumen */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Nomor Manual:</span>
            <input
              type="text"
              value={customNomor}
              onChange={(e) => setCustomNomor(e.target.value)}
              placeholder="Kosongkan untuk titik-titik"
              className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 font-mono w-48 bg-white focus:ring-1 focus:ring-blue-500"
              title="Sesuai Perbup Tegal, nomor dokumen dikosongkan agar dapat diisi/dicap manual oleh Panitia"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-bold bg-blue-700 hover:bg-blue-600 shadow-md"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Dokumen
          </Button>
        </div>
      </div>

      {/* Official Document Sheet */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop Surat Resmi Sesuai Perbup Tegal No 27 Tahun 2018 */}
        <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider">
            PANITIA PEMILIHAN KEPALA DESA
          </h3>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">
            DESA KALISALAK KECAMATAN MARGASARI
          </h2>
          <h3 className="text-sm font-bold uppercase">
            KABUPATEN TEGAL
          </h3>
          <p className="text-[11px] font-sans text-slate-700 mt-1">
            Sekretariat: Gedung Balai Desa Kalisalak, Jl. K. Abdul Latief, Kalisalak, Kec. Margasari, Kab. Tegal 52463
          </p>
        </div>

        {/* TAMPILAN 1: BERITA ACARA PLENO DPT */}
        {docType === "BERITA_ACARA" && (
          <>
            <div className="text-center mb-6">
              <h4 className="text-base font-black underline uppercase tracking-wide">
                BERITA ACARA
              </h4>
              <h5 className="text-xs font-bold uppercase mt-0.5">
                RAPAT PLENO PENETAPAN DAFTAR PEMILIH TETAP (DPT)
              </h5>
              <h5 className="text-xs font-bold uppercase">
                PEMILIHAN KEPALA DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL
              </h5>
              <p className="font-mono text-xs font-bold mt-2">
                NOMOR : {displayNomor}
              </p>
            </div>

            <div className="text-xs leading-relaxed space-y-3 text-justify font-sans">
              <p>
                Pada hari ini, <strong>{dayName}</strong> tanggal <strong>{dateText}</strong> bulan{" "}
                <strong>{monthName}</strong> tahun <strong>{yearText}</strong> ({formattedNumericDate}), bertempat di Sekretariat Panitia Pemilihan Kepala Desa Kalisalak, Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak Kecamatan Margasari Kabupaten Tegal telah melaksanakan Rapat Pleno Terbuka Penetapan Daftar Pemilih Tetap (DPT) Pemilihan Kepala Desa Kalisalak.
              </p>
              <p>
                Rapat Pleno dilaksanakan dengan mempedomani ketentuan Peraturan Bupati Tegal Nomor 27 Tahun 2018 tentang Petunjuk Pelaksanaan Peraturan Daerah Kabupaten Tegal Nomor 6 Tahun 2015 tentang Tata Cara Pemilihan Kepala Desa sebagaimana telah diubah dengan Peraturan Bupati Tegal Nomor 31 Tahun 2019.
              </p>
              <p>
                Rapat Pleno dihadiri oleh Ketua dan Anggota Panitia Pemilihan Kepala Desa, Panitia Pengawas/BPD, Perangkat Desa, serta para Bakal Calon/Calon Kepala Desa atau Saksi.
              </p>
              <p>
                Berdasarkan hasil rekapitulasi pemutakhiran data pemilih, pengumuman Daftar Pemilih Sementara (DPS), pencatatan Daftar Pemilih Tambahan, serta penanganan tanggapan dan masukan masyarakat, Panitia Pemilihan Kepala Desa menetapkan:
              </p>
            </div>

            {/* Tabel Rekapitulasi Wilayah */}
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
                      TOTAL REKAPITULASI DPT TINGKAT DESA
                    </td>
                    <td className="border border-black p-2">{totalLaki}</td>
                    <td className="border border-black p-2">{totalPerempuan}</td>
                    <td className="border border-black p-2">{totalPemilih}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs font-sans leading-relaxed text-justify mt-3">
              Demikian Berita Acara ini dibuat dengan sebenarnya dan ditandatangani oleh Ketua dan Anggota Panitia Pemilihan Kepala Desa untuk dapat dipergunakan sebagaimana mestinya.
            </p>
          </>
        )}

        {/* TAMPILAN 2: SK PANITIA LAMPIRAN XVII PERBUP TEGAL NO 27 TAHUN 2018 */}
        {docType === "SK_LAMPIRAN_XVII" && (
          <>
            <div className="text-right text-[10px] font-sans font-bold uppercase mb-4 text-slate-500">
              LAMPIRAN XVII PERBUP TEGAL NO. 27 TAHUN 2018 JO NO. 31 TAHUN 2019
            </div>

            <div className="text-center mb-6">
              <h4 className="text-sm font-bold uppercase">
                KEPUTUSAN PANITIA PEMILIHAN KEPALA DESA
              </h4>
              <h4 className="text-sm font-bold uppercase">
                DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL
              </h4>
              <p className="font-mono text-xs font-bold mt-2">
                NOMOR : {displayNomor}
              </p>
              <h5 className="text-xs font-black uppercase tracking-wide mt-3">
                TENTANG
              </h5>
              <h5 className="text-xs font-black uppercase tracking-wide mt-0.5">
                PENETAPAN DAFTAR PEMILIH TETAP (DPT) PEMILIHAN KEPALA DESA
              </h5>
              <h5 className="text-xs font-black uppercase tracking-wide">
                DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL
              </h5>
            </div>

            <div className="text-xs font-sans leading-relaxed space-y-3 text-justify">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-2 font-bold">Menimbang</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <div className="col-span-9 space-y-1">
                  <p>
                    a. bahwa untuk melaksanakan ketentuan Pasal 28 Peraturan Bupati Tegal Nomor 27 Tahun 2018 tentang Petunjuk Pelaksanaan Peraturan Daerah Kabupaten Tegal Nomor 6 Tahun 2015 tentang Tata Cara Pemilihan Kepala Desa sebagaimana telah diubah dengan Peraturan Bupati Tegal Nomor 31 Tahun 2019, perlu menetapkan Daftar Pemilih Tetap (DPT);
                  </p>
                  <p>
                    b. bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a, perlu menetapkan Keputusan Panitia Pemilihan Kepala Desa tentang Penetapan Daftar Pemilih Tetap (DPT) Pemilihan Kepala Desa Kalisalak;
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 pt-2">
                <span className="col-span-2 font-bold">Mengingat</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <div className="col-span-9 space-y-1">
                  {KONSIDERAN_HUKUM_PILKADES.map((k, i) => (
                    <p key={i}>
                      {i + 1}. {k}
                    </p>
                  ))}
                </div>
              </div>

              <div className="text-center font-bold py-2 uppercase tracking-wide">
                MEMUTUSKAN:
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-2 font-bold">Menetapkan</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <div className="col-span-9 space-y-2">
                  <p>
                    <strong>KESATU :</strong> Menetapkan Daftar Pemilih Tetap (DPT) Pemilihan Kepala Desa Kalisalak Kecamatan Margasari Kabupaten Tegal sebagaimana tercantum dalam Lampiran yang merupakan bagian tidak terpisahkan dari Keputusan ini.
                  </p>
                  <p>
                    <strong>KEDUA :</strong> Jumlah pemilih dalam Daftar Pemilih Tetap (DPT) sebagaimana dimaksud pada Diktum KESATU sebanyak <strong>{totalPemilih}</strong> orang, terdiri dari laki-laki <strong>{totalLaki}</strong> orang dan perempuan <strong>{totalPerempuan}</strong> orang.
                  </p>
                  <p>
                    <strong>KETIGA :</strong> Daftar Pemilih Tetap (DPT) yang telah ditetapkan ini bersifat sah, final, dan mengikat serta tidak dapat diubah kembali.
                  </p>
                  <p>
                    <strong>KEEMPAT :</strong> Keputusan ini mulai berlaku pada tanggal ditetapkan.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tanda Tangan Resmi Sesuai Format Perbup */}
        <div className="mt-8 pt-4 border-t border-slate-300 font-sans text-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-slate-700">
              <p>Ditetapkan di : Kalisalak</p>
              <p>Pada tanggal : {fullFormalDate}</p>
              {lockHashSignature && (
                <p className="font-mono text-[10px] text-slate-400 mt-2">
                  Segel Digital: {lockHashSignature.slice(0, 20)}...
                </p>
              )}
            </div>

            <div className="text-center w-64">
              <p className="font-bold uppercase">
                PANITIA PEMILIHAN KEPALA DESA
              </p>
              <p className="font-bold uppercase">DESA KALISALAK</p>
              <p className="font-bold uppercase mt-1">KETUA,</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-slate-300 italic text-[11px]">(Tanda tangan & Cap Resmi)</span>
              </div>
              <p className="font-bold underline uppercase">{ketuaP2KD.namaLengkap}</p>
            </div>
          </div>

          {/* Kolom Tanda Tangan Anggota Panitia (Format Perbup) */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-300">
            <p className="font-bold text-center mb-4 uppercase text-[11px]">
              ANGGOTA PANITIA PEMILIHAN KEPALA DESA:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-[10px]">
              <div className="space-y-8">
                <p className="font-medium">1. {sekretarisP2KD.namaLengkap}</p>
                <p className="border-b border-black w-32 mx-auto"></p>
              </div>
              <div className="space-y-8">
                <p className="font-medium">2. Bendahara P2KD</p>
                <p className="border-b border-black w-32 mx-auto"></p>
              </div>
              <div className="space-y-8">
                <p className="font-medium">3. Seksi Pendaftaran</p>
                <p className="border-b border-black w-32 mx-auto"></p>
              </div>
              <div className="space-y-8">
                <p className="font-medium">4. Seksi Pemungutan</p>
                <p className="border-b border-black w-32 mx-auto"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
