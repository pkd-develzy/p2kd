import { PetugasStatus } from "./data-store";

export const TELEGRAM_GROUP_URL = "https://t.me/+CC-WB_yujNhmZmM9";
export const TELEGRAM_PLAYSTORE_URL =
  "https://play.google.com/store/apps/details?id=org.telegram.messenger&pcampaignid=web_share";

export interface PetugasMessageParams {
  namaLengkap: string;
  nomorRegistrasi: string;
  assignedWilayah: string;
  catatanPanitia?: string;
}

/**
 * Mengambil template catatan resmi panitia berdasarkan status verifikasi
 */
export function getDefaultCatatanPanitia(status: PetugasStatus, assignedWilayah?: string): string {
  const wilayahStr = assignedWilayah || "Wilayah Penugasan";
  switch (status) {
    case "MENUNGGU_VERIFIKASI":
      return "Berkas pendaftaran telah kami terima dan sedang dalam antrean verifikasi administrasi oleh Panitia P2KD Desa Kalisalak.";
    case "PERLU_KLARIFIKASI":
      return "Mohon hadir ke Sekretariat P2KD Desa Kalisalak (Balai Desa) atau menghubungi panitia untuk klarifikasi berkas dan konfirmasi data kependudukan/integritas.";
    case "LOLOS":
      return `Selamat! Anda dinyatakan Lolos Seleksi Administrasi sebagai Calon Petugas Pantarlih Wilayah ${wilayahStr} Desa Kalisalak. Menunggu jadwal penetapan resmi dan bimbingan teknis (Bimtek).`;
    case "DITETAPKAN":
      return `Selamat! Anda RESMI DITETAPKAN sebagai Petugas Pantarlih Wilayah ${wilayahStr} Pilkades Kalisalak 2026/2027. Wajib bergabung ke Grup Telegram Resmi Petugas.`;
    case "TIDAK_LOLOS":
      return "Terima kasih atas partisipasi dan dedikasi Anda. Mohon maaf pada periode kali ini Anda belum dapat kami tetapkan sebagai petugas pendataan DPT.";
    default:
      return "";
  }
}

/**
 * Format pesan WhatsApp resmi yang dipersonalisasi untuk setiap status verifikasi
 */
export function generatePetugasWhatsAppMessage(
  status: PetugasStatus,
  params: PetugasMessageParams
): string {
  const { namaLengkap, nomorRegistrasi, assignedWilayah, catatanPanitia } = params;
  const wilayahStr = assignedWilayah || "Desa Kalisalak";

  switch (status) {
    case "PERLU_KLARIFIKASI":
      return (
        `Yth. Sdr/i *${namaLengkap}*,\n\n` +
        `Panitia Pemilihan Kepala Desa (P2KD) Kalisalak 2026/2027 menginformasikan bahwa berkas pendaftaran Petugas Pendataan DPT Anda (No. Reg: *${nomorRegistrasi}*) memerlukan *KLARIFIKASI TAMBAHAN*.\n\n` +
        `*Hal yang Perlu Dikonfirmasi:*\n${catatanPanitia || "Terdapat data administrasi atau catatan integritas yang perlu dikonfirmasi langsung dengan Panitia."}\n\n` +
        `*Tindakan yang Harus Dilakukan:*\n` +
        `1. Segera datang ke Sekretariat P2KD di Balai Desa Kalisalak atau hubungi kontak resmi Panitia.\n` +
        `2. Membawa dokumen identitas asli (KTP-el dan Kartu Keluarga).\n\n` +
        `Rincian berkas dapat dipantau di:\n` +
        `https://www.p2kdkalisalak.my.id/daftarpantarlih\n\n` +
        `Terima kasih atas perhatian dan kerja samanya.\n` +
        `_Panitia P2KD Desa Kalisalak_`
      );

    case "LOLOS":
      return (
        `Yth. Sdr/i *${namaLengkap}*,\n\n` +
        `KABAR BAIK! Panitia Pemilihan Kepala Desa (P2KD) Kalisalak 2026/2027 mengumumkan bahwa berkas pendaftaran Petugas Pendataan DPT Anda (No. Reg: *${nomorRegistrasi}*) secara resmi dinyatakan:\n\n` +
        `🎉 *LOLOS SELEKSI ADMINISTRASI*\n\n` +
        `*Rincian Wilayah Penugasan:*\n` +
        `• Jabatan: Calon Petugas Pemutakhiran Data Pemilih (Pantarlih)\n` +
        `• Wilayah Tugas: *${wilayahStr}*\n` +
        `• Lingkup Desa: Desa Kalisalak, Kec. Margasari, Kab. Tegal\n\n` +
        `*Catatan Panitia:*\n${catatanPanitia || "Berkas administrasi dan surat pernyataan integritas lengkap serta memenuhi syarat."}\n\n` +
        `*Langkah Selanjutnya:*\n` +
        `Tahapan selanjutnya adalah Penetapan Resmi Petugas dan Bimbingan Teknis (Bimtek) Coklit Lapangan. Pantau pengumuman resmi berkala di portal:\n` +
        `https://www.p2kdkalisalak.my.id/daftarpantarlih\n\n` +
        `Terima kasih atas kesiapan dan dedikasi Anda.\n` +
        `_Panitia P2KD Desa Kalisalak_`
      );

    case "DITETAPKAN":
      return (
        `Yth. Sdr/i *${namaLengkap}*,\n\n` +
        `SELAMAT! Berdasarkan Keputusan Resmi Panitia Pemilihan Kepala Desa (P2KD) Kalisalak 2026/2027, Anda telah resmi:\n\n` +
        `🎖️ *DITETAPKAN SEBAGAI PETUGAS PENDATAAN DPT (PANTARLIH)*\n\n` +
        `*Rincian Penugasan Resmi:*\n` +
        `• No. Registrasi: *${nomorRegistrasi}*\n` +
        `• Wilayah Tugas: *${wilayahStr}*\n` +
        `• Desa: Kalisalak, Kec. Margasari, Kab. Tegal\n\n` +
        `*Catatan Panitia:*\n${catatanPanitia || "Selamat bertugas mengemban amanah dalam mengawal hak pilih warga Desa Kalisalak."}\n\n` +
        `⚠️ *INSTRUKSI WAJIB BAGI PETUGAS:*\n` +
        `Seluruh petugas yang telah ditetapkan *WAJIB BERGABUNG* ke Grup Telegram Resmi Pantarlih P2KD Kalisalak untuk koordinasi tugas, materi Bimtek, jadwal coklit, dan distribusi logistik:\n` +
        `👉 *Link Grup Telegram Resmi:*\n${TELEGRAM_GROUP_URL}\n\n` +
        `*(Bagi yang belum memiliki aplikasi Telegram, wajib mengunduh terlebih dahulu di Play Store: ${TELEGRAM_PLAYSTORE_URL})*\n\n` +
        `Silakan unduh dokumen berkas resmi (Surat Pernyataan & Tanda Bukti) di:\n` +
        `https://www.p2kdkalisalak.my.id/daftarpantarlih\n\n` +
        `Selamat bertugas, junjung tinggi netralitas dan kejujuran!\n` +
        `_Panitia P2KD Desa Kalisalak_`
      );

    case "TIDAK_LOLOS":
      return (
        `Yth. Sdr/i *${namaLengkap}*,\n\n` +
        `Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak 2026/2027 menyampaikan terima kasih dan apresiasi yang setinggi-tingginya atas partisipasi dan kesediaan Anda mendaftar sebagai Petugas Pendataan DPT (No. Reg: *${nomorRegistrasi}*).\n\n` +
        `Melalui pesan ini, kami menyampaikan *permohonan maaf yang sebesar-besarnya* bahwa setelah melalui proses verifikasi berkas dan penyesuaian kuota wilayah, Anda *belum dapat kami tetapkan* sebagai petugas pada Pilkades Kalisalak periode ini.\n\n` +
        `*Catatan Panitia:*\n${catatanPanitia || "Kuota kebutuhan wilayah telah terpenuhi atau terdapat kriteria administrasi yang belum terpenuhi."}\n\n` +
        `Keputusan ini tidak mengurangi rasa hormat kami atas niat baik dan kepedulian Anda dalam menyukseskan pesta demokrasi Desa Kalisalak. Kami sangat berharap Anda tetap dapat berpartisipasi aktif dalam tahapan Pilkades berikutnya sebagai pemilih yang cerdas dan kritis.\n\n` +
        `Salam hormat kami,\n` +
        `_Panitia P2KD Desa Kalisalak_`
      );

    case "MENUNGGU_VERIFIKASI":
    default:
      return (
        `Halo Sdr/i *${namaLengkap}*,\n\n` +
        `Berkas pendaftaran Petugas Pendataan DPT Pilkades Desa Kalisalak 2026/2027 Anda (No. Reg: *${nomorRegistrasi}*) telah kami terima dan saat ini berstatus: *MENUNGGU VERIFIKASI*.\n\n` +
        `Panitia sedang melakukan peninjauan administrasi dan uji integritas netralitas. Pantau status pendaftaran Anda secara berkala melalui portal resmi:\n` +
        `https://www.p2kdkalisalak.my.id/daftarpantarlih\n\n` +
        `Terima kasih atas partisipasi Anda.\n` +
        `_Panitia P2KD Desa Kalisalak_`
      );
  }
}
