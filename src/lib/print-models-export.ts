import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { Voter, TPSItem } from "@/components/pages/admin/types";

/**
 * print-models-export.ts
 * Utilitas Resmi Ekspor & Unduh Data Pusat Cetak Dokumen P2KD Kalisalak:
 * - Model A.1: Daftar Pemilih Sementara (DPS) Pilkades [dengan sub-tabel verifikasi pada setiap data pemilih]
 * - Model A.2: Daftar Pemilih Tambahan (DPTb)
 * - Model A.3: Daftar Pemilih Tetap (DPT) Pilkades Tingkat Desa
 * - Model A.4: Salinan Daftar Pemilih Tetap per TPS
 */

const KOP_TITLE_1 = "PANITIA PEMILIHAN KEPALA DESA (P2KD)";
const KOP_TITLE_2 = "DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL";
const KOP_SUB = "Sekretariat: Gedung Balai Desa Kalisalak, Jl. Raya Margasari – Kalisalak No. 01 Margasari 52463";

// ==========================================
// 1. MODEL A.1: DAFTAR PEMILIH SEMENTARA (DPS)
// [DENGAN 1 TABEL DIBAWAHNYA PADA SETIAP 1 DATA PEMILIH]
// ==========================================

export function exportModelA1Excel(voters: Voter[], selectedTps: string = "SEMUA") {
  const filtered = selectedTps === "SEMUA"
    ? voters.filter((v) => v.statusAktif === "AKTIF")
    : voters.filter((v) => v.statusAktif === "AKTIF" && v.tps.toLowerCase().includes(selectedTps.toLowerCase()));

  const rows: (string | number)[][] = [];

  // Header Title
  rows.push(["MODEL A.1: DAFTAR PEMILIH SEMENTARA (DPS) PILKADES KALISALAK 2026/2027"]);
  rows.push(["LEMBAR KERJA PEMUTAKHIRAN & COKLIT FAKTUAL PANTARLIH / KOORDINATOR RW"]);
  rows.push([`Wilayah Penugasan: ${selectedTps}`, `Total Pemilih: ${filtered.length} Jiwa`, `Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}`]);
  rows.push([]);

  filtered.forEach((v, idx) => {
    // 1. Baris Data Pemilih Utama
    rows.push([
      "NO",
      "NOMOR NIK",
      "NOMOR KK",
      "NAMA LENGKAP",
      "JK",
      "TEMPAT / TGL LAHIR",
      "ST. KAWIN",
      "ALAMAT DOMISILI",
      "RT",
      "RW",
      "TABUNG PEMILIHAN",
    ]);
    rows.push([
      idx + 1,
      `'${v.nik}`,
      `'${v.kk || "-"}`,
      v.namaLengkap,
      v.jenisKelamin,
      `${v.tempatLahir}, ${v.tanggalLahir}`,
      v.statusPerkawinan === "S" ? "Kawin" : v.statusPerkawinan === "B" ? "Belum Kawin" : "Pernah Kawin",
      v.alamat,
      v.rt,
      v.rw,
      v.tps.replace(/TPS/gi, "Tabung"),
    ]);

    // 2. SUB-TABEL VERIFIKASI DI BAWAHNYA
    rows.push([
      "   ↳ [SUB-TABEL VERIFIKASI COKLIT]",
      "STATUS FAKTUAL",
      "KOREKSI ELEMEN DATA",
      "CATATAN LAPANGAN / BUKTI",
      "PETUGAS VERIFIKATOR",
      "TANGGAL VERIFIKASI",
      "PARAF PETUGAS",
      "PARAF PEMILIH",
    ]);
    rows.push([
      "",
      v.coklitStatus || "BELUM_COKLIT",
      v.coklitCatatan ? `Koreksi: ${v.coklitCatatan}` : "-",
      v.alasanTms || "-",
      v.coklitPetugas || "(Pantarlih RW)",
      v.coklitTanggal || "-",
      "[                   ]",
      "[                   ]",
    ]);

    // Baris Pemisah Antar Pemilih
    rows.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
    { wch: 8 },
    { wch: 24 },
    { wch: 14 },
    { wch: 30 },
    { wch: 8 },
    { wch: 8 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Model A.1 DPS Coklit");
  const filename = `MODEL_A1_DPS_PILKADES_${selectedTps.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportModelA1Pdf(voters: Voter[], selectedTps: string = "SEMUA") {
  const filtered = selectedTps === "SEMUA"
    ? voters.filter((v) => v.statusAktif === "AKTIF")
    : voters.filter((v) => v.statusAktif === "AKTIF" && v.tps.toLowerCase().includes(selectedTps.toLowerCase()));

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = 14;

  // Kop
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(KOP_TITLE_1, 148.5, y, { align: "center" });
  y += 5;
  doc.setFontSize(9.5);
  doc.text(KOP_TITLE_2, 148.5, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(KOP_SUB, 148.5, y, { align: "center" });
  y += 3;
  doc.setLineWidth(0.4);
  doc.line(14, y, 283, y);
  y += 6;

  // Judul
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MODEL A.1: DAFTAR PEMILIH SEMENTARA (DPS) & LEMBAR KERJA COKLIT", 148.5, y, { align: "center" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Wilayah Penugasan: ${selectedTps} • Total Pemilih: ${filtered.length} Orang`, 148.5, y, { align: "center" });
  y += 7;

  // Render per pemilih (Data Utama + Sub-tabel)
  filtered.slice(0, 120).forEach((v, idx) => {
    if (y > 175) {
      doc.addPage();
      y = 15;
    }

    // Box Container Pemilih
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 269, 21, 1.5, 1.5, "FD");

    // Baris 1: Identitas Utama
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}.`, 16, y + 4.5);
    doc.text(`NIK: ${v.nik}`, 23, y + 4.5);
    doc.text(`KK: ${v.kk || "-"}`, 68, y + 4.5);
    doc.text(`NAMA: ${v.namaLengkap}`, 110, y + 4.5);
    doc.text(`JK: ${v.jenisKelamin}`, 180, y + 4.5);
    doc.text(`LAHIR: ${v.tempatLahir}, ${v.tanggalLahir}`, 195, y + 4.5);
    doc.text(`ALAMAT: RT ${v.rt} / RW ${v.rw}`, 245, y + 4.5);

    // Garis Pemisah Sub-tabel
    doc.setDrawColor(226, 232, 240);
    doc.line(16, y + 7, 281, y + 7);

    // Baris 2: Sub-Tabel Coklit
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(30, 58, 138);
    doc.text("↳ SUB-TABEL VERIFIKASI FAKTUAL LAPANGAN:", 18, y + 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);

    // Status Badge
    const statusTxt = v.coklitStatus === "SESUAI" ? "[ ✓ SESUAI ]" : v.coklitStatus === "UBAH_DATA" ? "[ ✎ UBAH DATA ]" : v.coklitStatus === "TMS" ? "[ ✕ TMS ]" : "[ ◯ BELUM COKLIT ]";
    doc.text(`Status: ${statusTxt}`, 80, y + 11);
    doc.text(`Koreksi: ${v.coklitCatatan || "-"}`, 120, y + 11);
    doc.text(`Petugas: ${v.coklitPetugas || "(Pantarlih)"}`, 175, y + 11);
    doc.text(`Tgl: ${v.coklitTanggal || "-"}`, 220, y + 11);
    doc.text("Paraf: [ ........... ]", 255, y + 11);

    // Kotak tanda tangan kecil
    doc.setFontSize(6);
    doc.text(`Keterangan Tambahan: ${v.alasanTms || "Dokumen KTP-el / KK sah terverifikasi di Kalisalak"}`, 18, y + 16.5);
    doc.text("Paraf Pemilih: [ ........... ]", 245, y + 16.5);

    y += 24;
  });

  doc.save(`MODEL_A1_DPS_PILKADES_${selectedTps.replace(/\s+/g, "_")}.pdf`);
}

// ==========================================
// 2. MODEL A.2: DAFTAR PEMILIH TAMBAHAN (DPTb)
// ==========================================

export function exportModelA2Excel(voters: Voter[], selectedTps: string = "SEMUA") {
  // Pemilih Tambahan: temuan baru coklit, mutasi masuk, atau ditandai khusus DPTb
  const dptbList = voters.filter((v) => {
    const isTpsMatch = selectedTps === "SEMUA" || v.tps.toLowerCase().includes(selectedTps.toLowerCase());
    return isTpsMatch && (v.coklitStatus === "BARU" || v.disabilitas === "DPTB" || v.tahap === "DPS");
  });

  const rows: (string | number)[][] = [];
  rows.push(["MODEL A.2: DAFTAR PEMILIH TAMBAHAN (DPTb) PILKADES KALISALAK 2026/2027"]);
  rows.push(["DAFTAR WARGA YANG MENGGUNAKAN HAK PILIH TAMBAHAN DENGAN KTP-EL / SURAT PINDAH"]);
  rows.push([`Wilayah: ${selectedTps}`, `Total Pemilih DPTb: ${dptbList.length} Jiwa`, `Tanggal: ${new Date().toLocaleDateString("id-ID")}`]);
  rows.push([]);

  rows.push([
    "NO",
    "NOMOR NIK",
    "NOMOR KK",
    "NAMA LENGKAP",
    "JK",
    "TEMPAT / TGL LAHIR",
    "STATUS KAWIN",
    "ALAMAT DOMISILI",
    "RT",
    "RW",
    "TABUNG TUJUAN",
    "DOKUMEN PENDUKUNG",
  ]);

  dptbList.forEach((v, idx) => {
    rows.push([
      idx + 1,
      `'${v.nik}`,
      `'${v.kk || "-"}`,
      v.namaLengkap,
      v.jenisKelamin,
      `${v.tempatLahir}, ${v.tanggalLahir}`,
      v.statusPerkawinan === "S" ? "Kawin" : v.statusPerkawinan === "B" ? "Belum" : "Pernah",
      v.alamat,
      v.rt,
      v.rw,
      v.tps.replace(/TPS/gi, "Tabung"),
      "KTP-el / Surat Keterangan Pindah Masuk",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
    { wch: 8 },
    { wch: 24 },
    { wch: 14 },
    { wch: 30 },
    { wch: 8 },
    { wch: 8 },
    { wch: 16 },
    { wch: 32 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Model A.2 DPTb");
  XLSX.writeFile(wb, `MODEL_A2_DPTB_PILKADES_${selectedTps.replace(/\s+/g, "_")}.xlsx`);
}

export function exportModelA2Pdf(voters: Voter[], selectedTps: string = "SEMUA") {
  const dptbList = voters.filter((v) => {
    const isTpsMatch = selectedTps === "SEMUA" || v.tps.toLowerCase().includes(selectedTps.toLowerCase());
    return isTpsMatch && (v.coklitStatus === "BARU" || v.disabilitas === "DPTB" || v.tahap === "DPS");
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(KOP_TITLE_1, 105, y, { align: "center" });
  y += 5;
  doc.setFontSize(9.5);
  doc.text(KOP_TITLE_2, 105, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(KOP_SUB, 105, y, { align: "center" });
  y += 3;
  doc.setLineWidth(0.4);
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MODEL A.2: DAFTAR PEMILIH TAMBAHAN (DPTb) PILKADES KALISALAK", 105, y, { align: "center" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Wilayah: ${selectedTps.replace(/TPS/gi, "Tabung")} • Jumlah Pemilih Tambahan: ${dptbList.length} Orang`, 105, y, { align: "center" });
  y += 8;

  // Header Table
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, 182, 6.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("NO", 16, y + 4.5);
  doc.text("NIK", 24, y + 4.5);
  doc.text("NAMA LENGKAP", 60, y + 4.5);
  doc.text("JK", 110, y + 4.5);
  doc.text("ALAMAT (RT/RW)", 122, y + 4.5);
  doc.text("TABUNG", 165, y + 4.5);
  y += 6.5;

  dptbList.slice(0, 40).forEach((v, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 6, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}`, 16, y + 4);
    doc.text(v.nik, 24, y + 4);
    doc.text(v.namaLengkap, 60, y + 4);
    doc.text(v.jenisKelamin, 110, y + 4);
    doc.text(`${v.alamat} (RT ${v.rt}/RW ${v.rw})`, 122, y + 4);
    doc.text(v.tps.replace(/TPS/gi, "Tabung"), 165, y + 4);
    y += 6;
  });

  doc.save(`MODEL_A2_DPTB_PILKADES_${selectedTps.replace(/\s+/g, "_")}.pdf`);
}

// ==========================================
// 3. MODEL A.3: DAFTAR PEMILIH TETAP (DPT) DESA
// ==========================================

export function exportModelA3Excel(voters: Voter[], tpsList: TPSItem[]) {
  const dptVoters = voters.filter((v) => v.statusAktif === "AKTIF");

  // Sheet 1: Rekapitulasi per Tabung
  const rekapRows: (string | number)[][] = [];
  rekapRows.push(["MODEL A.3: BUKU INDUK DAFTAR PEMILIH TETAP (DPT) TINGKAT DESA"]);
  rekapRows.push(["REKAPITULASI DPT PEMILIHAN KEPALA DESA KALISALAK 2026/2027"]);
  rekapRows.push([`Total DPT Sah: ${dptVoters.length} Pemilih`, `Tanggal Pengesahan: ${new Date().toLocaleDateString("id-ID")}`]);
  rekapRows.push([]);

  rekapRows.push(["NO", "NOMOR TABUNG", "NAMA TABUNG PEMILIHAN", "LOKASI TABUNG", "LAKI-LAKI (L)", "PEREMPUAN (P)", "TOTAL DPT"]);

  let grandL = 0;
  let grandP = 0;

  tpsList.forEach((t, idx) => {
    const tpsVoters = dptVoters.filter((v) => v.tps.toLowerCase().includes(t.nomorTps.toLowerCase()) || v.tps.toLowerCase().includes(t.namaTps.toLowerCase()));
    const l = tpsVoters.filter((v) => v.jenisKelamin === "L").length;
    const p = tpsVoters.filter((v) => v.jenisKelamin === "P").length;
    grandL += l;
    grandP += p;

    rekapRows.push([idx + 1, t.nomorTps, t.namaTps, t.lokasi, l, p, l + p]);
  });

  rekapRows.push(["", "TOTAL", "SELURUH WILAYAH DESA KALISALAK", "-", grandL, grandP, grandL + grandP]);

  // Sheet 2: Daftar Lengkap DPT
  const detailRows: (string | number)[][] = [];
  detailRows.push(["NO", "NIK", "NO KK", "NAMA LENGKAP", "JK", "TEMPAT LAHIR", "TGL LAHIR", "STATUS KAWIN", "ALAMAT", "RT", "RW", "TPS"]);
  dptVoters.forEach((v, idx) => {
    detailRows.push([
      idx + 1,
      `'${v.nik}`,
      `'${v.kk || "-"}`,
      v.namaLengkap,
      v.jenisKelamin,
      v.tempatLahir,
      v.tanggalLahir,
      v.statusPerkawinan,
      v.alamat,
      v.rt,
      v.rw,
      v.tps,
    ]);
  });

  const wb = XLSX.utils.book_new();
  const wsRekap = XLSX.utils.aoa_to_sheet(rekapRows);
  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);

  wsRekap["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 24 }, { wch: 28 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  wsDetail["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 8 }, { wch: 8 }, { wch: 16 }];

  XLSX.utils.book_append_sheet(wb, wsRekap, "Rekapitulasi DPT Desa");
  XLSX.utils.book_append_sheet(wb, wsDetail, "Buku Induk DPT Sah");
  XLSX.writeFile(wb, "MODEL_A3_DPT_DESA_KALISALAK_RESMI.xlsx");
}

export function exportModelA3Pdf(voters: Voter[], tpsList: TPSItem[]) {
  const dptVoters = voters.filter((v) => v.statusAktif === "AKTIF");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(KOP_TITLE_1, 105, y, { align: "center" });
  y += 5;
  doc.setFontSize(9.5);
  doc.text(KOP_TITLE_2, 105, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(KOP_SUB, 105, y, { align: "center" });
  y += 3;
  doc.setLineWidth(0.4);
  doc.line(14, y, 196, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("MODEL A.3: REKAPITULASI DAFTAR PEMILIH TETAP (DPT) TINGKAT DESA", 105, y, { align: "center" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Penetapan Rapat Pleno Terbuka P2KD Kalisalak • Total: ${dptVoters.length} Pemilih Sah`, 105, y, { align: "center" });
  y += 8;

  // Tabel Rekapitulasi 13 Tabung Pemilihan
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, 182, 6.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("NO", 17, y + 4.5);
  doc.text("NOMOR & NAMA TABUNG PEMILIHAN", 30, y + 4.5);
  doc.text("LAKI-LAKI", 100, y + 4.5);
  doc.text("PEREMPUAN", 135, y + 4.5);
  doc.text("TOTAL DPT", 170, y + 4.5);
  y += 6.5;

  let grandL = 0;
  let grandP = 0;

  tpsList.forEach((t, idx) => {
    const tpsVoters = dptVoters.filter((v) => v.tps.toLowerCase().includes(t.nomorTps.toLowerCase()) || v.tps.toLowerCase().includes(t.namaTps.toLowerCase()));
    const l = tpsVoters.filter((v) => v.jenisKelamin === "L").length;
    const p = tpsVoters.filter((v) => v.jenisKelamin === "P").length;
    grandL += l;
    grandP += p;

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 5.5, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}`, 17, y + 4);
    doc.text(`${t.nomorTps} - ${t.namaTabung || t.namaTps.replace(/TPS/gi, "Tabung")}`, 30, y + 4);
    doc.text(`${l}`, 105, y + 4);
    doc.text(`${p}`, 140, y + 4);
    doc.text(`${l + p}`, 175, y + 4);
    y += 5.5;
  });

  // Baris Total
  doc.setFillColor(239, 246, 255);
  doc.rect(14, y, 182, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text("TOTAL DPT SE-DESA KALISALAK (13 TABUNG)", 30, y + 4.5);
  doc.text(`${grandL}`, 105, y + 4.5);
  doc.text(`${grandP}`, 140, y + 4.5);
  doc.text(`${grandL + grandP}`, 175, y + 4.5);
  y += 14;

  // Tanda Tangan Pleno P2KD
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Ditetapkan di : Kalisalak", 20, y);
  doc.text("Pada tanggal  : 14 September 2026", 20, y + 4.5);
  doc.text("PANITIA PEMILIHAN KEPALA DESA KALISALAK", 20, y + 9);

  doc.setFont("helvetica", "bold");
  doc.text("Ketua P2KD Desa Kalisalak", 20, y + 15);
  doc.text("Sekretaris P2KD", 85, y + 15);
  doc.text("Ketua BPD Kalisalak", 145, y + 15);

  doc.text("KHASANUDIN, S.Pd.SD", 20, y + 33);
  doc.text("MASHADY, M.H.", 85, y + 33);
  doc.text("( ................................. )", 145, y + 33);

  doc.save("MODEL_A3_DPT_DESA_KALISALAK_RESMI.pdf");
}

// ==========================================
// 4. MODEL A.4: SALINAN DPT PER TABUNG
// ==========================================

export function exportModelA4Excel(voters: Voter[], selectedTps: string = "Tabung 01", isMasked: boolean = false) {
  const filtered = voters.filter((v) => v.statusAktif === "AKTIF" && v.tps.toLowerCase().includes(selectedTps.toLowerCase()));

  const rows: (string | number)[][] = [];
  rows.push(["MODEL A.4: SALINAN DAFTAR PEMILIH TETAP (DPT) PER TABUNG"]);
  rows.push([`DOKUMEN RESMI UNTUK PETUGAS TABUNG, PENGAWAS, DAN SAKSI CALON KEPALA DESA`]);
  rows.push([`Wilayah Penugasan: ${selectedTps.replace(/TPS/gi, "Tabung")}`, `Jumlah Pemilih: ${filtered.length} Jiwa`, `Format: ${isMasked ? "Sensor NIK (Papan Informasi & Saksi)" : "NIK Lengkap (Arsip Petugas Tabung)"}`]);
  rows.push([]);

  rows.push([
    "NO",
    "NOMOR NIK",
    "NOMOR KK",
    "NAMA LENGKAP",
    "JK",
    "TEMPAT / TGL LAHIR",
    "STATUS KAWIN",
    "ALAMAT",
    "RT",
    "RW",
    "TABUNG",
    "PARAF KEHADIRAN",
  ]);

  filtered.forEach((v, idx) => {
    rows.push([
      idx + 1,
      isMasked ? v.nikMasked : `'${v.nik}`,
      isMasked ? `${v.kk?.slice(0, 6)}******` : `'${v.kk || "-"}`,
      v.namaLengkap,
      v.jenisKelamin,
      `${v.tempatLahir}, ${v.tanggalLahir}`,
      v.statusPerkawinan,
      v.alamat,
      v.rt,
      v.rw,
      v.tps.replace(/TPS/gi, "Tabung"),
      "[             ]",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 20 },
    { wch: 28 },
    { wch: 8 },
    { wch: 22 },
    { wch: 12 },
    { wch: 30 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Salinan DPT Tabung");
  XLSX.writeFile(wb, `MODEL_A4_SALINAN_DPT_${selectedTps.replace(/TPS/gi, "TABUNG").replace(/\s+/g, "_")}.xlsx`);
}

export function exportModelA4Pdf(voters: Voter[], selectedTps: string = "Tabung 01", isMasked: boolean = false) {
  const filtered = voters.filter((v) => v.statusAktif === "AKTIF" && v.tps.toLowerCase().includes(selectedTps.toLowerCase()));
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(KOP_TITLE_1, 105, y, { align: "center" });
  y += 5;
  doc.setFontSize(9.5);
  doc.text(KOP_TITLE_2, 105, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(KOP_SUB, 105, y, { align: "center" });
  y += 3;
  doc.setLineWidth(0.4);
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`MODEL A.4: SALINAN DAFTAR PEMILIH TETAP (${selectedTps.replace(/TPS/gi, "Tabung")})`, 105, y, { align: "center" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Salinan Resmi Untuk Petugas Tabung, Saksi Calon, dan Pengawas • Total: ${filtered.length} Pemilih`, 105, y, { align: "center" });
  y += 8;

  // Header Table
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, 182, 6.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("NO", 16, y + 4.5);
  doc.text("NIK", 24, y + 4.5);
  doc.text("NAMA LENGKAP", 62, y + 4.5);
  doc.text("JK", 112, y + 4.5);
  doc.text("ALAMAT (RT/RW)", 124, y + 4.5);
  doc.text("TANDA TERIMA", 165, y + 4.5);
  y += 6.5;

  filtered.slice(0, 40).forEach((v, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 6, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}`, 16, y + 4);
    doc.text(isMasked ? v.nikMasked : v.nik, 24, y + 4);
    doc.text(v.namaLengkap, 62, y + 4);
    doc.text(v.jenisKelamin, 112, y + 4);
    doc.text(`${v.alamat} (RT ${v.rt}/RW ${v.rw})`, 124, y + 4);
    doc.text("[ ........... ]", 168, y + 4);
    y += 6;
  });

  doc.save(`MODEL_A4_SALINAN_DPT_${selectedTps.replace(/\s+/g, "_")}.pdf`);
}
