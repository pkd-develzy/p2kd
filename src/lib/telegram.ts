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
  },
  threadId?: number | string
): Promise<TelegramNotificationResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const targetThread = threadId ?? process.env.TELEGRAM_THREAD_ID;

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

    // Di Telegram, tautan topik General berakhiran /1 (misal: /3903989959/1).
    // Namun Telegram Bot API menolak jika diberi message_thread_id: 1 ('message thread not found').
    // Untuk topik 1 (General/Utama), payload tanpa message_thread_id akan otomatis masuk ke topik 1 tersebut.
    const threadNum = targetThread ? Number(targetThread) : NaN;
    if (!isNaN(threadNum) && threadNum > 1) {
      payload.message_thread_id = threadNum;
    }

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

export interface TelegramCredentialsPayload {
  username: string;
  password: string;
  namaLengkap: string;
  jabatan?: string;
  assignedWilayah?: string;
  kontakWa?: string;
  telegramChatId?: string | number;
}

export async function sendTelegramCredentialsNotification(
  payload: TelegramCredentialsPayload
): Promise<{ success: boolean; directSent: boolean; message: string; recipientChatId?: number | string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { success: false, directSent: false, message: "Telegram bot token tidak ditemukan di konfigurasi .env." };
  }

  // Resolve target chat ID
  let targetChatId: string | number | undefined = payload.telegramChatId;

  // Known Telegram User ID Map from group / direct interactions
  const KNOWN_TELEGRAM_USERS: Record<string, number> = {
    "arfiani": 5824414715,
    "nur arfiani": 5824414715,
    "nur": 5824414715,

    "nurhasilah": 5925019218,
    "eny nurhasilah": 5925019218,
    "eny": 5925019218,

    "krisdianah": 8975087590,
    "kris diana": 8975087590,
    "kris": 8975087590,

    "khulal": 5743372302,
    "muhammad lu'lu khulal": 5743372302,
    "m. lu’lu khulaludin, s.f.u": 5743372302,

    "farida": 8737820567,
    "linda farida": 8737820567,
    "linda": 8737820567,

    "triyana": 8159593467,
    "triyana,se,gr": 8159593467,

    "marufah": 6823997793,
    "mar'ufah": 6823997793,
  };

  const cleanUname = (payload.username || "").toLowerCase().trim();
  const cleanNama = (payload.namaLengkap || "").toLowerCase().trim();

  if (!targetChatId) {
    if (KNOWN_TELEGRAM_USERS[cleanUname]) {
      targetChatId = KNOWN_TELEGRAM_USERS[cleanUname];
    } else if (KNOWN_TELEGRAM_USERS[cleanNama]) {
      targetChatId = KNOWN_TELEGRAM_USERS[cleanNama];
    } else {
      // Find matching key in map
      for (const [key, id] of Object.entries(KNOWN_TELEGRAM_USERS)) {
        if (cleanNama.includes(key) || key.includes(cleanNama) || cleanUname.includes(key)) {
          targetChatId = id;
          break;
        }
      }
    }
  }

  // If still not found, query getUpdates dynamically from Telegram Bot API
  if (!targetChatId) {
    try {
      const upRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { cache: "no-store" });
      const upJson = await upRes.json();
      if (upJson.ok && Array.isArray(upJson.result)) {
        for (const u of upJson.result) {
          const from = u.message?.from || u.callback_query?.from;
          if (from && !from.is_bot && from.id) {
            const fullName = `${from.first_name || ""} ${from.last_name || ""}`.toLowerCase().trim();
            const fromUname = (from.username || "").toLowerCase().trim();
            if (
              fullName.includes(cleanUname) ||
              cleanNama.includes(fullName) ||
              fullName.includes(cleanNama) ||
              (fromUname && fromUname === cleanUname)
            ) {
              targetChatId = from.id;
              break;
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const directMessage = `
🔐 <b>KREDENSIAL TERBARU AKUN P2KD</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
Yth. Bpk/Ibu <b>${payload.namaLengkap}</b>
Jabatan: <b>${payload.jabatan || "Petugas Lapangan"}</b>
${payload.assignedWilayah ? `Wilayah: <b>${payload.assignedWilayah}</b>\n` : ""}Kata sandi akun Anda telah berhasil diperbarui:
👤 <b>username :</b> <code>${payload.username}</code>
🔑 <b>Password :</b> <code>${payload.password}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <i>Gunakan kredensial di atas untuk masuk ke Aplikasi P2KD (.apk / PWA).</i>
⚠️ <i>Simpan dan jaga kerahasiaan username & kata sandi ini. Jangan berikan kepada siapapun.</i>
`.trim();

  // 1. Kirim langsung ke pesan pribadi (DM) Telegram petugas
  if (targetChatId) {
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: directMessage,
          parse_mode: "HTML",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        return {
          success: true,
          directSent: true,
          message: `Kredensial berhasil dikirim langsung ke akun Telegram pribadi ${payload.namaLengkap}.`,
          recipientChatId: targetChatId,
        };
      }
    } catch (err) {
      console.warn("Direct Telegram send failed:", err);
    }
  }

  // 2. Jika pengiriman DM belum bisa (misal belum start bot), kirim sinyal aktivasi aman ke grup
  const groupChatId = process.env.TELEGRAM_CHAT_ID;
  if (groupChatId) {
    const groupNotice = `
🔔 <b>AKTIVASI KATA SANDI BARU AKUN P2KD</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Nama Petugas :</b> <b>${payload.namaLengkap}</b>
📌 <b>Jabatan      :</b> ${payload.jabatan || "Petugas Lapangan"}
🔑 <b>Username     :</b> <code>${payload.username}</code>
🕒 <b>Waktu        :</b> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB

✅ <i>Petugas telah berhasil memperbarui kata sandi awal dengan kata sandi pribadi baru.</i>
━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <i>Aplikasi P2KD Pilkades Kalisalak 2026/2027 (.apk / PWA)</i>
`.trim();

    await sendTelegramNotification(groupNotice);
  }

  return {
    success: true,
    directSent: false,
    message: "Notifikasi aktivasi akun telah diteruskan ke Telegram resmi P2KD.",
    recipientChatId: groupChatId,
  };
}
