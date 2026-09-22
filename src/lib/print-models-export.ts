import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { Voter, TPSItem } from "@/components/pages/admin/types";

/**
 * print-models-export.ts
 * Utilitas Resmi Ekspor & Unduh Data Pusat Cetak Dokumen P2KD Kalisalak:
 * - Model A.1: Daftar Pemilih Sementara (DPS) Pilkades [dengan sub-tabel verifikasi pada setiap data pemilih]
 * - Model A.2: Daftar Pemilih Tambahan (DPTb)
 * - Model A.3: Daftar Pemilih Tetap (DPT) Pilkades Tingkat Desa
 * - Model A.4: Salinan Daftar Pemilih Tetap per Tabung
 */

const KOP_TITLE_1 = "PANITIA PEMILIHAN KEPALA DESA (P2KD)";
const KOP_TITLE_2 = "DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL";
const KOP_SUB = "Sekretariat: Gedung Balai Desa Kalisalak, Jl. K. Abdul Latief, Kalisalak, Kec. Margasari, Kabupaten Tegal 52463";

/**
 * Helper pencocokan tabung yang robust antara nomor tabung, nama tabung, atau RW
 */
export function matchTpsVoter(voterTps: string, targetTps: string): boolean {
  if (!targetTps || targetTps === "SEMUA") return true;
  if (!voterTps) return false;

  const targetDigits = targetTps.match(/\d+/)?.[0];
  const voterDigits = voterTps.match(/\d+/)?.[0];

  if (targetDigits && voterDigits) {
    if (parseInt(targetDigits, 10) === parseInt(voterDigits, 10)) {
      return true;
    }
  }

  const normTarget = targetTps.toLowerCase().replace(/tabung/gi, "").replace(/tps/gi, "").trim();
  const normVoter = voterTps.toLowerCase().replace(/tabung/gi, "").replace(/tps/gi, "").trim();

  return normVoter.includes(normTarget) || normTarget.includes(normVoter);
}

// ==========================================
// 1. MODEL A.1: DAFTAR PEMILIH SEMENTARA (DPS)
// [DENGAN 1 SUB-TABEL DI BAWAHNYA PADA SETIAP 1 DATA PEMILIH]
// ==========================================

export function exportModelA1Excel(voters: Voter[], selectedTps: string = "SEMUA") {
  const filtered = voters.filter(
    (v) => v.statusAktif === "AKTIF" && matchTpsVoter(v.tps, selectedTps)
  );

  const rows: (string | number)[][] = [];

  // Header Title
  rows.push(["MODEL A.1: DAFTAR PEMILIH SEMENTARA (DPS) PILKADES KALISALAK 2026/2027"]);
  rows.push(["LEMBAR KERJA PEMUTAKHIRAN & COKLIT FAKTUAL PANTARLIH / KOORDINATOR RW"]);
  rows.push([
    `Wilayah Penugasan: ${selectedTps.replace(/TPS/gi, "Tabung")}`,
    `Total Pemilih: ${filtered.length} Jiwa`,
    `Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}`,
  ]);
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
    // PENTING: Jika tidak ada catatan, biarkan KOSONG (jangan ada teks asumtif otomatis)
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
      v.coklitStatus || "[  ] SESUAI   [  ] UBAH DATA   [  ] TMS",
      v.coklitCatatan ? v.coklitCatatan : "",
      v.alasanTms ? `TMS: ${v.alasanTms}` : "",
      v.coklitPetugas ? v.coklitPetugas : "",
      v.coklitTanggal ? v.coklitTanggal : "",
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
  const filename = `MODEL_A1_DPS_PILKADES_${selectedTps.replace(/TPS/gi, "TABUNG").replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportModelA1Pdf(voters: Voter[], selectedTps: string = "SEMUA") {
  const filtered = voters.filter(
    (v) => v.statusAktif === "AKTIF" && matchTpsVoter(v.tps, selectedTps)
  );

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = 14;

  const renderHeader = () => {
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("MODEL A.1: DAFTAR PEMILIH SEMENTARA (DPS) & LEMBAR KERJA COKLIT", 148.5, y, { align: "center" });
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Wilayah Penugasan: ${selectedTps.replace(/TPS/gi, "Tabung")} • Total Pemilih: ${filtered.length} Orang`,
      148.5,
      y,
      { align: "center" }
    );
    y += 7;
  };

  renderHeader();

  filtered.forEach((v, idx) => {
    if (y > 175) {
      doc.addPage();
      y = 14;
      renderHeader();
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
    const statusTxt = v.coklitStatus === "SESUAI"
      ? "[ ✓ SESUAI ]"
      : v.coklitStatus === "UBAH_DATA"
      ? "[ ✎ UBAH DATA ]"
      : v.coklitStatus === "TMS"
      ? "[ ✕ TMS ]"
      : "[   ] SESUAI   [   ] UBAH   [   ] TMS";
    doc.text(`Status: ${statusTxt}`, 80, y + 11);
    doc.text(`Koreksi: ${v.coklitCatatan ? v.coklitCatatan : "........................................"}`, 130, y + 11);
    doc.text(`Petugas: ${v.coklitPetugas || "...................."}`, 190, y + 11);
    doc.text(`Tgl: ${v.coklitTanggal || "..../..../2026"}`, 230, y + 11);
    doc.text("Paraf: [ ........... ]", 258, y + 11);

    // Keterangan tambahan (KOSONG jika tidak ada TMS/koreksi khusus)
    doc.setFontSize(6);
    const catatanExtra = v.alasanTms ? `Catatan TMS: ${v.alasanTms}` : "Catatan / Bukti Lapangan: ............................................................................................";
    doc.text(catatanExtra, 18, y + 16.5);
    doc.text("Paraf Pemilih: [ ........... ]", 245, y + 16.5);

    y += 24;
  });

  doc.save(`MODEL_A1_DPS_PILKADES_${selectedTps.replace(/TPS/gi, "TABUNG").replace(/\s+/g, "_")}.pdf`);
}

// ==========================================
// 2. MODEL A.2: DAFTAR PEMILIH TAMBAHAN (DPTb)
// ==========================================

export function exportModelA2Excel(voters: Voter[], selectedTps: string = "SEMUA") {
  // Pemilih Tambahan: terdaftar sebagai BARU atau DPTb (BUKAN seluruh DPS)
  const dptbList = voters.filter((v) => {
    const isTpsMatch = matchTpsVoter(v.tps, selectedTps);
    return isTpsMatch && v.statusAktif === "AKTIF" && (v.coklitStatus === "BARU" || v.disabilitas === "DPTB" || v.tahap === "DPTB");
  });

  const rows: (string | number)[][] = [];
  rows.push(["MODEL A.2: DAFTAR PEMILIH TAMBAHAN (DPTb) PILKADES KALISALAK 2026/2027"]);
  rows.push(["DAFTAR WARGA YANG MENGGUNAKAN HAK PILIH TAMBAHAN DENGAN KTP-EL / SURAT PINDAH"]);
  rows.push([
    `Wilayah: ${selectedTps.replace(/TPS/gi, "Tabung")}`,
    `Total Pemilih DPTb: ${dptbList.length} Jiwa`,
    `Tanggal: ${new Date().toLocaleDateString("id-ID")}`,
  ]);
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

  if (dptbList.length === 0) {
    // Sediakan 5 baris blanko pendaftaran kosong jika belum ada data pemilih tambahan
    for (let i = 1; i <= 5; i++) {
      rows.push([
        i,
        "....................................",
        "....................................",
        "........................................................",
        "L / P",
        "........................, ..../..../........",
        "S / B / P",
        "........................................................",
        "....",
        "....",
        selectedTps.replace(/TPS/gi, "Tabung"),
        "KTP-el / Surat Pindah",
      ]);
    }
  } else {
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
  }

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
  XLSX.writeFile(wb, `MODEL_A2_DPTB_PILKADES_${selectedTps.replace(/TPS/gi, "TABUNG").replace(/\s+/g, "_")}.xlsx`);
}

export function exportModelA2Pdf(voters: Voter[], selectedTps: string = "SEMUA") {
  const dptbList = voters.filter((v) => {
    const isTpsMatch = matchTpsVoter(v.tps, selectedTps);
    return isTpsMatch && v.statusAktif === "AKTIF" && (v.coklitStatus === "BARU" || v.disabilitas === "DPTB" || v.tahap === "DPTB");
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 14;

  const renderHeader = () => {
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
    doc.text(
      `Wilayah: ${selectedTps.replace(/TPS/gi, "Tabung")} • Jumlah Terdaftar: ${dptbList.length} Orang`,
      105,
      y,
      { align: "center" }
    );
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
  };

  renderHeader();

  if (dptbList.length === 0) {
    // Blanko pendaftaran fisik 10 baris
    for (let i = 1; i <= 10; i++) {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 8, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i}`, 16, y + 5);
      doc.text("....................................", 24, y + 5);
      doc.text("................................................", 60, y + 5);
      doc.text("L / P", 110, y + 5);
      doc.text("RT ..... / RW .....", 122, y + 5);
      doc.text(selectedTps.replace(/TPS/gi, "Tabung"), 165, y + 5);
      y += 8;
    }
  } else {
    dptbList.forEach((v, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 14;
        renderHeader();
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
  }

  doc.save(`MODEL_A2_DPTB_PILKADES_${selectedTps.replace(/TPS/gi, "TABUNG").replace(/\s+/g, "_")}.pdf`);
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
  rows_add_meta:
  rekapRows.push([`Total DPT Sah: ${dptVoters.length} Pemilih`, `Tanggal Pengesahan: ${new Date().toLocaleDateString("id-ID")}`]);
  rekapRows.push([]);

  rekapRows.push(["NO", "NOMOR TABUNG", "NAMA TABUNG PEMILIHAN", "LOKASI TABUNG", "LAKI-LAKI (L)", "PEREMPUAN (P)", "TOTAL DPT"]);

  let grandL = 0;
  let grandP = 0;

  tpsList.forEach((t, idx) => {
    const tpsVoters = dptVoters.filter((v) => matchTpsVoter(v.tps, t.namaTps) || matchTpsVoter(v.tps, t.nomorTps));
    const l = tpsVoters.filter((v) => v.jenisKelamin === "L").length;
    const p = tpsVoters.filter((v) => v.jenisKelamin === "P").length;
    grandL += l;
    grandP += p;

    rekapRows.push([
      idx + 1,
      t.nomorTps,
      (t.namaTabung || t.namaTps).replace(/TPS/gi, "Tabung"),
      t.lokasi,
      l,
      p,
      l + p,
    ]);
  });

  rekapRows.push(["", "TOTAL", "SELURUH WILAYAH DESA KALISALAK", "-", grandL, grandP, grandL + grandP]);

  // Sheet 2: Buku Induk DPT Sah
  const detailRows: (string | number)[][] = [];
  detailRows.push([
    "NO",
    "NIK",
    "NO KK",
    "NAMA LENGKAP",
    "JK",
    "TEMPAT LAHIR",
    "TGL LAHIR",
    "STATUS KAWIN",
    "ALAMAT",
    "RT",
    "RW",
    "TABUNG PEMILIHAN",
  ]);

  dptVoters.forEach((v, idx) => {
    detailRows.push([
      idx + 1,
      `'${v.nik}`,
      `'${v.kk || "-"}`,
      v.namaLengkap,
      v.jenisKelamin,
      v.tempatLahir,
      v.tanggalLahir,
      v.statusPerkawinan === "S" ? "Kawin" : v.statusPerkawinan === "B" ? "Belum" : "Pernah",
      v.alamat,
      v.rt,
      v.rw,
      v.tps.replace(/TPS/gi, "Tabung"),
    ]);
  });

  const wb = XLSX.utils.book_new();
  const wsRekap = XLSX.utils.aoa_to_sheet(rekapRows);
  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);

  wsRekap["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 24 }, { wch: 28 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  wsDetail["!cols"] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 8 },
    { wch: 8 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRekap, "Rekapitulasi DPT 13 Tabung");
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
  doc.setFontSize(8.5);
  doc.text(`Pemilihan Kepala Desa Kalisalak Tahun 2026/2027 • Total DPT: ${dptVoters.length} Jiwa`, 105, y, { align: "center" });
  y += 7;

  // Header Table
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, 182, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("NO", 17, y + 4.8);
  doc.text("TABUNG PEMILIHAN", 28, y + 4.8);
  doc.text("LOKASI PEMUNGUTAN", 75, y + 4.8);
  doc.text("L", 132, y + 4.8);
  doc.text("P", 148, y + 4.8);
  doc.text("TOTAL", 168, y + 4.8);
  y += 7;

  let grandL = 0;
  let grandP = 0;

  tpsList.forEach((t, idx) => {
    const tpsVoters = dptVoters.filter((v) => matchTpsVoter(v.tps, t.namaTps) || matchTpsVoter(v.tps, t.nomorTps));
    const l = tpsVoters.filter((v) => v.jenisKelamin === "L").length;
    const p = tpsVoters.filter((v) => v.jenisKelamin === "P").length;
    grandL += l;
    grandP += p;

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 6.5, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}`, 18, y + 4.5);
    doc.text((t.namaTabung || t.namaTps).replace(/TPS/gi, "Tabung"), 28, y + 4.5);
    doc.text(t.lokasi, 75, y + 4.5);
    doc.text(`${l}`, 132, y + 4.5);
    doc.text(`${p}`, 148, y + 4.5);
    doc.setFont("helvetica", "bold");
    doc.text(`${l + p}`, 168, y + 4.5);
    y += 6.5;
  });

  // Total Row
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, 182, 7.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL DPT DESA KALISALAK", 28, y + 5);
  doc.text(`${grandL}`, 132, y + 5);
  doc.text(`${grandP}`, 148, y + 5);
  doc.text(`${grandL + grandP}`, 168, y + 5);
  y += 14;

  // Lembar Pengesahan
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
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
  const filtered = voters.filter(
    (v) => v.statusAktif === "AKTIF" && matchTpsVoter(v.tps, selectedTps)
  );

  const rows: (string | number)[][] = [];
  rows.push(["MODEL A.4: SALINAN DAFTAR PEMILIH TETAP (DPT) PER TABUNG"]);
  rows.push(["DOKUMEN RESMI UNTUK PETUGAS TABUNG, PENGAWAS, DAN SAKSI CALON KEPALA DESA"]);
  rows.push([
    `Wilayah Penugasan: ${selectedTps.replace(/TPS/gi, "Tabung")}`,
    `Jumlah Pemilih: ${filtered.length} Jiwa`,
    `Format: ${isMasked ? "Sensor NIK (Papan Informasi & Saksi)" : "NIK Lengkap (Arsip Petugas Tabung)"}`,
  ]);
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
      v.statusPerkawinan === "S" ? "Kawin" : v.statusPerkawinan === "B" ? "Belum" : "Pernah",
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
  const filtered = voters.filter(
    (v) => v.statusAktif === "AKTIF" && matchTpsVoter(v.tps, selectedTps)
  );

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 14;

  const renderHeader = () => {
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
    doc.text(
      `Salinan Resmi Untuk Petugas Tabung, Saksi Calon, dan Pengawas • Total: ${filtered.length} Pemilih`,
      105,
      y,
      { align: "center" }
    );
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
  };

  renderHeader();

  // CETAK SEMUA PEMILIH DENGAN PAGINATION PENUH (HAPUS SLICE 40)
  filtered.forEach((v, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 14;
      renderHeader();
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

  doc.save(`MODEL_A4_SALINAN_DPT_${selectedTps.replace(/TPS/gi, "TABUNG").replace(/\s+/g, "_")}.pdf`);
}
