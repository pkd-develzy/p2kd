"use client";

import React, { useState, useMemo } from "react";
import { Voter, TPSItem } from "../types";
import {
  Printer,
  ArrowLeft,
  Home,
  Download,
  MapPin,
  Users,
  ShieldCheck,
  Sparkles,
  Loader2,
  Layers,
} from "lucide-react";
import { Button, Badge, ActiveQRCode } from "@/components/ui";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { DAFTAR_RW_KALISALAK, normalizeWilayahCode } from "@/lib/kalisalak-wilayah";
import { matchTpsVoter } from "@/lib/print-models-export";

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
  const [selectedTps, setSelectedTps] = useState<string>(
    defaultTps || tpsList[0]?.namaTps || "RW 01"
  );
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");
  const [limitStiker, setLimitStiker] = useState<number>(4);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Filter pemilih aktif sesuai RW/Tabung yang dipilih
  const activeRwDigits = selectedTps.replace(/\D/g, "");
  const tpsObj = tpsList.find((t) => t.namaTps === selectedTps) || tpsList[0];

  const tpsVoters = useMemo(() => {
    return voters.filter((v) => {
      if (v.statusAktif !== "AKTIF") return false;
      const matchByTps = tpsObj?.nomorTps
        ? v.tps.toLowerCase().includes(tpsObj.nomorTps.toLowerCase())
        : false;
      const matchByRw =
        normalizeWilayahCode(v.rw) === normalizeWilayahCode(activeRwDigits);
      const matchCustom = matchTpsVoter(v.tps, selectedTps) || matchTpsVoter(v.rw, selectedTps);
      return matchByTps || matchByRw || matchCustom;
    });
  }, [voters, selectedTps, tpsObj, activeRwDigits]);

  // Kelompokkan pemilih per Kepala Keluarga / No. KK
  const uniqueFamilies = useMemo(() => {
    const list: { head: Voter; members: Voter[] }[] = [];
    const visitedKk = new Set<string>();

    for (const v of tpsVoters) {
      if (v.kk && v.kk.trim().length > 5) {
        if (!visitedKk.has(v.kk)) {
          visitedKk.add(v.kk);
          const members = tpsVoters.filter((m) => m.kk === v.kk);
          list.push({ head: v, members });
        }
      } else {
        list.push({ head: v, members: [v] });
      }
    }
    return list;
  }, [tpsVoters]);

  const displayedFamilies = useMemo(() => {
    if (limitStiker >= uniqueFamilies.length) return uniqueFamilies;
    return uniqueFamilies.slice(0, limitStiker);
  }, [uniqueFamilies, limitStiker]);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.p2kdkalisalak.my.id";

  // ========================================================
  // GENERATOR PDF LANGSUNG (A4 & A3 DENGAN VECTOR GRAFIS SHARP)
  // ========================================================
  const handleDownloadPdf = async () => {
    if (displayedFamilies.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const isA3 = paperSize === "A3";
      // Format A4 Portrait (210 x 297 mm) atau A3 Landscape (420 x 297 mm)
      const doc = new jsPDF({
        orientation: isA3 ? "landscape" : "portrait",
        unit: "mm",
        format: isA3 ? "a3" : "a4",
      });

      // Konfigurasi Grid Layout
      const cols = isA3 ? 4 : 2;
      const rows = 2;
      const stickersPerPage = cols * rows; // A4: 4 stiker, A3: 8 stiker
      const stickerW = isA3 ? 94 : 92;
      const stickerH = 134;
      const marginX = isA3 ? 12 : 10;
      const marginY = 10;
      const gapX = isA3 ? 6 : 6;
      const gapY = 9;

      for (let i = 0; i < displayedFamilies.length; i++) {
        const family = displayedFamilies[i];
        const itemOnPage = i % stickersPerPage;

        if (i > 0 && itemOnPage === 0) {
          doc.addPage();
        }

        const col = itemOnPage % cols;
        const row = Math.floor(itemOnPage / cols);
        const x = marginX + col * (stickerW + gapX);
        const y = marginY + row * (stickerH + gapY);

        const head = family.head;
        const members = family.members;
        const rwNum = (head.rw || "01").replace(/\D/g, "").padStart(2, "0");
        const rtNum = (head.rt || "01").replace(/\D/g, "").padStart(2, "0");
        const maskedKk =
          head.kk && head.kk.length > 5
            ? `${head.kk.slice(0, 3)}**********${head.kk.slice(-3)}`
            : "****************";
        const qrPayloadUrl = `${baseUrl}/stiker-coklit?kk=${encodeURIComponent(
          head.kk || ""
        )}&id=${encodeURIComponent(head.id)}`;

        // 1. Frame Utama Stiker (Rounded Box dengan Border Emerald)
        doc.setDrawColor(5, 150, 105); // emerald-600
        doc.setLineWidth(0.7);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, stickerW, stickerH, 2.5, 2.5, "FD");

        // Inner decorative line
        doc.setDrawColor(209, 250, 229); // emerald-100
        doc.setLineWidth(0.3);
        doc.roundedRect(x + 1.2, y + 1.2, stickerW - 2.4, stickerH - 2.4, 2, 2, "D");

        // 2. Header Pita Mewah Resmi (Deep Emerald & Gold)
        doc.setFillColor(6, 78, 59); // deep emerald
        doc.roundedRect(x + 1.5, y + 1.5, stickerW - 3, 19, 2, 2, "F");
        doc.rect(x + 1.5, y + 15, stickerW - 3, 5.5, "F"); // square bottom connector

        // Text Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(251, 191, 36); // gold
        doc.text(
          "★ MODEL A.A-PILKADES • TANDA BUKTI COKLIT PEMILIH ★",
          x + stickerW / 2,
          y + 5.5,
          { align: "center" }
        );

        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text(
          "PEMILIHAN KEPALA DESA KALISALAK",
          x + stickerW / 2,
          y + 11,
          { align: "center" }
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.5);
        doc.setTextColor(204, 251, 241);
        doc.text(
          "P2KD KECAMATAN MARGASARI • KABUPATEN TEGAL 2026/2027",
          x + stickerW / 2,
          y + 16,
          { align: "center" }
        );

        // Gold Trim Line
        doc.setDrawColor(217, 119, 6); // amber-600
        doc.setLineWidth(0.5);
        doc.line(x + 1.5, y + 20.5, x + stickerW - 1.5, y + 20.5);

        // 3. Card Data Kepala Keluarga & Alamat
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x + 3, y + 23, stickerW - 6, 25, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text("NO. KARTU KELUARGA (KK):", x + 5, y + 27.5);
        doc.setFont("courier", "bold");
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text(maskedKk, x + 38, y + 27.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text("KEPALA KELUARGA:", x + 5, y + 33);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        const truncatedHead =
          head.namaLengkap.length > 24
            ? `${head.namaLengkap.slice(0, 24)}...`
            : head.namaLengkap;
        doc.text(truncatedHead.toUpperCase(), x + 38, y + 33);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text("ALAMAT RUMAH:", x + 5, y + 38.5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`RT ${rtNum} / RW ${rwNum}, Desa Kalisalak`, x + 38, y + 38.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text("WILAYAH PEMILIHAN:", x + 5, y + 44);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.8);
        doc.setTextColor(30, 64, 175);
        doc.text(`WILAYAH RW ${rwNum}  (TABUNG ${rwNum})`, x + 38, y + 44);

        // 4. Panel Daftar Pemilih Terdaftar di Rumah Ini
        doc.setFillColor(254, 243, 199); // amber-100
        doc.setDrawColor(251, 191, 36);
        doc.roundedRect(x + 3, y + 50, stickerW - 6, 36, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.2);
        doc.setTextColor(146, 64, 14);
        doc.text(
          `DAFTAR PEMILIH TERDAFTAR DI RUMAH INI (${members.length} JIWA):`,
          x + 5,
          y + 54.5
        );

        // Maksimal 5 anggota keluarga ditampilkan
        const maxDisplay = 4;
        members.slice(0, maxDisplay).forEach((m, mIdx) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(5.8);
          doc.setTextColor(15, 23, 42);
          const truncatedName =
            m.namaLengkap.length > 26
              ? `${m.namaLengkap.slice(0, 26)}...`
              : m.namaLengkap;
          doc.text(
            `${mIdx + 1}. ${truncatedName} (${m.jenisKelamin}) - [Hak Pilih Sah]`,
            x + 5,
            y + 60 + mIdx * 5
          );
        });

        if (members.length > maxDisplay) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(5.5);
          doc.setTextColor(180, 83, 9);
          doc.text(
            `... dan ${members.length - maxDisplay} pemilih lainnya tercatat sah.`,
            x + 5,
            y + 60 + maxDisplay * 5
          );
        }

        // 5. Bagian Footer: QR Code & Kolom Pengesahan Pantarlih
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.line(x + 3, y + 88, x + stickerW - 3, y + 88);

        // Render QR Code ke DataURL
        const qrDataUrl = await QRCode.toDataURL(qrPayloadUrl, {
          margin: 1,
          width: 140,
          errorCorrectionLevel: "M",
          color: { dark: "#064e3b", light: "#ffffff" },
        });

        // Gambar QR Code
        doc.addImage(qrDataUrl, "PNG", x + 4, y + 90.5, 23, 23);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(4.8);
        doc.setTextColor(6, 78, 59);
        doc.text("SCAN VALIDASI DPT", x + 15.5, y + 116.5, { align: "center" });

        // Tanggal Coklit
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.8);
        doc.setTextColor(51, 65, 85);
        doc.text("Tgl Coklit: .... / .... / 2026", x + 30, y + 93.5);

        // Kotak Paraf Pemilih
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(x + 30, y + 96, 26, 19, 1, 1, "D");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(4.8);
        doc.setTextColor(148, 163, 184);
        doc.text("Paraf Pemilih / KK", x + 43, y + 105.5, { align: "center" });

        // Kotak Cap & Ttd Pantarlih
        doc.roundedRect(x + 58, y + 96, stickerW - 61, 19, 1, 1, "D");
        doc.text("Cap & Ttd Pantarlih", x + 58 + (stickerW - 61) / 2, y + 103, {
          align: "center",
        });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Pantarlih RW ${rwNum}`,
          x + 58 + (stickerW - 61) / 2,
          y + 111.5,
          { align: "center" }
        );

        // 6. Security Strip Pita Bawah
        doc.setFillColor(6, 78, 59);
        doc.roundedRect(x + 1.5, y + stickerH - 6.5, stickerW - 3, 5, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(4.3);
        doc.setTextColor(254, 240, 138); // light gold
        doc.text(
          "DOKUMEN RESMI P2KD DESA KALISALAK • WAJIB DITEMPEL DI PINTU RUMAH",
          x + stickerW / 2,
          y + stickerH - 3.2,
          { align: "center" }
        );
      }

      // Download file PDF
      const filename = `STIKER_COKLIT_PILKADES_${selectedTps.replace(
        /\s+/g,
        "_"
      )}_${paperSize}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("Gagal membuat PDF Stiker:", err);
      alert("Terjadi kesalahan saat membuat dokumen PDF Stiker.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Dynamic Print CSS for A4 / A3 Paper Format */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${paperSize === "A3" ? "A3 landscape" : "A4 portrait"};
            margin: 8mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs gap-4 print:hidden">
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
              className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-900 border-amber-300"
            >
              MODEL A.A • STIKER COKLIT RUMAH
            </Badge>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight pt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 inline" />
            Cetak & Unduh Stiker Bukti Pendaftaran Pemilih Pilkades
          </h2>
          <p className="text-xs text-slate-500">
            Tersedia pilihan cetak pada kertas standar <strong>A4 (4 stiker/lembar)</strong> atau lembar percetakan <strong>A3 (8 stiker/lembar)</strong> serta unduh PDF langsung.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pilihan Wilayah RW */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Wilayah:</span>
            <select
              value={selectedTps}
              disabled={!isAdmin}
              onChange={(e) => setSelectedTps(e.target.value)}
              className="h-7 px-2 text-xs rounded-lg border border-slate-300 bg-white font-bold text-emerald-800 disabled:bg-slate-100 focus:outline-none"
            >
              {DAFTAR_RW_KALISALAK.map((rw) => (
                <option key={rw.value} value={rw.label}>
                  {rw.label} (Tabung {rw.defaultTps})
                </option>
              ))}
            </select>
          </div>

          {/* PILIHAN FORMAT KERTAS: A4 vs A3 */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Kertas:</span>
            <div className="flex items-center bg-white rounded-lg border border-slate-300 p-0.5">
              <button
                type="button"
                onClick={() => setPaperSize("A4")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  paperSize === "A4"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Format kertas A4 standar (4 stiker per lembar)"
              >
                A4 (4/lembar)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize("A3")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  paperSize === "A3"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Format kertas A3 percetakan stiker (8 stiker per lembar)"
              >
                A3 (8/lembar)
              </button>
            </div>
          </div>

          {/* Batas Jumlah Rumah / Stiker */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Jumlah:</span>
            <select
              value={limitStiker}
              onChange={(e) => setLimitStiker(Number(e.target.value))}
              className="h-7 px-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold focus:outline-none"
            >
              <option value={4}>4 Rumah (1 Lembar A4)</option>
              <option value={8}>8 Rumah (1 Lembar A3 / 2 Lembar A4)</option>
              <option value={16}>16 Rumah (2 Lembar A3 / 4 Lembar A4)</option>
              <option value={32}>32 Rumah (4 Lembar A3 / 8 Lembar A4)</option>
              <option value={uniqueFamilies.length}>
                Semua Rumah {selectedTps} ({uniqueFamilies.length} Rumah)
              </option>
            </select>
          </div>

          {/* TOMBOL UNDUH PDF LANGSUNG (.PDF) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || displayedFamilies.length === 0}
            className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 h-9 px-3 shadow-xs"
            title={`Unduh dokumen PDF Stiker Coklit langsung dalam format kertas ${paperSize}`}
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-rose-600" />
                Membuat PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1.5 text-rose-600" />
                Unduh PDF ({paperSize})
              </>
            )}
          </Button>

          {/* TOMBOL CETAK DOKUMEN (PRINT) */}
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white h-9 px-3 shadow-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak ({displayedFamilies.length} Rumah)
          </Button>
        </div>
      </div>

      {/* Info Status Banner */}
      <div className="flex items-center justify-between bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 px-4 py-2.5 rounded-2xl border border-emerald-200/80 text-xs font-medium text-emerald-950 print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>
            Menampilkan <strong>{displayedFamilies.length}</strong> stiker rumah dari total <strong>{uniqueFamilies.length}</strong> keluarga terdata di <strong>{selectedTps}</strong>.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold">
          <span>Tata Letak: <strong>{paperSize === "A3" ? "A3 Landscape (8 Stiker/Lembar)" : "A4 Portrait (4 Stiker/Lembar)"}</strong></span>
        </div>
      </div>

      {/* ========================================================
          GRID STIKER COKLIT MODERN (A4: 2 KOLOM | A3: 4 KOLOM)
          ======================================================== */}
      <div
        className={`grid gap-5 max-w-7xl mx-auto ${
          paperSize === "A3"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-3"
            : "grid-cols-1 md:grid-cols-2 print:grid-cols-2 print:gap-4"
        } print:max-w-full print:m-0 print:p-0`}
      >
        {displayedFamilies.map(({ head, members }, idx) => {
          const rwNum = (head.rw || "01").replace(/\D/g, "").padStart(2, "0");
          const rtNum = (head.rt || "01").replace(/\D/g, "").padStart(2, "0");
          const maskedKk =
            head.kk && head.kk.length > 5
              ? `${head.kk.slice(0, 3)}**********${head.kk.slice(-3)}`
              : "****************";
          const qrPayloadUrl = `${baseUrl}/stiker-coklit?kk=${encodeURIComponent(
            head.kk || ""
          )}&id=${encodeURIComponent(head.id)}`;

          // Menentukan page-break setiap kelipatan jumlah per lembar
          const itemsPerPage = paperSize === "A3" ? 8 : 4;
          const isPageBreak = (idx + 1) % itemsPerPage === 0;

          return (
            <div
              key={head.id}
              className={`bg-white text-slate-900 rounded-3xl border-2 border-emerald-600/80 shadow-md overflow-hidden font-sans flex flex-col justify-between break-inside-avoid print:rounded-2xl print:border-emerald-800 print:shadow-none ${
                isPageBreak ? "print:break-after-page" : ""
              }`}
            >
              <div>
                {/* 1. Header Pita Mewah Resmi */}
                <div className="bg-linear-to-r from-emerald-950 via-teal-900 to-slate-950 text-white p-3.5 border-b-2 border-amber-500 relative">
                  <div className="flex items-center justify-between text-[9px] font-black tracking-widest text-amber-300 uppercase">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      MODEL A.A-PILKADES
                    </span>
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 px-2 py-0.5 rounded-full text-[8px] font-extrabold">
                      BUKTI RESMI COKLIT
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-white mt-1 text-center">
                    TANDA BUKTI PENDAFTARAN & COKLIT PEMILIH
                  </h3>
                  <p className="text-[9.5px] font-medium text-teal-200 text-center">
                    Pemilihan Kepala Desa Kalisalak 2026/2027 • Kec. Margasari
                  </p>
                </div>

                {/* 2. Informasi Kepala Keluarga & Rumah */}
                <div className="p-3.5 space-y-3">
                  <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-500 font-semibold">No. KK (Sensored):</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {maskedKk}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        Kepala Keluarga:
                      </span>
                      <span className="font-black uppercase text-slate-950 text-right truncate max-w-45">
                        {head.namaLengkap}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Alamat Domisili:
                      </span>
                      <span className="font-medium text-slate-800 text-right">
                        RT {rtNum} / RW {rwNum}, Desa Kalisalak
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-semibold">Wilayah Penugasan:</span>
                      <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                        Wilayah RW {rwNum} • Tabung {rwNum}
                      </span>
                    </div>
                  </div>

                  {/* 3. Daftar Pemilih Terdaftar di Rumah Ini */}
                  <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        Daftar Pemilih Terdaftar
                      </span>
                      <Badge
                        variant="warning"
                        className="text-[9px] font-black bg-amber-200 text-amber-950 border-amber-300 px-2"
                      >
                        {members.length} Pemilih Sah
                      </Badge>
                    </div>

                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {members.map((m, mIdx) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between text-[11px] bg-white/90 p-1.5 rounded-xl border border-amber-100 font-medium"
                        >
                          <span className="truncate max-w-42.5 text-slate-900 font-semibold">
                            {mIdx + 1}. {m.namaLengkap}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {m.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Footer Pengesahan & QR Code Aktif */}
              <div className="p-3.5 pt-0">
                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-3 text-[10px]">
                  {/* QR Code Scan Frame */}
                  <div className="flex items-center gap-2">
                    <div className="bg-white p-1 rounded-xl border-2 border-emerald-600/60 shadow-xs shrink-0">
                      <ActiveQRCode
                        value={qrPayloadUrl}
                        size={58}
                        className="w-14 h-14"
                      />
                    </div>
                    <div className="space-y-0.5 max-w-27.5">
                      <div className="font-black text-emerald-950 text-[9px] uppercase tracking-wide">
                        SCAN CEK DPT
                      </div>
                      <div className="text-[7.5px] text-slate-600 leading-tight">
                        Pindai kode ini untuk validasi data pemilih di rumah ini secara online.
                      </div>
                    </div>
                  </div>

                  {/* Kotak Pengesahan & Tanda Tangan */}
                  <div className="grid grid-cols-2 gap-2 text-center shrink-0">
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-500 font-medium block">
                        Paraf Pemilih
                      </span>
                      <div className="w-16 h-10 border border-dashed border-slate-400 rounded-lg flex items-center justify-center text-[7.5px] text-slate-400">
                        Paraf
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-500 font-medium block">
                        Petugas Pantarlih
                      </span>
                      <div className="w-18 h-10 border border-slate-300 rounded-lg flex flex-col justify-end pb-1 text-[7.5px] font-bold text-slate-800 bg-slate-50/50">
                        RW {rwNum}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Pita Hukum Pengingat Resmi */}
                <div className="mt-2.5 bg-emerald-900 text-amber-200 text-[8px] font-bold py-1 px-2 rounded-lg text-center leading-tight tracking-wide">
                  ★ STIKER RESMI P2KD DESA KALISALAK • WAJIB DITEMPEL DI PINTU DEPAN RUMAH ★
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
