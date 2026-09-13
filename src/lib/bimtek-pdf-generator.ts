import { jsPDF } from "jspdf";

/**
 * bimtek-pdf-generator.ts
 * Generator Dokumen PDF Resmi Materi Bimbingan Teknis (Bimtek)
 * Petugas Pemutakhiran Data Pemilih (Pantarlih) / Petugas Coklit
 * Pilkades Desa Kalisalak Tahun 2026/2027
 */

const KOP_INSTANSI_1 = "PANITIA PEMILIHAN KEPALA DESA (P2KD)";
const KOP_INSTANSI_2 = "DESA KALISALAK KECAMATAN MARGASARI KABUPATEN TEGAL";
const KOP_ALAMAT = "Sekretariat: Kantor Balai Desa Kalisalak, Jl. Raya Kalisalak No. 01 Margasari 52463";
const KOP_KONTAK = "Portal Resmi: www.p2kdkalisalak.my.id | Email: p2kd@kalisalak.desa.id";

function renderKop(doc: jsPDF): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(KOP_INSTANSI_1, 105, 16, { align: "center" });

  doc.setFontSize(10.5);
  doc.text(KOP_INSTANSI_2, 105, 21.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(KOP_ALAMAT, 105, 26.5, { align: "center" });
  doc.text(KOP_KONTAK, 105, 30.5, { align: "center" });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(18, 33, 192, 33);
  doc.setLineWidth(0.2);
  doc.line(18, 34.2, 192, 34.2);

  return 40;
}

function renderFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Buku Panduan Bimtek Pantarlih • Pilkades Kalisalak 2026/2027 • Dokumen Resmi P2KD",
    18,
    288
  );
  doc.text(`Halaman ${pageNum} dari ${totalPages}`, 192, 288, { align: "right" });
}

/**
 * Generate Dokumen Lengkap Materi Bimtek Pantarlih (Multi-page PDF)
 */
export function generateMateriBimtekPdf(): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalPages = 5;

  // ==================== HALAMAN 1: COVER & PENDAHULUAN ====================
  let y = renderKop(doc);

  // Judul Dokumen
  doc.setFillColor(30, 58, 138); // blue-900
  doc.roundedRect(18, y, 174, 22, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("MODUL RESMI BIMBINGAN TEKNIS (BIMTEK)", 105, y + 8, { align: "center" });
  doc.setFontSize(10);
  doc.text("PETUGAS PEMUTAKHIRAN DATA PEMILIH (PANTARLIH / COKLIT)", 105, y + 15, { align: "center" });

  y += 28;

  // Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(18, y, 174, 24, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("INFORMASI KEGIATAN BIMTEK:", 22, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("• Sasaran Peserta : Petugas Pantarlih Terpilih 13 Wilayah RW Desa Kalisalak", 22, y + 11);
  doc.text("• Penyelenggara    : Seksi Pendaftaran Pemilih Panitia Pilkades (P2KD) 2026/2027", 22, y + 16);
  doc.text("• Wilayah Kerja     : 13 Rukun Warga (RW 01 s/d RW 13) dan 39 Rukun Tetangga (RT)", 22, y + 21);

  y += 30;

  // Modul 1: Landasan Hukum & Integritas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("MODUL 1: LANDASAN HUKUM, TUGAS POKOK, & KODE ETIK", 18, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const modul1Points = [
    "1. Landasan Regulasi: Peraturan Daerah & Perbup Tegal tentang Pedoman Pencalonan, Pemilihan, Pengangkatan, dan Pemberhentian Kepala Desa, serta Keputusan BPD Desa Kalisalak tentang Penetapan Panitia P2KD.",
    "2. Tugas Pokok Pantarlih Lapangan:",
    "    a. Membantu P2KD melakukan pemutakhiran dan validasi data pemilih secara door-to-door.",
    "    b. Mencocokkan data pada Model A-Daftar Pemilih dengan KTP-el / Kartu Keluarga warga.",
    "    c. Mencatat pemilih yang memenuhi syarat (MS), Tidak Memenuhi Syarat (TMS), dan ubah elemen data.",
    "    d. Memberikan Tanda Bukti Pendaftaran Pemilih dan menempelkan Stiker Coklit di setiap rumah.",
    "    e. Berkoordinasi dengan Ketua RT/RW setempat dalam penyisiran warga di wilayah tugasnya.",
    "3. Kode Etik & Pakta Integritas (Wajib Netral):",
    "    • Pantarlih dilarang menjadi tim sukses/relawan calon Kades dan tidak memihak kepada siapapun.",
    "    • Pantarlih dilarang menerima imbalan, hadiah, atau fasilitas dari pihak calon Kades.",
    "    • Pantarlih wajib menjaga kerahasiaan NIK dan No. KK warga sesuai ketentuan UU Perlindungan Data Pribadi.",
  ];

  modul1Points.forEach((pt) => {
    const lines = doc.splitTextToSize(pt, 174);
    doc.text(lines, 18, y);
    y += lines.length * 4.2;
  });

  renderFooter(doc, 1, totalPages);

  // ==================== HALAMAN 2: MEKANISME COKLIT ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("MODUL 2: TATA CARA PENCOCOKAN DAN PENELITIAN (COKLIT)", 18, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const modul2Steps = [
    "Langkah Kerja Pantarlih saat Berkunjung ke Rumah Pemilih:",
    "1. Sapa & Perkenalkan Diri: Kenakan rompi/tanda pengenal resmi P2KD, ucapkan salam dengan sopan, jelaskan maksud kedatangan untuk pencocokan data pemilih Pilkades Kalisalak 2026/2027.",
    "2. Minta Menunjukkan Dokumen Resmi: Mohon izin memeriksa fisik KTP-el dan Kartu Keluarga (KK) asli atau salinan.",
    "3. Cocokkan Data Pemilih per Anggota Keluarga:",
    "    • Jika Data Sesuai: Beri tanda centang pada daftar pemilih (Status: SESUAI).",
    "    • Jika Ada Perubahan Data: Catat perbaikan elemen (Nama, Tanggal Lahir, Status Kawin, Alamat RT/RW).",
    "    • Jika Pemilih Baru: Warga yang genap 17 tahun pada hari pemungutan suara atau baru pindah domisili ke Kalisalak dan ber-KTP Kalisalak, masukkan sebagai PEMILIH BARU.",
    "    • Jika Pemilih TMS (Tidak Memenuhi Syarat): Beri kode keterangan TMS yang valid:",
    "        - Kode 1: Meninggal dunia (pastikan ada konfirmasi RT / Surat Kematian).",
    "        - Kode 2: Ganda (terdaftar lebih dari satu kali di DPS).",
    "        - Kode 3: Di bawah umur & belum pernah menikah.",
    "        - Kode 4: Pindah domisili keluar Desa Kalisalak secara sah.",
    "        - Kode 5: Menjadi anggota aktif TNI / Polri.",
    "        - Kode 6: Bukan warga Desa Kalisalak (tidak memiliki KTP/KK Kalisalak).",
  ];

  modul2Steps.forEach((st) => {
    const lines = doc.splitTextToSize(st, 174);
    doc.text(lines, 18, y);
    y += lines.length * 4.2;
  });

  y += 4;

  // Box Penting
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(18, y, 174, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text("PRINSIP UTAMA COKLIT LAPANGAN:", 22, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text("• Komprehensif: Tidak boleh ada warga berhak pilih yang terlewatkan.", 22, y + 9);
  doc.text("• Faktual: Wajib menemui pemilih langsung di tempat tinggal domisili (door-to-door).", 22, y + 13);
  doc.text("• Akuntabel: Setiap coretan perubahan harus didukung bukti dokumen kependudukan sah.", 22, y + 17);

  renderFooter(doc, 2, totalPages);

  // ==================== HALAMAN 3: STIKER COKLIT & TANDA BUKTI ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("MODUL 3: PENEMPELAN STIKER & TANDA BUKTI PEMILIH", 18, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const modul3Points = [
    "A. Tata Cara Pengisian Stiker Coklit:",
    "   1. Tuliskan nomor RW dan nomor TPS tempat pemilih terdaftar.",
    "   2. Tuliskan nama Kepala Keluarga dan alamat lengkap (No. Rumah / RT / RW).",
    "   3. Tuliskan jumlah pemilih yang terdaftar di dalam keluarga tersebut (Laki-laki, Perempuan, dan Total).",
    "   4. Tuliskan nama seluruh anggota keluarga yang berhak memilih.",
    "   5. Bubuhkan tanda tangan Kepala Keluarga / Perwakilan Keluarga dan tanda tangan Pantarlih.",
    "   6. Tuliskan tanggal pelaksanaan coklit.",
    "",
    "B. Tata Cara Penempelan Stiker di Rumah:",
    "   1. Mintalah izin kepada pemilik rumah untuk menempelkan stiker coklit.",
    "   2. Tempelkan stiker di tempat yang mudah terlihat dari luar (misal: daun pintu utama atau jendela depan).",
    "   3. Pastikan permukaan bersih dan kering sebelum ditempel agar tidak mudah terlepas.",
    "   4. Untuk rumah yang dihuni lebih dari 1 (satu) Kepala Keluarga, tempelkan stiker untuk masing-masing KK.",
    "",
    "C. Penyerahan Tanda Bukti Pendaftaran Pemilih:",
    "   • Lembar Tanda Bukti wajib diserahkan kepada Kepala Keluarga sebagai bukti sah bahwa keluarganya telah dicoklit.",
    "   • Simpan lembar arsip pantarlih untuk direkapitulasi mingguan ke Koordinator Seksi Pendaftaran Pemilih.",
  ];

  modul3Points.forEach((pt) => {
    if (pt === "") {
      y += 2;
      return;
    }
    const lines = doc.splitTextToSize(pt, 174);
    doc.text(lines, 18, y);
    y += lines.length * 4.1;
  });

  renderFooter(doc, 3, totalPages);

  // ==================== HALAMAN 4: PEMETAAN TPS & APLIKASI ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("MODUL 4: PEMETAAN 13 RW & TABUNG TPS DESA KALISALAK", 18, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Di Desa Kalisalak, terdapat 13 TPS yang masing-masing melayani 13 RW secara presisi (1-to-1 mapping):",
    18,
    y
  );
  y += 5;

  // Table TPS
  const tableData = [
    ["TPS 01", "RW 01 (RT 01, RT 02, RT 03)", "Dusun Krajan", "Balai Desa Kalisalak"],
    ["TPS 02", "RW 02 (RT 01, RT 02, RT 03)", "Dusun Kalisalak Tengah", "Halaman Rumah Warga RT 02/02"],
    ["TPS 03", "RW 03 (RT 01, RT 02, RT 03)", "Dusun Karanganyar", "Area Terbuka RW 03"],
    ["TPS 04", "RW 04 (RT 01, RT 02, RT 03)", "Dusun Kalisalak Timur", "Gedung TPQ / Madrasah"],
    ["TPS 05", "RW 05 (RT 01, RT 02, RT 03)", "Dusun Kalisalak Barat", "Halaman Musholla RW 05"],
    ["TPS 06", "RW 06 (RT 01, RT 02, RT 03)", "Dusun Kalisalak Selatan", "Gedung Serbaguna RW 06"],
    ["TPS 07", "RW 07 (RT 01, RT 02, RT 03)", "Dusun Dukuh Anyar", "Halaman Rumah Kadus 07"],
    ["TPS 08", "RW 08 (RT 01, RT 02, RT 03)", "Dusun Kebonromo", "Pos Ronda / Balai Pertemuan RW 08"],
    ["TPS 09", "RW 09 (RT 01, RT 02, RT 03)", "Dusun Lemah Neundeut", "Area Lapangan Voli RW 09"],
    ["TPS 10", "RW 10 (RT 01, RT 02, RT 03)", "Dusun Karangdawa", "Gedung PAUD / Balai RW 10"],
    ["TPS 11", "RW 11 (RT 01, RT 02, RT 03)", "Dusun Kalisalak Permai", "Gedung Pertemuan RW 11"],
    ["TPS 12", "RW 12 (RT 01, RT 02, RT 03)", "Dusun Wadasmalang", "Area Terbuka Pos RW 12"],
    ["TPS 13", "RW 13 (RT 01, RT 02, RT 03)", "Dusun Curugmas", "Balai Dusun Curugmas RW 13"],
  ];

  // Draw Header
  doc.setFillColor(30, 58, 138);
  doc.rect(18, y, 174, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TABUNG TPS", 22, y + 4.2);
  doc.text("WILAYAH RUKUN WARGA (RW)", 48, y + 4.2);
  doc.text("DUSUN / WILAYAH", 108, y + 4.2);
  doc.text("RENCANA LOKASI TPS", 148, y + 4.2);
  y += 6;

  // Draw Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  tableData.forEach((row, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(18, y, 174, 5.2, "F");
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(18, y, 174, 5.2, "S");

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(row[0], 22, y + 3.8);
    doc.setFont("helvetica", "normal");
    doc.text(row[1], 48, y + 3.8);
    doc.text(row[2], 108, y + 3.8);
    doc.text(row[3], 148, y + 3.8);

    y += 5.2;
  });

  y += 5;

  // Modul 5: Login & Penggunaan Aplikasi Portal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text("MODUL 5: PENGGUNAAN PORTAL DIGITAL P2KD KALISALAK", 18, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const portalPoints = [
    "• Alamat Portal Login: https://www.p2kdkalisalak.my.id/admin",
    "• Username Petugas: Dibuat otomatis menggunakan nama akhir Anda (contoh: 'marufah', 'farida', 'yuswanti').",
    "• Password Default: p2kd2026 (Wajib segera diganti saat pertama kali login demi keamanan).",
    "• Fitur Petugas: Pemeriksaan status DPT RW tugas, pencarian nama pemilih instan, input hasil coklit lapangan, dan unduh form rekapitulasi.",
  ];
  portalPoints.forEach((pt) => {
    doc.text(pt, 18, y);
    y += 4;
  });

  renderFooter(doc, 4, totalPages);

  // ==================== HALAMAN 5: FAQ & KASUS KHUSUS ====================
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("MODUL 6: FAQ & PENANGANAN KASUS KHUSUS DI LAPANGAN", 18, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const faqs = [
    {
      q: "1. Bagaimana jika saat dikunjungi rumah dalam keadaan kosong?",
      a: "Tanyakan kepada tetangga atau Ketua RT jadwal warga berada di rumah. Buat janji temu ulang. Jangan langsung mencoret atau menandai selesai sebelum bertemu langsung minimal 3 kali kunjungan.",
    },
    {
      q: "2. Ada warga ber-KTP Desa Kalisalak tetapi bekerja di luar kota/merantau?",
      a: "Selama yang bersangkutan tidak pindah domisili secara administrasi (KTP-el dan KK tetap Desa Kalisalak), data pemilih tetap DILAPORKAN MEMENUHI SYARAT (MS) melalui konfirmasi keluarga serumah.",
    },
    {
      q: "3. Ada pemilih pemula yang saat coklit belum 17 tahun?",
      a: "Periksa tanggal lahir pada KK/Akta. Jika pada HARI-H PEMUNGUTAN SUARA genap berusia 17 tahun atau sudah kawin/pernah kawin, pemilih tersebut WAJIB dimasukkan sebagai PEMILIH BARU.",
    },
    {
      q: "4. Bagaimana bila terdapat anggota TNI/Polri aktif yang pensiun sebelum hari-H?",
      a: "Jika telah memiliki Surat Keputusan Pensiun resmi, statusnya beralih menjadi warga sipil yang berhak memilih dan dimasukkan ke dalam daftar pemilih baru.",
    },
    {
      q: "5. Bagaimana jika ada pemilih disabilitas / lansia?",
      a: "Catat jenis disabilitas pada kolom catatan (disabilitas fisik, netra, rungu, wicara, mental). Data ini sangat penting untuk penyiapan aksesibilitas dan pendampingan di TPS saat pencoblosan.",
    },
  ];

  faqs.forEach((faq) => {
    doc.setFont("helvetica", "bold");
    doc.text(faq.q, 18, y);
    y += 3.8;
    doc.setFont("helvetica", "normal");
    const aLines = doc.splitTextToSize(`Jawaban: ${faq.a}`, 174);
    doc.text(aLines, 18, y);
    y += aLines.length * 3.8 + 2.5;
  });

  y += 5;

  // Tanda Pengesahan P2KD
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Kalisalak, Margasari, Tegal", 140, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("PANITIA PILKADES (P2KD)", 140, y);
  y += 3.5;
  doc.text("Koordinator Seksi Pendaftaran Pemilih,", 140, y);
  y += 18;
  doc.text("M. LU'LU KHULALUDIN, S.F.U", 140, y);
  y += 3.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("NIP/Reg. P2KD-2026-04", 140, y);

  renderFooter(doc, 5, totalPages);

  return doc;
}

/**
 * Generate Dokumen Ringkas: Lembar Saku & Checklist Kerja Pantarlih (2 Halaman)
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

  doc.setFillColor(16, 185, 129); // emerald-600
  doc.roundedRect(18, y, 174, 15, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LEMBAR SAKU & CHECKLIST KELENGKAPAN KERJA PANTARLIH", 105, y + 6.5, { align: "center" });
  doc.setFontSize(8.5);
  doc.text("Pencocokan dan Penelitian (Coklit) Pilkades Kalisalak 2026/2027", 105, y + 11.5, { align: "center" });

  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text("1. PERLENGKAPAN KERJA YANG WAJIB DIBAWA:", 18, y);
  y += 4.5;

  const kitItems = [
    "[ ] Topi & Rompi / Tanda Pengenal Resmi Pantarlih P2KD Kalisalak (Wajib Dikenakan)",
    "[ ] Buku Dokumen Model A-Daftar Pemilih per RT/RW penugasan",
    "[ ] Bundel Stiker Coklit resmi P2KD Kalisalak",
    "[ ] Formulir Tanda Bukti Pendaftaran Pemilih",
    "[ ] Formulir Model A-Daftar Pemilih Baru (Potensial Pemilih)",
    "[ ] Alat Tulis (Bollpoint hitam/biru, map plastik tahan air)",
    "[ ] Smartphone aktif terhubung internet untuk input portal data pemilih",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  kitItems.forEach((item) => {
    doc.text(item, 22, y);
    y += 4.5;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text("2. MATRIX KODESTATUS COKLIT:", 18, y);
  y += 4.5;

  const statusCodes = [
    ["KODE", "STATUS", "ARTI & PENJELASAN TINDAKAN"],
    ["S", "SESUAI", "Seluruh data identitas pemilih sesuai dengan KTP-el / KK asli."],
    ["U", "UBAH DATA", "Terdapat perbaikan elemen: nama, tgl lahir, status kawin, atau RT/RW."],
    ["B", "BARU", "Warga memenuhi syarat (usia 17 / pindah masuk) belum ada di Model A."],
    ["TMS-1", "MENINGGAL", "Pemilih telah meninggal dunia (didukung ket RT / Surat Kematian)."],
    ["TMS-2", "GANDA", "Nama pemilih terdaftar lebih dari satu kali di daftar pemilih."],
    ["TMS-3", "DI BAWAH UMUR", "Belum berusia 17 tahun pada hari H dan belum pernah menikah."],
    ["TMS-4", "PINDAH DOMISILI", "Pindah keluar wilayah Desa Kalisalak secara administrasi sah."],
    ["TMS-5", "TNI / POLRI", "Telah diangkat menjadi anggota aktif TNI atau Kepolisian Negara RI."],
    ["TMS-6", "BUKAN WARGA", "Tinggal di Kalisalak tapi tidak memiliki identitas KTP/KK Kalisalak."],
  ];

  statusCodes.forEach((row, idx) => {
    if (idx === 0) {
      doc.setFillColor(30, 58, 138);
      doc.rect(18, y, 174, 5.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(row[0], 22, y + 4);
      doc.text(row[1], 42, y + 4);
      doc.text(row[2], 72, y + 4);
      y += 5.5;
    } else {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(18, y, 174, 5, "F");
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(18, y, 174, 5, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(idx > 3 ? 190 : 30, idx > 3 ? 18 : 58, idx > 3 ? 60 : 138);
      doc.text(row[0], 22, y + 3.6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(row[1], 42, y + 3.6);
      doc.text(row[2], 72, y + 3.6);
      y += 5;
    }
  });

  renderFooter(doc, 1, totalPages);

  // Halaman 2: Flowchart & Kontak Penting
  doc.addPage();
  y = renderKop(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text("3. ALUR KERJA HARIAN PANTARLIH (SOP RINGKAS):", 18, y);
  y += 5;

  const sopSteps = [
    "1. Pagi: Koordinasi dengan Ketua RT setempat mengenai target rumah yang akan dikunjungi hari itu.",
    "2. Siang/Sore: Lakukan kunjungan door-to-door, teliti KTP-el/KK, tandai daftar pemilih.",
    "3. Selesai Coklit di Rumah: Tempelkan stiker di tempat yang jelas terlihat dan serahkan Tanda Bukti.",
    "4. Malam / Akhir Hari: Buka portal www.p2kdkalisalak.my.id/admin, login dengan akun petugas Anda.",
    "5. Sinkronisasi Data: Input perubahan data harian agar progres desa terpantau secara realtime.",
    "6. Laporan Mingguan: Laporkan rekapitulasi fisik ke Koordinator Seksi Pendaftaran Pemilih di Balai Desa.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  sopSteps.forEach((s) => {
    doc.text(s, 22, y);
    y += 4.5;
  });

  y += 8;

  // Hotline Box
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(18, y, 174, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text("HOTLINE & PUSAT BANTUAN P2KD KALISALAK:", 24, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("• Koordinator Seksi Pemilih : M. Lu'lu Khulaludin, S.F.U (WA: 0858-7958-4257)", 24, y + 13);
  doc.text("• Helpdesk Teknis IT & Portal  : Develzy System Support (Portal Admin Kalisalak)", 24, y + 18);
  doc.text("• Sekretariat P2KD           : Kantor Balai Desa Kalisalak, Jl. Raya Kalisalak No. 01 Margasari", 24, y + 23);

  renderFooter(doc, 2, totalPages);

  return doc;
}

/**
 * Helper Download PDF langsung ke browser
 */
export function downloadBimtekPdf(type: "lengkap" | "lembar-saku") {
  const doc = type === "lengkap" ? generateMateriBimtekPdf() : generateLembarSakuPdf();
  const filename =
    type === "lengkap"
      ? "Materi-Bimtek-Pantarlih-P2KD-Kalisalak-2026.pdf"
      : "Lembar-Saku-Checklist-Pantarlih-Kalisalak.pdf";
  doc.save(filename);
}
