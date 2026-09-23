/**
 * telegram.ts
 * Integrasi Notifikasi Bot Telegram untuk Panitia P2KD Desa Kalisalak
 * 
 * Fitur:
 * - Mengirim pesan real-time ke Grup Telegram Panitia P2KD saat ada aduan baru
 * - Dilengkapi tombol aksi cepat (Buka Dashboard & Chat WA Pelapor)
 * - Graceful fallback: Jika token belum disetel di .env, sistem tidak akan error
 */

export interface TelegramNotificationResult {
  success: boolean;
  message?: string;
}

export async function sendTelegramNotification(
  message: string,
  replyMarkup?: {
    inline_keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
  }
): Promise<TelegramNotificationResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Jika belum dikonfigurasi, lewati dengan aman tanpa menggagalkan request
  if (!token || !chatId) {
    return {
      success: true,
      message: "Telegram bot token or chat ID is not configured in .env",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn("[Telegram Notification Warning]:", data.description);
      return { success: false, message: data.description };
    }

    return { success: true };
  } catch (err) {
    console.error("[Telegram Notification Error]:", err);
    return { success: false, message: "Network error sending telegram notification" };
  }
}

export interface NewAduanPayload {
  nomorAduan: string;
  namaPelapor: string;
  nikMasked: string;
  kontakPelapor: string;
  rt: string;
  rw: string;
  jenisAduan: string;
  pesan: string;
  tanggal: string;
}

export async function notifyNewAduan(aduan: NewAduanPayload) {
  // Format nomor WhatsApp untuk tautan wa.me
  const cleanDigits = aduan.kontakPelapor.replace(/\D/g, "");
  let waPhone = cleanDigits;
  if (cleanDigits.startsWith("0")) {
    waPhone = `62${cleanDigits.slice(1)}`;
  } else if (!cleanDigits.startsWith("62")) {
    waPhone = `62${cleanDigits}`;
  }

  const jenisLabelMap: Record<string, string> = {
    BELUM_TERDAFTAR: "Belum Terdaftar di DPS (Pemilih Baru)",
    KOREKSI_DATA: "Koreksi Elemen Data Pemilih",
    MUTASI_TPS: "Permohonan Pindah Tabung",
    LAPOR_TMS: "Lapor Pemilih TMS (Meninggal/Pindah/TNI-Polri)",
    LAINNYA: "Lain-lain",
  };

  const jenisLabel = jenisLabelMap[aduan.jenisAduan] || aduan.jenisAduan;

  // Escape karakter HTML sederhana pada pesan warga
  const safePesan = aduan.pesan
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const message = `
<b>🔔 LAPORAN ADUAN WARGA BARU MASUK!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
📋 <b>No. Registrasi :</b> <code>${aduan.nomorAduan}</code>
👤 <b>Nama Pelapor   :</b> <b>${aduan.namaPelapor}</b>
🆔 <b>NIK Pelapor    :</b> <code>${aduan.nikMasked}</code>
📱 <b>Kontak / WA    :</b> ${aduan.kontakPelapor}
📍 <b>Wilayah        :</b> RT ${aduan.rt} / RW ${aduan.rw} (Tabung ${aduan.rw})
📌 <b>Jenis Permohonan:</b> ${jenisLabel}
🕒 <b>Waktu Masuk    :</b> ${aduan.tanggal}

💬 <b>Rincian Keterangan Aduan:</b>
<i>"${safePesan}"</i>
━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Segera verifikasi atau tindak lanjuti laporan ini di Dashboard Admin P2KD.</i>
`.trim();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.p2kdkalisalak.my.id";

  return sendTelegramNotification(message, {
    inline_keyboard: [
      [
        { text: "🌐 Buka Dashboard Admin", url: `${baseUrl}/admin` },
        { text: "💬 Hubungi Pelapor (WA)", url: `https://wa.me/${waPhone}` },
      ],
    ],
  });
}
