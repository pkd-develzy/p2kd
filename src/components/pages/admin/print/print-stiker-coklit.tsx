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
  Award,
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
  // GENERATOR PDF RESMI (BIRU DONGKER, WATERMARK, TABEL PRESISI)
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

      // Konfigurasi Grid Layout Presisi Matematis
      const cols = isA3 ? 4 : 2;
      const rows = 2;
      const stickersPerPage = cols * rows; // A4: 4 stiker, A3: 8 stiker
      const stickerW = 92;
      const stickerH = 132;
      const marginX = isA3 ? 14 : 9;
      const marginY = 14;
      const gapX = 8;
      const gapY = 7;

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

        // 1. FRAME KARTU UTAMA (BORDER BIRU DONGKER PRESISI)
        doc.setDrawColor(30, 58, 138); // blue-900 (Biru Dongker)
        doc.setLineWidth(0.6);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, stickerW, stickerH, 2.5, 2.5, "FD");

        // Garis batas dalam dekoratif
        doc.setDrawColor(219, 234, 254); // blue-100
        doc.setLineWidth(0.25);
        doc.roundedRect(x + 1.2, y + 1.2, stickerW - 2.4, stickerH - 2.4, 2, 2, "D");

        // 2. WATERMARK RESMI P2KD (DI TENGAH STIKER)
        const cx = x + stickerW / 2;
        const cy = y + 68;

        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.4);
        doc.circle(cx, cy, 21, "D");

        // Lingkaran kedua
        doc.circle(cx, cy, 18, "D");

        // Teks Watermark Samar
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(203, 213, 225); // slate-300
        doc.text("P2KD KALISALAK", cx, cy - 3, { align: "center" });

        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("2026/2027", cx, cy + 1.5, { align: "center" });

        doc.setFontSize(4.8);
        doc.setTextColor(203, 213, 225);
        doc.text("DOKUMEN RESMI SAH", cx, cy + 6, { align: "center" });

        // 3. HEADER RESMI BIRU DONGKER & AKSEN EMAS
        doc.setFillColor(15, 23, 42); // slate-900 (Biru Dongker Pekat)
        doc.roundedRect(x + 1.2, y + 1.2, stickerW - 2.4, 19.5, 1.8, 1.8, "F");
        doc.rect(x + 1.2, y + 15, stickerW - 2.4, 5.7, "F"); // ratakan sudut bawah

        // Garis Emas Puncak Header
        doc.setFillColor(217, 119, 6); // amber-600 (Emas)
        doc.rect(x + 1.2, y + 1.2, stickerW - 2.4, 1.2, "F");

        // Teks Header (Menggunakan ASCII murni agar tidak korup menjadi karakter '&')
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(251, 191, 36); // Amber Gold
        doc.text(
          "MODEL A.A-PILKADES  :  TANDA BUKTI COKLIT PEMILIH",
          cx,
          y + 6,
          { align: "center" }
        );

        doc.setFontSize(8.2);
        doc.setTextColor(255, 255, 255);
        doc.text(
          "PEMILIHAN KEPALA DESA KALISALAK",
          cx,
          y + 11.5,
          { align: "center" }
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(4.8);
        doc.setTextColor(191, 219, 254); // Blue-200
        doc.text(
          "P2KD KECAMATAN MARGASARI, KABUPATEN TEGAL 2026/2027",
          cx,
          y + 16.5,
          { align: "center" }
        );

        // Garis Emas Bawah Header
        doc.setDrawColor(217, 119, 6);
        doc.setLineWidth(0.5);
        doc.line(x + 1.2, y + 20.7, x + stickerW - 1.2, y + 20.7);

        // 4. CARD DATA KEPALA KELUARGA & ALAMAT
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.3);
        doc.roundedRect(x + 3, y + 22.5, stickerW - 6, 21.5, 1.2, 1.2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("NO. KARTU KELUARGA (KK):", x + 5, y + 26.5);
        doc.setFont("courier", "bold");
        doc.setFontSize(6.8);
        doc.setTextColor(15, 23, 42);
        doc.text(maskedKk, x + 36, y + 26.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(100, 116, 139);
        doc.text("KEPALA KELUARGA:", x + 5, y + 31.5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.8);
        doc.setTextColor(15, 23, 42);
        const truncatedHead =
          head.namaLengkap.length > 25
            ? `${head.namaLengkap.slice(0, 25)}...`
            : head.namaLengkap;
        doc.text(truncatedHead.toUpperCase(), x + 36, y + 31.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(100, 116, 139);
        doc.text("ALAMAT DOMISILI:", x + 5, y + 36.5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.2);
        doc.setTextColor(30, 41, 59);
        doc.text(`RT ${rtNum} / RW ${rwNum}, DESA KALISALAK`, x + 36, y + 36.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(100, 116, 139);
        doc.text("WILAYAH PENUGASAN:", x + 5, y + 41.5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(30, 58, 138); // blue-900
        doc.text(`WILAYAH RW ${rwNum}  -  TABUNG ${rwNum}`, x + 36, y + 41.5);

        // 5. TABEL DAFTAR PEMILIH TERDAFTAR (MODERN & TERSTRUKTUR RAPI)
        // Header Tabel Biru Dongker
        doc.setFillColor(30, 58, 138); // blue-900
        doc.roundedRect(x + 3, y + 46, stickerW - 6, 4.8, 1, 1, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(255, 255, 255);
        doc.text("NO", x + 5.5, y + 49.3);
        doc.text("NAMA PEMILIH TERDAFTAR", x + 13, y + 49.3);
        doc.text("JK", x + 63, y + 49.3, { align: "center" });
        doc.text("STATUS", x + 77, y + 49.3, { align: "center" });

        // Baris-baris Pemilih
        const maxDisplay = 4;
        const displayedMembers = members.slice(0, maxDisplay);
        const rowHeight = 4.4;

        displayedMembers.forEach((m, mIdx) => {
          const rowY = y + 50.8 + mIdx * rowHeight;

          // Striping latar baris
          if (mIdx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(x + 3, rowY, stickerW - 6, rowHeight, "F");
          }

          // Garis pemisah antar baris
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(x + 3, rowY + rowHeight, x + stickerW - 3, rowY + rowHeight);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(5.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${mIdx + 1}.`, x + 5.5, rowY + 3.2);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(5.8);
          const truncatedName =
            m.namaLengkap.length > 27
              ? `${m.namaLengkap.slice(0, 27)}...`
              : m.namaLengkap;
          doc.text(truncatedName.toUpperCase(), x + 13, rowY + 3.2);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(5.5);
          doc.setTextColor(71, 85, 105);
          doc.text(m.jenisKelamin, x + 63, rowY + 3.2, { align: "center" });

          doc.setFont("helvetica", "bold");
          doc.setFontSize(5);
          doc.setTextColor(16, 149, 193); // cyan/blue badge
          doc.text("Hak Pilih Sah", x + 77, rowY + 3.2, { align: "center" });
        });

        // Banner Catatan Edukasi Pemilih di Bawah Tabel
        const tableActualHeight = displayedMembers.length * rowHeight;
        const noteBoxY = y + 51.5 + tableActualHeight;
        const noteBoxHeight = Math.max(7.5, 34 - tableActualHeight);

        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.25);
        doc.roundedRect(x + 3, noteBoxY, stickerW - 6, noteBoxHeight, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(5);
        doc.setTextColor(30, 58, 138); // blue-900
        doc.text(
          `TOTAL PEMILIH SAH DI RUMAH INI: ${members.length} JIWA  -  STATUS: MEMENUHI SYARAT (MS)`,
          x + 5,
          noteBoxY + 3.5
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(4.4);
        doc.setTextColor(71, 85, 105);
        doc.text(
          "Wajib membawa KTP-el / Formulir C6 saat hadir di Tabung Pemilihan Kalisalak.",
          x + 5,
          noteBoxY + 6.6
        );

        // 6. FOOTER PENGESAHAN: QR CODE & TANDA TANGAN PANTARLIH
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.35);
        doc.line(x + 3, y + 87.5, x + stickerW - 3, y + 87.5);

        // Render QR Code ke DataURL dengan resolusi tajam
        const qrDataUrl = await QRCode.toDataURL(qrPayloadUrl, {
          margin: 1,
          width: 140,
          errorCorrectionLevel: "M",
          color: { dark: "#0f172a", light: "#ffffff" },
        });

        // Gambar QR Code
        doc.addImage(qrDataUrl, "PNG", x + 4, y + 89.5, 22, 22);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(4.5);
        doc.setTextColor(15, 23, 42);
        doc.text("SCAN CEK DPT", x + 15, y + 114.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(3.8);
        doc.setTextColor(100, 116, 139);
        doc.text("p2kdkalisalak.my.id", x + 15, y + 117.5, { align: "center" });

        // Tanggal Kunjungan Coklit
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.4);
        doc.setTextColor(51, 65, 85);
        doc.text("Kalisalak, ..... / ..... / 2026", x + 30, y + 91.5);

        // Kotak Paraf Pemilih / KK
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(x + 30, y + 94, 26, 22, 1, 1, "D");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(4.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Paraf Pemilih / KK", x + 43, y + 104, { align: "center" });

        // Kotak Cap & Tanda Tangan Pantarlih
        doc.roundedRect(x + 58, y + 94, stickerW - 61, 22, 1, 1, "D");
        doc.text("Cap & Ttd Pantarlih", x + 58 + (stickerW - 61) / 2, y + 101, {
          align: "center",
        });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Pantarlih RW ${rwNum}`,
          x + 58 + (stickerW - 61) / 2,
          y + 112,
          { align: "center" }
        );

        // 7. SECURITY STRIP PITA BAWAH (BIRU DONGKER & EMAS)
        doc.setFillColor(15, 23, 42); // slate-900 (Biru Dongker)
        doc.roundedRect(x + 1.2, y + stickerH - 6.2, stickerW - 2.4, 5, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(4.3);
        doc.setTextColor(251, 191, 36); // gold
        doc.text(
          "DOKUMEN RESMI P2KD DESA KALISALAK  -  WAJIB DITEMPEL DI PINTU DEPAN",
          cx,
          y + stickerH - 3,
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
              variant="primary"
              className="text-[10px] font-black uppercase tracking-wider bg-blue-900/10 text-blue-950 border-blue-300"
            >
              MODEL A.A • STIKER COKLIT RUMAH
            </Badge>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight pt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 inline" />
            Cetak & Unduh Stiker Bukti Pendaftaran Pemilih Pilkades (Tema Biru Dongker)
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
              className="h-7 px-2 text-xs rounded-lg border border-slate-300 bg-white font-bold text-blue-900 disabled:bg-slate-100 focus:outline-none"
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
                    ? "bg-blue-900 text-white shadow-xs"
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
                    ? "bg-blue-900 text-white shadow-xs"
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
            className="text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white h-9 px-3 shadow-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak ({displayedFamilies.length} Rumah)
          </Button>
        </div>
      </div>

      {/* Info Status Banner */}
      <div className="flex items-center justify-between bg-linear-to-r from-blue-950 via-slate-900 to-blue-950 text-white px-5 py-3 rounded-2xl border border-blue-900/60 text-xs font-medium print:hidden shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>
            Menampilkan <strong>{displayedFamilies.length}</strong> stiker rumah dari total <strong>{uniqueFamilies.length}</strong> keluarga terdata di <strong>{selectedTps}</strong>.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-blue-200 font-semibold">
          <span>Tata Letak: <strong>{paperSize === "A3" ? "A3 Landscape (8 Stiker/Lembar)" : "A4 Portrait (4 Stiker/Lembar)"}</strong></span>
        </div>
      </div>

      {/* ========================================================
          GRID STIKER COKLIT MODERN (BIRU DONGKER & WATERMARK)
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
              className={`bg-white text-slate-900 rounded-3xl border-2 border-blue-900 shadow-md overflow-hidden font-sans flex flex-col justify-between break-inside-avoid relative print:rounded-2xl print:border-blue-950 print:shadow-none ${
                isPageBreak ? "print:break-after-page" : ""
              }`}
            >
              {/* WATERMARK RESMI P2KD (BACKGROUND SEAL) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0 overflow-hidden">
                <div className="w-56 h-56 rounded-full border-8 border-blue-950 flex flex-col items-center justify-center text-center p-4">
                  <Award className="w-16 h-16 text-blue-950 mb-1" />
                  <span className="text-[12px] font-black uppercase text-blue-950 tracking-widest">
                    P2KD KALISALAK
                  </span>
                  <span className="text-[14px] font-black text-blue-950">2026 / 2027</span>
                  <span className="text-[8px] font-bold text-blue-950">VERIFIKASI SAH</span>
                </div>
              </div>

              <div className="relative z-10">
                {/* 1. Header Pita Biru Dongker & Emas */}
                <div className="bg-linear-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-3.5 border-b-2 border-amber-500 relative">
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
                  <p className="text-[9.5px] font-medium text-blue-200 text-center">
                    Pemilihan Kepala Desa Kalisalak 2026/2027 • Kec. Margasari
                  </p>
                </div>

                {/* 2. Informasi Kepala Keluarga & Rumah */}
                <div className="p-3.5 space-y-3">
                  <div className="bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/90 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-500 font-semibold">No. KK (Terlindungi):</span>
                      <span className="font-mono font-bold text-blue-950 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {maskedKk}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-blue-900 shrink-0" />
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

                  {/* 3. Tabel Daftar Pemilih Terdaftar (Tabel Rapi & Presisi) */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="bg-blue-900 text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 uppercase tracking-wide">
                        <Users className="w-3.5 h-3.5 text-amber-300" />
                        Daftar Pemilih Terdaftar ({members.length} Jiwa)
                      </span>
                      <span className="bg-blue-800 text-amber-300 text-[9px] px-2 py-0.2 rounded-full border border-blue-700">
                        Hak Pilih Sah
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 bg-white text-[11px]">
                      {members.map((m, mIdx) => (
                        <div
                          key={m.id}
                          className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate max-w-50">
                            <span className="font-mono text-[10px] text-slate-400 font-bold w-4">
                              {mIdx + 1}.
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {m.namaLengkap}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {m.jenisKelamin === "L" ? "L" : "P"}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Sah
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Banner Edukasi Hak Pilih */}
                    <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-200 text-[9.5px] text-slate-600 leading-tight">
                      <strong className="text-blue-900">Catatan Resmi:</strong> Wajib membawa KTP-el atau Formulir C6 saat hadir di Tabung Pemilihan RW {rwNum}.
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Footer Pengesahan & QR Code Aktif */}
              <div className="p-3.5 pt-0 relative z-10">
                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-3 text-[10px]">
                  {/* QR Code Scan Frame */}
                  <div className="flex items-center gap-2">
                    <div className="bg-white p-1 rounded-xl border-2 border-blue-900 shadow-xs shrink-0">
                      <ActiveQRCode
                        value={qrPayloadUrl}
                        size={56}
                        className="w-14 h-14"
                      />
                    </div>
                    <div className="space-y-0.5 max-w-27.5">
                      <div className="font-black text-blue-950 text-[9px] uppercase tracking-wide">
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
                <div className="mt-2.5 bg-blue-950 text-amber-300 text-[8px] font-bold py-1 px-2 rounded-lg text-center leading-tight tracking-wide border border-amber-500/30">
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
