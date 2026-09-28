import { jsPDF } from "jspdf";

/**
 * bimtek-pdf-generator.ts
 * Generator Dokumen PDF Resmi: Bimbingan Teknis (Bimtek)
 * Buku Panduan Operasional Sistem Petugas Lapangan & Aplikasi Mobile P2KD
 * Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak 2026/2027
 */

const KOP_INSTANSI_1 = "PANITIA PEMILIHAN KEPALA DESA (P2KD)";
const KOP_INSTANSI_2 = "DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL";
const KOP_ALAMAT = "Sekretariat: Gedung Balai Desa Kalisalak, Jl. K. Abdul Latief, Kalisalak, Kec. Margasari, Kabupaten Tegal 52463";
const KOP_KONTAK = "Portal: www.p2kdkalisalak.my.id | Email: panitia@p2kdkalisalak.my.id | WA: +62 878-3018-8452";

function renderKop(doc: jsPDF): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(KOP_INSTANSI_1, 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.text(KOP_INSTANSI_2, 105, 20.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(KOP_ALAMAT, 105, 25.5, { align: "center" });
  doc.text(KOP_KONTAK, 105, 29.5, { align: "center" });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(18, 32, 192, 32);
  doc.setLineWidth(0.2);
  doc.line(18, 33.2, 192, 33.2);

  return 39;
}

function renderFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Buku Panduan Sistem Petugas Lapangan • P2KD Desa Kalisalak 2026/2027 • Dokumen Kerja Resmi",
    18,
    288
  );
  doc.text(`Halaman ${pageNum} dari ${totalPages}`, 192, 288, { align: "right" });
}

/**
 * Generate Dokumen Lengkap: Buku Panduan Operasional Sistem Pemutakhiran Digital P2KD (5 Halaman)
 */
export function generateMateriBimtekPdf(): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalPages = 5;

  // ==================== HALAMAN 1: PENGENALAN SISTEM & 5 MENU UTAMA ====================
  let y = renderKop(doc);

  // Judul Dokumen
  doc.setFillColor(30, 58, 138); // blue-900
  doc.roundedRect(18, y, 174, 22, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("PANDUAN OPERASIONAL SISTEM PETUGAS LAPANGAN P2KD", 105, y + 8, { align: "center" });
  doc.setFontSize(9);
  doc.text("APLIKASI MOBILE PWA/APK PANTARLIH & KOORDINATOR RW", 105, y + 15, { align: "center" });

  y += 27;

  // Mengapa Sistem Ini Dibuat?
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(18, y, 174, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text("ARSITEKTUR & MODEL KERJA SISTEM PETUGAS LAPANGAN:", 22, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("1. Native Mobile Bottom Bar: Menu native di bawah layar smartphone tanpa gangguan sidebar desktop.", 22, y + 10.5);
  doc.text("2. Runtutan Resmi 5 Tahapan: CALON DPS -> DPS -> DPSHP -> DPSHP Akhir -> DPT (Data saat ini: Calon DPS).", 22, y + 15);
  doc.text("3. Smart RW Locking: Akun petugas otomatis terkunci hanya untuk memproses warga di RW penugasan.", 22, y + 19.5);
  doc.text("4. Instant Rear Camera: Kamera belakang aktif seketika untuk pemindaian QR stiker dan foto bukti fisik.", 22, y + 23.5);

  y += 30;

  // Bab 1: Akses & Kredensial Akun
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 1. KREDENSIAL LOGIN & APLIKASI NATIVE PETUGAS LAPANGAN", 18, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const p1 =
    "Aplikasi lapangan menggunakan format Web App Native (PWA/.APK) yang dipasang pada layar smartphone petugas. Tidak memerlukan login manual yang berulang karena sesi terenkripsi secara aman:";
  doc.text(doc.splitTextToSize(p1, 174), 18, y);
  y += 10;

  // Tabel Kredensial
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(18, y, 174, 34, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("KREDENSIAL LOGIN RESMI PETUGAS:", 22, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("• Portal Sistem        : https://www.p2kdkalisalak.my.id/admin", 22, y + 11);
  doc.text("• Format Username      : Nama akhir pendaftar (huruf kecil tanpa spasi)", 22, y + 16);
  doc.text("  Contoh: MAR'UFAH -> marufah | LINDA FARIDA -> farida | YANI YUSWANTI -> yuswanti", 25, y + 20);
  doc.text("• Password Bawaan      : p2kd2026 (Dapat diubah secara mandiri pada Menu Akun)", 22, y + 25);
  doc.text("• Penguncian Wilayah   : Sistem mengunci filter data ke RW Anda (contoh: Petugas RW 03 hanya RW 03).", 22, y + 30);

  y += 38;

  // Bab 2: 5 Menu Native Bottom Navigation
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 2. ANATOMI 5 MENU BILAH BAWAH (BOTTOM NAVIGATION BAR)", 18, y);
  y += 5.5;

  const menuItems = [
    { name: "1. Pemutakhiran", desc: "Lembar kerja door-to-door. Filter RT, cari NIK/Nama, status faktual, disabilitas, KTP-el, no HP." },
    { name: "2. Calon DPS", desc: "Grid 4 Tahapan (Calon DPS, DPS, DPSHP, DPSHP Akhir) & tabel master 7.787 Calon DPS RW." },
    { name: "3. Camera", desc: "Kamera belakang langsung menyala otomatis untuk scan QR stiker dan foto bukti KTP/KK/Surat." },
    { name: "4. DPT", desc: "Informasi tahapan penetapan DPT resmi tingkat desa, sistem kunci digital hash, dan nomor Tabung TPS." },
    { name: "5. Akun", desc: "Kartu profil petugas, unggah foto seragam (kompresi kanvas otomatis), ganti kata sandi, info sesi & logout." },
  ];

  menuItems.forEach((m) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(18, y, 174, 9, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(m.name, 22, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`: ${m.desc}`, 52, y + 5.5);
    y += 11;
  });

  renderFooter(doc, 1, totalPages);

  // ==================== HALAMAN 2: SOP 4 AKSI TOMBOL PEMUTAKHIRAN ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 3. PANDUAN LAPANGAN: 4 TOMBOL AKSI PEMUTAKHIRAN DATA", 18, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const pAksi =
    "Saat Anda memeriksa dokumen fisik KTP-el / KK warga di rumah, buka Menu 1 (Pemutakhiran). Cari nama atau NIK warga. Kartu pemilih memiliki 4 tombol aksi cepat yang langsung tersinkronisasi ke server:";
  doc.text(doc.splitTextToSize(pAksi, 174), 18, y);
  y += 10;

  // Box 1: Tombol Sesuai (Hijau)
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(18, y, 174, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text("A. TOMBOL 'SESUAI' (HIJAU 1-SENTUHAN)", 22, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("• Kapan Digunakan   : Jika SELURUH data (Nama, NIK, Tgl Lahir, JK, RT/RW) pada KTP/KK warga cocok 100%.", 22, y + 10.5);
  doc.text("• Efek Pada Sistem  : Sentuh satu kali. Badge berubah 'SESUAI ✓', nama Anda tersimpan sebagai pemverifikasi,", 22, y + 15);
  doc.text("                       dan stempel waktu detik per detik tercatat pada audit trail server.", 22, y + 19.5);
  doc.text("• Fitur Tambahan    : Anda dapat mencentang status KTP-el fisik dan mengisi nomor HP aktif warga.", 22, y + 24);

  y += 32;

  // Box 2: Tombol Ubah Data (Biru)
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(18, y, 174, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text("B. TOMBOL 'UBAH DATA' (KOREKSI ELEMEN DATA & DISABILITAS)", 22, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("• Kapan Digunakan   : Jika ada salah eja nama, NIK keliru, tanggal lahir salah, status kawin berubah,", 22, y + 10.5);
  doc.text("                       perbaikan nomor RT, atau pencatatan ragam disabilitas (Fisik, Netra, Rungu, Mental).", 22, y + 15);
  doc.text("• Efek Pada Sistem  : Formulir koreksi muncul. Perbaiki kolom terkait, lalu klik 'Simpan Perubahan'.", 22, y + 19.5);
  doc.text("                       Status berubah menjadi 'DIPERBAIKI' dan diselaraskan ke penetapan DPSHP.", 22, y + 24);

  y += 34;

  // Box 3: Tombol TMS (Merah)
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(18, y, 174, 31, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(159, 18, 57); // rose-900
  doc.text("C. TOMBOL 'TMS' (TIDAK MEMENUHI SYARAT)", 22, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("• Kapan Digunakan   : Jika pemilih terdaftar telah meninggal, pindah domisili keluar desa, data ganda,", 22, y + 10.5);
  doc.text("                       belum cukup umur, menjadi prajurit TNI/Polri, atau bukan warga sah Kalisalak.", 22, y + 15);
  doc.text("• Efek Pada Sistem  : Pilih salah satu dari 6 kategori TMS resmi, masukkan catatan/nomor surat keterangan,", 22, y + 19.5);
  doc.text("                       lalu simpan. Pemilih otomatis disaring keluar dari penetapan DPSHP dan DPT.", 22, y + 24);

  y += 35;

  // Box 4: Tombol Temuan Baru (+ Biru)
  doc.setFillColor(245, 243, 255); // purple-50
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(18, y, 174, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(91, 33, 182); // purple-900
  doc.text("D. TOMBOL '+ TEMUAN BARU' (TAMBAH PEMILIH BARU)", 22, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("• Kapan Digunakan   : Jika menemukan warga Kalisalak yang memenuhi syarat hak pilih namun namanya BELUM", 22, y + 10.5);
  doc.text("                       TERCANTUM di dalam data Calon DPS (contoh: pemilih pemula genap 17 tahun / mutasi masuk).", 22, y + 15);
  doc.text("• Efek Pada Sistem  : Isi form digital (NIK, No KK, Nama, TTL, JK, RT, RW). Pemilih langsung masuk ke", 22, y + 19.5);
  doc.text("                       basis data RW penugasan Anda dan otomatis dialokasikan ke Tabung Pemilihan terkait.", 22, y + 24);

  renderFooter(doc, 2, totalPages);

  // ==================== HALAMAN 3: MODAL TMS & SCAN KAMERA BELAKANG ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 4. ENAM (6) KATEGORI RESMI TMS DI SISTEM DATABASE", 18, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const pTms =
    "Petugas wajib memilih alasan TMS yang benar dari 6 kategori baku sistem disertai bukti pendukung faktual:";
  doc.text(doc.splitTextToSize(pTms, 174), 18, y);
  y += 9;

  const tmsList = [
    { no: "1", kode: "MENINGGAL", nama: "Meninggal Dunia", bukti: "Surat Kematian Desa / Surat RS / Konfirmasi Ahli Waris" },
    { no: "2", kode: "GANDA", nama: "Data Pemilih Ganda", bukti: "NIK atau Nama identik terdata lebih dari 1 kali di database" },
    { no: "3", kode: "PINDAH_DOMISILI", nama: "Pindah Keluar Desa", bukti: "Telah diterbitkan SKPWNI / KK & KTP baru di luar desa" },
    { no: "4", kode: "DI_BAWAH_UMUR", nama: "Di Bawah Umur", bukti: "Belum genap 17 tahun pada 3 Februari 2027 & belum kawin" },
    { no: "5", kode: "TNI_POLRI", nama: "Anggota TNI / POLRI", bukti: "Telah diangkat menjadi prajurit TNI atau anggota Kepolisian" },
    { no: "6", kode: "BUKAN_WARGA", nama: "Bukan Warga Kalisalak", bukti: "Tinggal fisik di desa namun administrasi KTP luar wilayah" },
  ];

  tmsList.forEach((t) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(18, y, 174, 11, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(190, 18, 60);
    doc.text(`${t.no}. ${t.nama} [${t.kode}]`, 22, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bukti Pendukung: ${t.bukti}`, 22, y + 8.5);

    y += 13;
  });

  y += 4;

  // Bab 5: Fitur Camera Belakang Langsung
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 5. OPERASIONAL MENU 3: INSTANT REAR CAMERA & DOKUMEN", 18, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const pScan =
    "Menu ke-3 (Camera) di bilah bawah langsung mengaktifkan kamera belakang HP tanpa upload manual:";
  doc.text(doc.splitTextToSize(pScan, 174), 18, y);
  y += 9;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(18, y, 174, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text("PANDUAN PEMANFAATAN KAMERA BELAKANG:", 22, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Sentuh tombol 'Camera' di tengah bilah navigasi bawah smartphone Anda.", 22, y + 10.5);
  doc.text("2. Beri izin 'Izinkan / Allow' akses kamera pada browser Chrome/Safari Anda.", 22, y + 15);
  doc.text("3. Scan Stiker/QR Code: Arahkan ke QR Code stiker pemilih untuk membuka data tanpa ketik NIK.", 22, y + 19.5);
  doc.text("4. Foto Bukti Fisik: Bidik KTP/KK pemilih baru atau surat keterangan TMS dengan pencahayaan cukup.", 22, y + 24);

  renderFooter(doc, 3, totalPages);

  // ==================== HALAMAN 4: GRID 4 TAHAPAN & PEMETAAN TABUNG ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 6. RUNTUTAN 5 TAHAPAN & GRID DATA CALON DPS", 18, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const pKpi =
    "Pada Menu 2 (Calon DPS), terdapat Grid 4 Kartu Tahapan Pemutakhiran berjenjang yang menjadi pedoman resmi:";
  doc.text(doc.splitTextToSize(pKpi, 174), 18, y);
  y += 9;

  const kpiItems = [
    { label: "1. CALON DPS", status: "Aktif Saat Ini", makna: "Seluruh 7.787 pemilih aktif yang saat ini Anda bawa dan verifikasi door-to-door." },
    { label: "2. DPS", status: "Uji Publik", makna: "Hasil rekapitulasi setelah pleno pemutakhiran Calon DPS untuk diumumkan ke publik." },
    { label: "3. DPSHP", status: "Perbaikan", makna: "Pemutakhiran berkala atas masukan warga, koreksi data, dan pencoretan pemilih TMS." },
    { label: "4. DPSHP Akhir", status: "Validasi Final", makna: "Rekapitulasi akhir sebelum penetapan Daftar Pemilih Tetap (DPT) resmi." },
    { label: "5. DPT Final", status: "Kunci Digital", makna: "Penetapan pleno resmi DPT oleh P2KD yang dikunci secara permanen (Digital Lock)." },
  ];

  kpiItems.forEach((k) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(18, y, 174, 9, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`${k.label} [${k.status}]`, 22, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`: ${k.makna}`, 68, y + 5.5);
    y += 11;
  });

  y += 3;

  // Bab 7: Pemetaan 13 Tabung
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 7. PEMETAAN 13 WILAYAH RW & 13 TABUNG LAPANGAN KALISALAK", 18, y);
  y += 5.5;

  // Tabel Wilayah
  doc.setFillColor(30, 58, 138);
  doc.rect(18, y, 174, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TABUNG PEMILIHAN", 22, y + 4.2);
  doc.text("WILAYAH RW PENUGASAN", 80, y + 4.2);
  doc.text("CAKUPAN LINGKUNGAN RT", 140, y + 4.2);

  y += 6;

  const tpsTable = [
    { tps: "Tabung 01", rw: "Wilayah RW 01", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 02", rw: "Wilayah RW 02", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 03", rw: "Wilayah RW 03", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 04", rw: "Wilayah RW 04", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 05", rw: "Wilayah RW 05", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 06", rw: "Wilayah RW 06", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 07", rw: "Wilayah RW 07", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 08", rw: "Wilayah RW 08", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 09", rw: "Wilayah RW 09", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 10", rw: "Wilayah RW 10", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 11", rw: "Wilayah RW 11", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 12", rw: "Wilayah RW 12", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 13", rw: "Wilayah RW 13", rt: "RT 01, RT 02, RT 03" },
  ];

  tpsTable.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(18, y, 174, 5, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(row.tps, 22, y + 3.8);
    doc.text(row.rw, 80, y + 3.8);
    doc.text(row.rt, 140, y + 3.8);
    y += 5;
  });

  renderFooter(doc, 4, totalPages);

  // ==================== HALAMAN 5: MANAJEMEN AKUN, KENDALA & PENGESAHAN ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 8. MANAJEMEN MENU AKUN & PEMECAHAN KENDALA LAPANGAN", 18, y);
  y += 5.5;

  const faqs = [
    {
      q: "1. Apa saja yang dapat dilakukan di Menu Akun?",
      a: "Memeriksa identitas digital penugasan RW/RT, mengganti foto profil berseragam (dikompresi otomatis oleh sistem), mengganti password akun mandiri dari password bawaan p2kd2026, memeriksa informasi sesi keamanan perangkat, dan melakukan logout aman.",
    },
    {
      q: "2. Bagaimana jika sinyal internet lemah atau mati di lokasi rumah warga?",
      a: "Aplikasi PWA tetap menyimpan daftar pemilih Calon DPS RW Anda di memori HP. Anda tetap dapat memeriksa fisik KTP/KK warga dan mencatatnya. Begitu kembali mendapat sinyal internet, buka aplikasi dan klik tombol 'Sesuai' atau 'Ubah Data'.",
    },
    {
      q: "3. Bagaimana jika saya salah menekan tombol Sesuai padahal pemilih sudah meninggal?",
      a: "Gunakan tombol 'Reset / Batal' (ikon putar balik) pada kartu pemilih tersebut untuk mengembalikan status ke 'Belum Pemutakhiran', lalu pilih tombol 'TMS' dengan alasan Meninggal Dunia.",
    },
    {
      q: "4. Apakah warga yang merantau ke luar kota harus di-TMS-kan?",
      a: "TIDAK BOLEH. Selama warga tersebut masih ber-KTP/KK Desa Kalisalak dan belum membuat surat pindah resmi (SKPWNI), hak pilihnya sah. Konfirmasi data dengan anggota keluarga di rumah dan tandai 'SESUAI'.",
    },
  ];

  faqs.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text(item.q, 18, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const splitA = doc.splitTextToSize(item.a, 174);
    doc.text(splitA, 18, y);
    y += splitA.length * 3.5 + 3;
  });

  y += 6;

  // Box Pengesahan
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(18, y, 174, 42, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Ditetapkan di : Kalisalak, Margasari", 24, y + 6.5);
  doc.text("Pada tanggal  : 28 September 2026", 24, y + 11);
  doc.text("PANITIA PEMILIHAN KEPALA DESA (P2KD) KALISALAK", 24, y + 16.5);

  doc.setFont("helvetica", "bold");
  doc.text("Ketua P2KD Desa Kalisalak", 24, y + 22);
  doc.text("Koordinator Seksi Pendaftaran Pemilih", 115, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("KHASANUDIN, S.Pd.SD", 24, y + 36.5);
  doc.text("M. LU’LU KHULALUDIN, S.F.U", 115, y + 36.5);

  renderFooter(doc, 5, totalPages);

  return doc;
}

/**
 * Generate Lembar Saku Singkat (2 Halaman Ringkas Pemutakhiran Mobile)
 */
export function generateLembarSakuPdf(): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalPages = 2;

  // Halaman 1
  let y = renderKop(doc);

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(18, y, 174, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("LEMBAR SAKU CEPAT: OPERASIONAL APLIKASI NATIVE PETUGAS P2KD", 105, y + 9, { align: "center" });

  y += 19;

  // Runtutan 5 Tahapan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text("RUNTUTAN RESMI: CALON DPS -> DPS -> DPSHP -> DPSHP AKHIR -> DPT", 18, y);
  y += 5.5;

  const steps = [
    {
      step: "LANGKAH 1: BUKA APLIKASI & CEK MENU 1 (PEMUTAKHIRAN)",
      detail: "Buka aplikasi PWA/APK di HP Anda. Pilih menu 'Pemutakhiran' di kiri bawah. Gunakan filter RT atau ketik nama/NIK warga yang sedang Anda kunjungi.",
    },
    {
      step: "LANGKAH 2: COCOKKAN FISIK KTP-EL / KK ASLI DENGAN DATA CALON DPS",
      detail: "Periksa fisik dokumen warga (Nama lengkap, NIK 16 digit, tempat/tanggal lahir, alamat RT/RW, dan status disabilitas jika ada).",
    },
    {
      step: "LANGKAH 3: SENTUH TOMBOL AKSI 1-TAP",
      detail: "• Tombol HIJAU (Sesuai) -> Jika data sudah pas 100%.\n• Tombol BIRU (Ubah Data) -> Jika ada perbaikan nama/tgl lahir/RT/disabilitas.\n• Tombol MERAH (TMS) -> Jika warga meninggal, pindah, atau ganda.\n• Tombol '+ Temuan Baru' -> Jika ada warga baru 17 thn belum terdaftar.",
    },
  ];

  steps.forEach((s) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(18, y, 174, 21, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(s.step, 22, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitD = doc.splitTextToSize(s.detail, 166);
    doc.text(splitD, 22, y + 10.5);

    y += 24;
  });

  // Anatomi 5 Menu Bawah Ringkas
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("FUNGSI 5 MENU DI BILAH BAWAH SMARTPHONE:", 18, y);
  y += 5.5;

  const bottomMenus = [
    "1. Pemutakhiran : Lembar kerja door-to-door, filter RT, 4 tombol aksi verifikasi.",
    "2. Calon DPS    : Grid 4 Tahapan (Calon DPS, DPS, DPSHP, DPSHP Akhir) & tabel pemilih.",
    "3. Camera       : Kamera belakang menyala langsung untuk scan stiker & foto bukti.",
    "4. DPT          : Rangkuman penetapan DPT resmi dan nomor Tabung Pemilihan 1-13.",
    "5. Akun         : Profil petugas, ganti foto seragam, ganti password mandiri, dan logout.",
  ];

  bottomMenus.forEach((bm) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(bm, 22, y);
    y += 5;
  });

  renderFooter(doc, 1, totalPages);

  // Halaman 2
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("PANDUAN 6 ALASAN TMS & HELPDESK RESMI P2KD", 18, y);
  y += 6.5;

  const tmsSimple = [
    { kode: "1. MENINGGAL", detail: "Warga telah meninggal dunia (bukti surat kematian desa / konfirmasi RT)." },
    { kode: "2. GANDA", detail: "Warga tercatat 2 kali di database pemilih Calon DPS." },
    { kode: "3. PINDAH_DOMISILI", detail: "Warga telah resmi menerbitkan SKPWNI / KK & KTP baru luar desa." },
    { kode: "4. DI_BAWAH_UMUR", detail: "Belum berusia 17 tahun pada 3 Februari 2027 dan belum menikah." },
    { kode: "5. TNI / POLRI", detail: "Menjadi prajurit aktif TNI atau anggota Kepolisian Negara RI." },
    { kode: "6. BUKAN_WARGA", detail: "Tinggal di Kalisalak tetapi secara administrasi ber-KTP luar wilayah." },
  ];

  tmsSimple.forEach((t) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(190, 18, 60);
    doc.text(t.kode, 22, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`: ${t.detail}`, 58, y);
    y += 6;
  });

  y += 12;

  // Box Kontak Darurat
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(18, y, 174, 38, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text("KONTAK BANTUAN TEKNIS & HELPDESK P2KD:", 24, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("• Helpdesk WhatsApp P2KD : +62 878-3018-8452 (Siap mendampingi kendala teknis lapangan)", 24, y + 14);
  doc.text("• Portal Aplikasi Lapangan: https://www.p2kdkalisalak.my.id/admin", 24, y + 19);
  doc.text("• Sekretariat P2KD       : Gedung Balai Desa Kalisalak, Jl. K. Abdul Latief, Margasari", 24, y + 24);
  doc.text("• Koordinator Seksi       : M. Lu’lu Khulaludin, S.F.U (Seksi Pendaftaran Pemilih)", 24, y + 29);

  renderFooter(doc, 2, totalPages);

  return doc;
}

/**
 * Trigger download PDF di browser klien
 */
export function downloadBimtekPdf(tipe: "lengkap" | "lembar-saku" = "lengkap") {
  const doc = tipe === "lengkap" ? generateMateriBimtekPdf() : generateLembarSakuPdf();
  const filename =
    tipe === "lengkap"
      ? "Panduan_Sistem_Petugas_Pilkades_Kalisalak_2026_2027.pdf"
      : "Lembar_Saku_Pemutakhiran_Kalisalak_2026_2027.pdf";
  doc.save(filename);
}
