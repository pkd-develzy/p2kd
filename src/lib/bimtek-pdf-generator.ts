import { jsPDF } from "jspdf";

/**
 * bimtek-pdf-generator.ts
 * Generator Dokumen PDF Resmi: Bimbingan Teknis (Bimtek)
 * Buku Panduan Operasional Sistem Digital DPS/DPT & Aplikasi Coklit Lapangan
 * Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak 2026/2027
 */

const KOP_INSTANSI_1 = "PANITIA PEMILIHAN KEPALA DESA (P2KD)";
const KOP_INSTANSI_2 = "DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL";
const KOP_ALAMAT = "Sekretariat: Gedung Balai Desa Kalisalak, Jl. Raya Margasari – Kalisalak No. 01 Margasari 52463";
const KOP_KONTAK = "Portal Aplikasi: www.p2kdkalisalak.my.id | Helpdesk WA: 0858-7958-4257";

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
    "Buku Panduan Sistem Digital Coklit • P2KD Desa Kalisalak 2026/2027 • Dokumen Kerja Resmi",
    18,
    288
  );
  doc.text(`Halaman ${pageNum} dari ${totalPages}`, 192, 288, { align: "right" });
}

/**
 * Generate Dokumen Lengkap: Buku Panduan Operasional Sistem Coklit Digital P2KD (5 Halaman)
 */
export function generateMateriBimtekPdf(): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalPages = 5;

  // ==================== HALAMAN 1: PENGENALAN SISTEM & LOGIN ====================
  let y = renderKop(doc);

  // Judul Dokumen
  doc.setFillColor(30, 58, 138); // blue-900
  doc.roundedRect(18, y, 174, 22, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(255, 255, 255);
  doc.text("PANDUAN OPERASIONAL SISTEM DIGITAL DPS / DPT", 105, y + 8, { align: "center" });
  doc.setFontSize(9.5);
  doc.text("APLIKASI LAPANGAN COKLIT KOORDINATOR RW & PANTARLIH", 105, y + 15, { align: "center" });

  y += 28;

  // Mengapa Sistem Ini Dibuat?
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(18, y, 174, 25, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text("FUNGSI & KEUNGGULAN SISTEM DIGITAL BAGI PETUGAS:", 22, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("1. Menghilangkan Berkas Kertas Manual: Petugas tidak perlu lagi membawa tumpukan map Model A tebal.", 22, y + 11);
  doc.text("2. Verifikasi 1-Sentuhan (1-Tap): Cukup tekan tombol 'Sesuai' di HP, data langsung sah dan tercatat di server.", 22, y + 15.5);
  doc.text("3. Rekap Otomatis Real-Time: Persentase capaian per RW terhitung otomatis detik per detik tanpa kalkulator.", 22, y + 20);

  y += 30;

  // Bab 1: Akses & Kredensial Akun
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 1. AKSES & KREDENSIAL AKUN PETUGAS LAPANGAN", 18, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const p1 =
    "Seluruh Petugas Pemutakhiran Data Pemilih (Pantarlih) yang telah ditetapkan resmi mendapatkan akun sistem operasional berbasis web mobile. Sistem dapat dibuka langsung dari browser smartphone (Google Chrome atau Safari) tanpa perlu mengunduh aplikasi tambahan dari Play Store.";
  doc.text(doc.splitTextToSize(p1, 174), 18, y);
  y += 14;

  // Tabel Kredensial
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(18, y, 174, 38, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("LANGKAH LOGIN KE SISTEM:", 22, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("• Alamat URL Portal   : https://www.p2kdkalisalak.my.id/admin", 22, y + 12);
  doc.text("• Username Petugas   : Nama akhir pendaftar (huruf kecil, tanpa spasi/simbol)", 22, y + 17);
  doc.text("  Contoh: MAR'UFAH -> marufah | LINDA FARIDA -> farida | YANI YUSWANTI -> yuswanti", 25, y + 21);
  doc.text("• Password Default    : p2kd2026 (Wajib lakukan penggantian sandi pada login perdana)", 22, y + 26);
  doc.text("• Penguncian Wilayah : Sistem otomatis mengunci daftar pemilih HANYA untuk RW penugasan Anda.", 22, y + 31);
  doc.text("  (Contoh: Petugas RW 03 hanya akan melihat & memproses data warga RW 03).", 25, y + 35);

  y += 44;

  // Bab 2: Tampilan Aplikasi Lapangan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 2. NAVIGASI APLIKASI LAPANGAN PANTARLIH (MOBILE BOTTOM NAV)", 18, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const p2 =
    "Setelah login, layar smartphone Anda akan langsung menampilkan antarmuka 'Aplikasi Lapangan Koordinator RW' dengan bilah menu bawah (Bottom Navigation Bar) yang terdiri dari 5 menu utama:";
  doc.text(doc.splitTextToSize(p2, 174), 18, y);
  y += 12;

  const menuItems = [
    { name: "1. Coklit RW (Tab Utama)", desc: "Lembar kerja door-to-door. Tempat memeriksa data warga, mencocokkan fisik, & memberi status." },
    { name: "2. DPS RW", desc: "Daftar Pemilih Sementara lengkap se-RW penugasan untuk pencarian cepat nama/NIK warga." },
    { name: "3. Scan Stiker (Tombol Tengah)", desc: "Tombol hijau kamera melayang untuk scan barcode/QR Code bukti pemilih secara kilat." },
    { name: "4. DPT Sah", desc: "Daftar pemilih yang telah tervalidasi dan siap ditetapkan menjadi DPT final tingkat desa." },
    { name: "5. Rekap RW", desc: "Rangkuman angka statistik hasil coklit per RT dan ekspor data laporan wilayah penugasan." },
  ];

  menuItems.forEach((m) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(m.name, 22, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`: ${m.desc}`, 72, y);
    y += 5.5;
  });

  renderFooter(doc, 1, totalPages);

  // ==================== HALAMAN 2: SOP 4 AKSI TOMBOL COKLIT ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 3. PANDUAN PRAKTIK LAPANGAN: 4 TOMBOL AKSI COKLIT", 18, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pAksi =
    "Saat Anda berdiri di depan rumah warga dan memeriksa dokumen KTP-el / Kartu Keluarga fisik warga, cari nama warga di Tab Coklit RW. Setiap kartu pemilih memiliki tombol aksi cepat. Berikut pedoman penggunaannya:";
  doc.text(doc.splitTextToSize(pAksi, 174), 18, y);
  y += 12;

  // Box 1: Tombol Sesuai (Hijau)
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(18, y, 174, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text("A. TOMBOL 'SESUAI' (HIJAU 1-TAP VERIFIKASI)", 22, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("• Kapan Digunakan   : Jika SELURUH data (Nama, NIK, Tgl Lahir, JK, Alamat RT/RW) pada KTP/KK warga", 22, y + 11.5);
  doc.text("                       sudah 100% cocok dengan data yang tertera pada layar sistem.", 22, y + 15.5);
  doc.text("• Efek Pada Sistem  : Cukup klik satu kali. Badge berubah 'SESUAI ✓', nama Anda otomatis tersimpan", 22, y + 20);
  doc.text("                       sebagai petugas pemverifikasi, dan stempel jam/tanggal tercatat di server.", 22, y + 24.5);

  y += 34;

  // Box 2: Tombol Ubah Data (Biru)
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(18, y, 174, 33, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text("B. TOMBOL 'UBAH DATA' (KOREKSI ELEMEN DATA)", 22, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("• Kapan Digunakan   : Jika terdapat kesalahan eja nama, NIK kurang tepat, tanggal lahir keliru, status", 22, y + 11.5);
  doc.text("                       perkawinan berubah (Belum Kawin -> Kawin), atau perbaikan nomor RT/RW.", 22, y + 15.5);
  doc.text("• Efek Pada Sistem  : Membuka formulir edit data. Perbaiki kolom yang salah, lalu klik 'Simpan Perubahan'.", 22, y + 20);
  doc.text("                       Sistem cerdas akan mengupdate data dan status berubah menjadi 'DIPERBAIKI'.", 22, y + 24.5);
  doc.text("                       Wilayah tabung/TPS akan diselaraskan otomatis oleh sistem Kalisalak-Wilayah.", 22, y + 29);

  y += 37;

  // Box 3: Tombol TMS (Merah)
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(18, y, 174, 35, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(159, 18, 57); // rose-900
  doc.text("C. TOMBOL 'TMS' (TIDAK MEMENUHI SYARAT)", 22, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("• Kapan Digunakan   : Jika warga terdaftar sudah tidak berhak memilih (Meninggal, Pindah, Ganda, dll).", 22, y + 11.5);
  doc.text("• Efek Pada Sistem  : Muncul dialog pilihan alasan resmi sistem. Pilih salah satu dari 6 kategori TMS,", 22, y + 16);
  doc.text("                       masukkan nomor surat kematian/pindah pada kolom catatan pendukung, lalu simpan.", 22, y + 20.5);
  doc.text("                       Pemilih ditandai merah 'TMS' dan otomatis dikeluarkan dari penetapan DPT bersih.", 22, y + 25);
  doc.text("                       Data tidak terhapus permanen dari audit trail untuk bukti transparansi.", 22, y + 29.5);

  y += 39;

  // Box 4: Tombol Temuan Baru (+ Biru)
  doc.setFillColor(245, 243, 255); // purple-50
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(18, y, 174, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(91, 33, 182); // purple-900
  doc.text("D. TOMBOL '+ TEMUAN BARU' (TAMBAH PEMILIH BARU)", 22, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("• Kapan Digunakan   : Jika menjumpai warga Kalisalak yang sah memenuhi syarat hak pilih namun namanya", 22, y + 11.5);
  doc.text("                       BELUM TERCANTUM di dalam daftar DPS sistem (contoh: genap 17 tahun, pindah masuk).", 22, y + 15.5);
  doc.text("• Efek Pada Sistem  : Klik tombol '+ Temuan Baru' di kanan atas layar, isi formulir (NIK, No KK, Nama,", 22, y + 20);
  doc.text("                       TTL, JK, RT, RW). Pemilih seketika bertambah ke basis data RW bersangkutan.", 22, y + 24.5);

  renderFooter(doc, 2, totalPages);

  // ==================== HALAMAN 3: MODAL TMS & SCAN KAMERA QR ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 4. ENAM (6) KATEGORI RESMI TMS DI SISTEM DATABASE", 18, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pTms =
    "Sistem P2KD Kalisalak telah mengunci 6 alasan standar TMS saat petugas menekan tombol merah. Petugas wajib memilih alasan yang benar disertai catatan pendukung faktual:";
  doc.text(doc.splitTextToSize(pTms, 174), 18, y);
  y += 10;

  const tmsList = [
    { no: "1", kode: "MENINGGAL", nama: "Meninggal Dunia", bukti: "Surat Kematian Desa / Surat RS / Konfirmasi Ahli Waris" },
    { no: "2", kode: "GANDA", nama: "Data Pemilih Ganda", bukti: "NIK atau Nama identik terdata lebih dari 1 kali di database" },
    { no: "3", kode: "PINDAH_DOMISILI", nama: "Pindah Keluar Desa", bukti: "Telah diterbitkan SKPWNI / KK & KTP baru di luar desa" },
    { no: "4", kode: "DI_BAWAH_UMUR", nama: "Di Bawah Umur", bukti: "Belum genap 17 tahun pada hari pemilihan & belum menikah" },
    { no: "5", kode: "TNI_POLRI", nama: "Anggota TNI / POLRI", bukti: "Telah diangkat menjadi prajurit TNI atau anggota Kepolisian" },
    { no: "6", kode: "BUKAN_WARGA", nama: "Bukan Warga Kalisalak", bukti: "Tinggal fisik di desa namun administrasi KTP luar wilayah" },
  ];

  tmsList.forEach((t) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(18, y, 174, 12, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(190, 18, 60);
    doc.text(`${t.no}. ${t.nama} [${t.kode}]`, 22, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Keterangan / Bukti Pendukung: ${t.bukti}`, 22, y + 9);

    y += 14.5;
  });

  y += 4;

  // Bab 5: Fitur Scan Kamera QR
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 5. FITUR SCAN KAMERA QR CODE (SCAN STIKER)", 18, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pScan =
    "Untuk mempercepat pencarian data tanpa perlu mengetik manual 16 digit NIK di layar ponsel, sistem dilengkapi fitur pemindai kamera (QR Scanner):";
  doc.text(doc.splitTextToSize(pScan, 174), 18, y);
  y += 10;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(18, y, 174, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(21, 128, 61);
  doc.text("CARA PENGGUNAAN SCANNER KAMERA:", 22, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Tekan tombol bulat hijau dengan ikon kamera di tengah bawah navigasi HP Anda.", 22, y + 11.5);
  doc.text("2. Izinkan browser HP mengakses kamera belakang (tekan 'Allow / Izinkan' jika diminta izin).", 22, y + 16);
  doc.text("3. Arahkan lensa kamera ke QR Code pada dokumen / berkas pemilih.", 22, y + 20.5);
  doc.text("4. Sistem secara seketika mendeteksi pemilih dan membuka detail kartu untuk langsung diverifikasi.", 22, y + 25);

  renderFooter(doc, 3, totalPages);

  // ==================== HALAMAN 4: MONITORING PROGRES & PEMETAAN WILAYAH ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 6. INDIKATOR KPI & MONITORING PROGRES COKLIT REAL-TIME", 18, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pKpi =
    "Di bagian atas Tab Coklit RW, terdapat kartu metrik KPI dan Bar Progres Interaktif yang mencerminkan status verifikasi wilayah Anda detik per detik:";
  doc.text(doc.splitTextToSize(pKpi, 174), 18, y);
  y += 10;

  const kpiItems = [
    { label: "Total DPS", color: "Hitam", makna: "Jumlah total pemilih terdaftar di wilayah RW Anda yang menjadi target kerja." },
    { label: "Belum Coklit", color: "Kuning", makna: "Sisa pemilih yang belum sempat dikunjungi atau belum diverifikasi faktual." },
    { label: "Data Sesuai", color: "Hijau", makna: "Pemilih yang telah diverifikasi dan datanya valid 100% (Tombol Sesuai)." },
    { label: "Diperbaiki", color: "Biru", makna: "Pemilih yang mengalami perbaikan data identitas di lapangan (Tombol Ubah Data)." },
    { label: "TMS / Pindah", color: "Merah", makna: "Pemilih yang disaring keluar karena meninggal, pindah, atau ganda (Tombol TMS)." },
  ];

  kpiItems.forEach((k) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`• [${k.color}] ${k.label}`, 22, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`: ${k.makna}`, 60, y);
    y += 5.5;
  });

  y += 6;

  // Bab 7: Pemetaan 13 Wilayah RW Kalisalak
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 7. PEMETAAN 13 WILAYAH RW & CAKUPAN RT DESA KALISALAK", 18, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pWil =
    "Di Desa Kalisalak, penugasan Coklit Pantarlih berbasis wilayah Rukun Warga (RW). Terdapat 13 RW yang terhubung ke TPS masing-masing secara presisi:";
  doc.text(doc.splitTextToSize(pWil, 174), 18, y);
  y += 10;

  // Tabel Wilayah
  doc.setFillColor(30, 58, 138);
  doc.rect(18, y, 174, 6.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("WILAYAH PENUGASAN", 22, y + 4.5);
  doc.text("CAKUPAN LINGKUNGAN RT", 80, y + 4.5);
  doc.text("PEMETAAN TABUNG / TPS", 140, y + 4.5);

  y += 6.5;

  const tpsTable = [
    { rw: "Wilayah RW 01", rt: "RT 01, RT 02, RT 03", tps: "TPS 01 (Dusun I)" },
    { rw: "Wilayah RW 02", rt: "RT 01, RT 02, RT 03", tps: "TPS 02 (Dusun I)" },
    { rw: "Wilayah RW 03", rt: "RT 01, RT 02, RT 03", tps: "TPS 03 (Dusun I)" },
    { rw: "Wilayah RW 04", rt: "RT 01, RT 02, RT 03", tps: "TPS 04 (Dusun II)" },
    { rw: "Wilayah RW 05", rt: "RT 01, RT 02, RT 03", tps: "TPS 05 (Dusun II)" },
    { rw: "Wilayah RW 06", rt: "RT 01, RT 02, RT 03", tps: "TPS 06 (Dusun II)" },
    { rw: "Wilayah RW 07", rt: "RT 01, RT 02, RT 03", tps: "TPS 07 (Dusun III)" },
    { rw: "Wilayah RW 08", rt: "RT 01, RT 02, RT 03", tps: "TPS 08 (Dusun III)" },
    { rw: "Wilayah RW 09", rt: "RT 01, RT 02, RT 03", tps: "TPS 09 (Dusun III)" },
    { rw: "Wilayah RW 10", rt: "RT 01, RT 02, RT 03", tps: "TPS 10 (Dusun IV)" },
    { rw: "Wilayah RW 11", rt: "RT 01, RT 02, RT 03", tps: "TPS 11 (Dusun IV)" },
    { rw: "Wilayah RW 12", rt: "RT 01, RT 02, RT 03", tps: "TPS 12 (Dusun IV)" },
    { rw: "Wilayah RW 13", rt: "RT 01, RT 02, RT 03", tps: "TPS 13 (Dusun IV)" },
  ];

  tpsTable.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(18, y, 174, 5.5, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(row.rw, 22, y + 4);
    doc.text(row.rt, 80, y + 4);
    doc.text(row.tps, 140, y + 4);
    y += 5.5;
  });

  renderFooter(doc, 4, totalPages);

  // ==================== HALAMAN 5: KENDALA SISTEM & PENGESAHAN ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("BAB 8. PENANGANAN KENDALA TEKNIS LAPANGAN & FAQ", 18, y);
  y += 6;

  const faqs = [
    {
      q: "1. Bagaimana jika sinyal internet di lokasi rumah warga lemah atau mati?",
      a: "Tenang. Buka halaman Tab Coklit RW saat Anda memiliki koneksi. Catat sementara warga yang dikunjungi, lalu saat kembali mendapatkan sinyal internet di jalan utama atau rumah, tekan tombol Sesuai / Ubah Data pada sistem.",
    },
    {
      q: "2. Bagaimana jika saya tidak sengaja salah menekan tombol Sesuai atau TMS?",
      a: "Setiap kartu pemilih yang telah diverifikasi memiliki tombol 'Batal / Reset' (ikon putar balik). Anda dapat mengklik tombol tersebut untuk mengembalikan status ke 'Belum Coklit' lalu memilih status yang benar.",
    },
    {
      q: "3. Bagaimana jika ada warga yang komplain belum terdaftar di website publik?",
      a: "Warga yang komplain lewat fitur '/cekdpt' akan otomatis masuk ke tab 'Aduan Warga' di portal admin. Anda sebagai koordinator RW bersangkutan dapat membuka tab tersebut, mengecek alamatnya, dan langsung mendatangi rumahnya.",
    },
    {
      q: "4. Bagaimana jika saya lupa password atau akun terkunci?",
      a: "Segera hubungi Helpdesk Teknis P2KD Kalisalak (WA: 0858-7958-4257) atau temui Sekretaris / Koordinator Seksi Pendaftaran Pemilih di Sekretariat Balai Desa untuk dilakukan reset password.",
    },
  ];

  faqs.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(item.q, 18, y);
    y += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const splitA = doc.splitTextToSize(item.a, 174);
    doc.text(splitA, 18, y);
    y += splitA.length * 3.8 + 3.5;
  });

  y += 8;

  // Box Pengesahan
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(18, y, 174, 45, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Ditetapkan di : Kalisalak, Margasari", 24, y + 7);
  doc.text("Pada tanggal  : 14 September 2026", 24, y + 12);
  doc.text("PANITIA PEMILIHAN KEPALA DESA (P2KD) KALISALAK", 24, y + 18);

  doc.setFont("helvetica", "bold");
  doc.text("Ketua P2KD Desa Kalisalak", 24, y + 23);
  doc.text("Koordinator Seksi Pendaftaran Pemilih", 115, y + 23);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("KHASANUDIN, S.Pd.SD", 24, y + 39);
  doc.text("M. LU’LU KHULALUDIN, S.F.U", 115, y + 39);

  renderFooter(doc, 5, totalPages);

  return doc;
}

/**
 * Generate Lembar Saku Singkat (2 Halaman Ringkas Coklit Mobile)
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
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("LEMBAR SAKU CEPAT: OPERASIONAL SISTEM COKLIT DI SMARTPHONE", 105, y + 9, { align: "center" });

  y += 20;

  // 3 Langkah Kilat
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text("3 LANGKAH KILAT COKLIT DI DEPAN PINTU WARGA:", 18, y);
  y += 6;

  const steps = [
    {
      step: "LANGKAH 1: BUKA HP & CARI NAMA WARGA",
      detail: "Buka www.p2kdkalisalak.my.id/admin. Masuk dengan username nama akhir Anda. Pada Tab 'Coklit RW', ketik nama atau NIK warga di kotak pencarian.",
    },
    {
      step: "LANGKAH 2: COCOKKAN FISIK KTP / KK DENGAN LAYAR",
      detail: "Minta dokumen KTP-el / Kartu Keluarga asli. Periksa apakah NIK, nama lengkap, tanggal lahir, dan alamat RT/RW sudah sesuai.",
    },
    {
      step: "LANGKAH 3: SENTUH TOMBOL AKSI",
      detail: "• Tombol HIJAU (Sesuai) -> Jika data sudah pas 100%.\n• Tombol BIRU (Ubah Data) -> Jika ada salah ketik nama/tgl lahir/RT.\n• Tombol MERAH (TMS) -> Jika warga meninggal, pindah, atau ganda.\n• Tombol '+ Temuan Baru' -> Jika ada warga baru 17 thn belum terdaftar.",
    },
  ];

  steps.forEach((s) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(18, y, 174, 21, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(s.step, 22, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitD = doc.splitTextToSize(s.detail, 166);
    doc.text(splitD, 22, y + 10.5);

    y += 25;
  });

  renderFooter(doc, 1, totalPages);

  // Halaman 2
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("PANDUAN 6 ALASAN TMS & HELPDESK RESMI P2KD", 18, y);
  y += 7;

  const tmsSimple = [
    { kode: "1. MENINGGAL", detail: "Warga telah meninggal dunia (didukung surat kematian desa/keterangan RT/keluarga)." },
    { kode: "2. GANDA", detail: "Warga tercatat 2 kali di database pemilih desa Kalisalak." },
    { kode: "3. PINDAH_DOMISILI", detail: "Warga telah resmi pindah KK/KTP ke luar wilayah Desa Kalisalak." },
    { kode: "4. DI_BAWAH_UMUR", detail: "Belum berusia 17 tahun saat hari pemungutan suara dan belum kawin." },
    { kode: "5. TNI / POLRI", detail: "Menjadi anggota aktif TNI atau Kepolisian Negara Republik Indonesia." },
    { kode: "6. BUKAN_WARGA", detail: "Tinggal di Kalisalak tapi secara administrasi bukan pemilih sah Desa Kalisalak." },
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

  y += 15;

  // Box Kontak Darurat
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(18, y, 174, 38, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text("KONTAK BANTUAN TEKNIS & HELPDESK P2KD:", 24, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("• Helpdesk WA P2KD    : 0858-7958-4257 (Siap mendampingi kendala teknis lapangan)", 24, y + 14);
  doc.text("• Portal Sistem        : https://www.p2kdkalisalak.my.id/admin", 24, y + 19);
  doc.text("• Sekretariat          : Balai Desa Kalisalak, Jl. Raya Margasari – Kalisalak No. 01", 24, y + 24);
  doc.text("• Koordinator Seksi    : M. Lu’lu Khulaludin, S.F.U (Seksi Pendaftaran Pemilih)", 24, y + 29);

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
      ? "Panduan_Sistem_Digital_Coklit_P2KD_Kalisalak.pdf"
      : "Lembar_Saku_Sistem_Coklit_P2KD_Kalisalak.pdf";
  doc.save(filename);
}
