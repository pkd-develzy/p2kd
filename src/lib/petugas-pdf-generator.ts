import { jsPDF } from "jspdf";
import { MasterPetugasDpt } from "./data-store";

/**
 * petugas-pdf-generator.ts
 * Generator Dokumen PDF Resmi:
 * 1. Surat Pernyataan Netralitas & Integritas Petugas Pendataan DPT (dengan Tanda Tangan Digital)
 * 2. Tanda Bukti Registrasi Pendaftaran
 */

const KOP_TITLE_1 = "PANITIA PEMILIHAN KEPALA DESA (P2KD)";
const KOP_TITLE_2 = "DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL";
const KOP_SUBTITLE = "Sekretariat: Kantor Balai Desa Kalisalak, Jl. Raya Kalisalak No. 01 Margasari 52463";
const KOP_EMAIL_WA = "Email: p2kd@kalisalak.desa.id | Kontak/WA: 0858-7958-4257";

function drawKopSurat(doc: jsPDF): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(KOP_TITLE_1, 105, 18, { align: "center" });

  doc.setFontSize(11);
  doc.text(KOP_TITLE_2, 105, 24, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(KOP_SUBTITLE, 105, 29.5, { align: "center" });
  doc.text(KOP_EMAIL_WA, 105, 34, { align: "center" });

  // Double horizontal rule
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.line(20, 36.5, 190, 36.5);
  doc.setLineWidth(0.25);
  doc.line(20, 37.8, 190, 37.8);

  return 44;
}

/**
 * Membuat Dokumen Surat Pernyataan Netralitas dan Integritas (Format A4 Standar Hukum)
 */
export function generateSuratPernyataanPdf(data: MasterPetugasDpt): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let currentY = drawKopSurat(doc);

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("SURAT PERNYATAAN NETRALITAS DAN INTEGRITAS", 105, currentY, { align: "center" });
  currentY += 4.5;
  doc.setFontSize(9.5);
  doc.text("CALON PETUGAS PENDATAAN DAFTAR PEMILIH TETAP (DPT)", 105, currentY, { align: "center" });
  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Registrasi: ${data.nomorRegistrasi}`, 105, currentY, { align: "center" });
  currentY += 7;

  // Intro text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Yang bertanda tangan di bawah ini:", 20, currentY);
  currentY += 5;

  // Identity Table
  const identityRows = [
    ["Nama Lengkap", `: ${data.namaLengkap}`],
    ["NIK (Nomor Induk Kependudukan)", `: ${data.nik}`],
    ["Nomor Kartu Keluarga (KK)", `: ${data.noKk}`],
    ["Tempat, Tanggal Lahir", `: ${data.tempatLahir}, ${data.tanggalLahir}`],
    ["Jenis Kelamin", `: ${data.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}`],
    ["Alamat Domisili", `: ${data.alamat}, RT ${data.rt} / RW ${data.rw}, Desa Kalisalak`],
    ["Nomor Telepon / WhatsApp", `: ${data.nomorWa}`],
    ["Wilayah Tugas yang Diajukan", `: ${data.assignedWilayah || "RW " + data.rw + " Desa Kalisalak"}`],
  ];

  doc.setFontSize(8.5);
  identityRows.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 24, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(val, 80, currentY);
    currentY += 4.2;
  });

  currentY += 2;

  // Declaration opening
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const introStatement =
    "Menyatakan dengan sesungguhnya bahwa dalam rangka menjalankan tugas dan wewenang sebagai Petugas Pendataan Pemilih (Pantarlih / Petugas Lapangan) Pilkades Desa Kalisalak Tahun 2026/2027, saya menyatakan dan berjanji secara sadar:";
  const splitIntro = doc.splitTextToSize(introStatement, 170);
  doc.text(splitIntro, 20, currentY);
  currentY += splitIntro.length * 4.2 + 2;

  // 8 Points of Integrity
  const points = [
    "Tidak menjadi calon Kepala Desa Desa Kalisalak.",
    "Tidak menjadi anggota, pengurus, relawan, atau tim sukses salah satu calon Kepala Desa.",
    "Tidak memihak, mengkampanyekan, atau menunjukkan keberpihakan kepada salah satu calon tertentu.",
    "Tidak menerima uang, janji, barang, atau imbalan materi dari calon Kepala Desa maupun tim suksesnya.",
    "Tidak memanipulasi, mengubah, merekayasa, atau memalsukan data pemilih dalam bentuk apapun.",
    "Tidak memberikan, membocorkan, atau mendistribusikan data pemilih kepada pihak yang tidak berwenang.",
    "Bersedia menjaga kerahasiaan data pribadi pemilih sesuai ketentuan UU No. 27/2022 tentang Perlindungan Data Pribadi.",
    "Bersedia diberhentikan seketika dan diproses hukum sesuai ketentuan peraturan perundang-undangan apabila melanggar.",
  ];

  points.forEach((p, idx) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}.`, 23, currentY);
    doc.setFont("helvetica", "normal");
    const splitPoint = doc.splitTextToSize(p, 162);
    doc.text(splitPoint, 29, currentY);
    currentY += splitPoint.length * 3.8 + 1;
  });

  currentY += 2;

  // Closing text
  const closingText =
    "Demikian Surat Pernyataan Netralitas dan Integritas ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun, untuk dipergunakan sebagaimana mestinya sebagai syarat administrasi Petugas Pendataan DPT P2KD Kalisalak.";
  const splitClosing = doc.splitTextToSize(closingText, 170);
  doc.text(splitClosing, 20, currentY);
  currentY += splitClosing.length * 3.8 + 3;

  // Signature section
  const dateFormatted = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sigX = 130;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Kalisalak, ${dateFormatted}`, sigX, currentY);
  currentY += 4.5;
  doc.text("Yang Menyatakan,", sigX, currentY);
  currentY += 2;

  // Embed Digital Signature Image from Canvas Base64
  if (data.tandaTanganUrl && data.tandaTanganUrl.startsWith("data:image/")) {
    try {
      doc.addImage(data.tandaTanganUrl, "PNG", sigX - 5, currentY, 45, 18);
    } catch {
      // Fallback text if image embedding fails
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.text("[Tanda Tangan Digital Terekam]", sigX, currentY + 10);
    }
  }

  currentY += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(data.namaLengkap, sigX, currentY);
  doc.setLineWidth(0.3);
  doc.line(sigX, currentY + 0.8, sigX + 55, currentY + 0.8);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIK: ${data.nik}`, sigX, currentY);

  // Footer bar with official verification notice
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 280, 190, 280);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Dokumen Elektronik Resmi • Sistem Rekrutmen Petugas P2KD Desa Kalisalak • Keabsahan terverifikasi secara digital",
    105,
    284,
    { align: "center" }
  );

  return doc;
}

/**
 * Membuat Dokumen Bukti Tanda Terima Pendaftaran Petugas Pendataan DPT
 */
export function generateBuktiPendaftaranPdf(data: MasterPetugasDpt): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let currentY = drawKopSurat(doc);

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("BUKTI TANDA TERIMA PENDAFTARAN", 105, currentY, { align: "center" });
  currentY += 4.5;
  doc.setFontSize(9.5);
  doc.text("CALON PETUGAS PENDATAAN DAFTAR PEMILIH TETAP (DPT)", 105, currentY, { align: "center" });
  currentY += 7;

  // Big Registration Badge
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(20, currentY, 170, 18, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("NOMOR REGISTRASI PENDAFTARAN RESMI:", 105, currentY + 5.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 64, 175); // blue-800
  doc.text(data.nomorRegistrasi, 105, currentY + 13, { align: "center" });
  currentY += 24;

  // Status Box
  let statusBadgeBg = [254, 243, 199]; // amber-100
  let statusBadgeText = "MENUNGGU VERIFIKASI PANITIA";

  if (data.status === "PERLU_KLARIFIKASI") {
    statusBadgeBg = [255, 237, 213]; // orange-100
    statusBadgeText = "PERLU KLARIFIKASI (TERDAPAT CATATAN AFILIASI)";
  } else if (data.status === "LOLOS") {
    statusBadgeBg = [219, 234, 254]; // blue-100
    statusBadgeText = "LOLOS SELEKSI ADMINISTRASI";
  } else if (data.status === "DITETAPKAN") {
    statusBadgeBg = [209, 250, 229]; // emerald-100
    statusBadgeText = "DITETAPKAN SEBAGAI PETUGAS PENDATAAN DPT";
  } else if (data.status === "TIDAK_LOLOS") {
    statusBadgeBg = [254, 226, 226]; // red-100
    statusBadgeText = "TIDAK LOLOS SELEKSI ADMINISTRASI";
  }

  doc.setFillColor(statusBadgeBg[0], statusBadgeBg[1], statusBadgeBg[2]);
  doc.roundedRect(20, currentY, 170, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`STATUS SAAT INI: ${statusBadgeText}`, 105, currentY + 6, { align: "center" });
  currentY += 14;

  // Registration Biodata Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("A. BIODATA PENDAFTAR", 20, currentY);
  currentY += 5;

  const bioRows = [
    ["Nama Lengkap", `: ${data.namaLengkap}`],
    ["NIK", `: ${data.nik}`],
    ["Nomor KK", `: ${data.noKk}`],
    ["Tempat, Tgl Lahir", `: ${data.tempatLahir}, ${data.tanggalLahir}`],
    ["Jenis Kelamin", `: ${data.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}`],
    ["Alamat Domisili", `: ${data.alamat}, RT ${data.rt} / RW ${data.rw}`],
    ["Desa", ": Desa Kalisalak"],
    ["Nomor WhatsApp", `: ${data.nomorWa}`],
    ["Waktu Pendaftaran", `: ${data.tanggalPendaftaran}`],
  ];

  doc.setFontSize(8.5);
  bioRows.forEach(([lbl, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(lbl, 25, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(val, 75, currentY);
    currentY += 4.8;
  });

  currentY += 4;

  // Question summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("B. HASIL SKRINING NETRALITAS & AFILIASI", 20, currentY);
  currentY += 5;

  const questions = [
    ["Calon Kepala Desa?", data.isCalonKades ? `Ya (${data.keteranganCalonKades || "Ada keterangan"})` : "Tidak"],
    ["Tim Sukses/Relawan Calon?", data.isTimSukses ? `Ya (${data.keteranganTimSukses || "Ada keterangan"})` : "Tidak"],
    [
      "Memiliki Kepentingan Khusus?",
      data.isKepentinganCalon ? `Ya (${data.keteranganKepentingan || "Ada keterangan"})` : "Tidak",
    ],
  ];

  doc.setFontSize(8.5);
  questions.forEach(([q, a]) => {
    doc.setFont("helvetica", "normal");
    doc.text(q, 25, currentY);
    doc.setFont("helvetica", "bold");
    if (a.startsWith("Ya")) {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(22, 101, 52);
    }
    doc.text(`: ${a}`, 95, currentY);
    doc.setTextColor(15, 23, 42);
    currentY += 4.8;
  });

  currentY += 4;

  // Instructions for Next Steps
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("C. PETUNJUK TAHAPAN SELANJUTNYA", 20, currentY);
  currentY += 5;

  const steps = [
    "Simpan tanda bukti pendaftaran ini dan catat Nomor Registrasi Anda.",
    "Periksa secara berkala status pendaftaran Anda melalui website: https://www.p2kdkalisalak.my.id/daftarpantarlih.",
    "Bagi pendaftar berstatus 'Perlu Klarifikasi', Panitia P2KD akan mengundang Anda melalui WhatsApp untuk klarifikasi berkas.",
    "Pendaftar yang ditetapkan wajib mengikuti Bimbingan Teknis (Bimtek) Pemutakhiran Data Pemilih yang diselenggarakan oleh P2KD Kalisalak.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  steps.forEach((s, idx) => {
    doc.text(`${idx + 1}.`, 25, currentY);
    const splitS = doc.splitTextToSize(s, 160);
    doc.text(splitS, 31, currentY);
    currentY += splitS.length * 3.8 + 1;
  });

  currentY += 5;

  // Signature Stamp box
  const sigBoxY = currentY;
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, sigBoxY, 82, 38, 2, 2);
  doc.roundedRect(108, sigBoxY, 82, 38, 2, 2);

  // Left box: Tanda Tangan Pendaftar
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("TANDA TANGAN PENDAFTAR", 61, sigBoxY + 5, { align: "center" });

  if (data.tandaTanganUrl && data.tandaTanganUrl.startsWith("data:image/")) {
    try {
      doc.addImage(data.tandaTanganUrl, "PNG", 38, sigBoxY + 8, 45, 16);
    } catch {
      doc.text("[Tanda Tangan Digital]", 61, sigBoxY + 16, { align: "center" });
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(data.namaLengkap, 61, sigBoxY + 31, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Pendaftar / Calon Petugas", 61, sigBoxY + 35, { align: "center" });

  // Right box: Stempel Validasi P2KD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("SEKRETARIAT P2KD KALISALAK", 149, sigBoxY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Diverifikasi secara sistematis oleh:", 149, sigBoxY + 11, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text("Sistem Seleksi Elektronik P2KD", 149, sigBoxY + 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 149, sigBoxY + 31, { align: "center" });
  doc.text("Status Resmi Terdaftar di Basis Data", 149, sigBoxY + 35, { align: "center" });

  // Bottom line
  doc.setLineWidth(0.3);
  doc.line(20, 280, 190, 280);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Dokumen ini sah dan diterbitkan otomatis oleh Sekretariat Panitia Pemilihan Kepala Desa Kalisalak",
    105,
    284,
    { align: "center" }
  );

  return doc;
}

/**
 * Helper untuk mengunduh dokumen PDF langsung di browser klien
 */
export function downloadPetugasPdf(data: MasterPetugasDpt, type: "pernyataan" | "bukti") {
  const safeName = data.namaLengkap.replace(/[^a-zA-Z0-9]/g, "_");
  if (type === "pernyataan") {
    const doc = generateSuratPernyataanPdf(data);
    doc.save(`Surat_Pernyataan_Netralitas_${data.nomorRegistrasi}_${safeName}.pdf`);
  } else {
    const doc = generateBuktiPendaftaranPdf(data);
    doc.save(`Bukti_Pendaftaran_${data.nomorRegistrasi}_${safeName}.pdf`);
  }
}
