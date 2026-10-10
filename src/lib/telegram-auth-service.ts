import crypto from "crypto";

interface ResetTokenData {
  token: string;
  username: string;
  type: "PIN" | "PASSWORD";
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
}

// In-memory token registry dengan TTL 15 menit (Dapat disimpan di database atau Redis)
const resetTokenRegistry = new Map<string, ResetTokenData>();

export const TelegramAuthService = {
  /**
   * Membuat token acak 64-karakter yang aman dan berlaku 15 menit
   */
  createResetToken(username: string, type: "PIN" | "PASSWORD" = "PIN"): string {
    const randomHex = crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const tokenData: ResetTokenData = {
      token: randomHex,
      username: username.trim(),
      type,
      createdAt: now,
      expiresAt: now + 15 * 60 * 1000, // 15 Menit
      isUsed: false,
    };

    resetTokenRegistry.set(randomHex, tokenData);

    // Bersihkan token kadaluarsa
    for (const [key, val] of resetTokenRegistry.entries()) {
      if (val.expiresAt < now) {
        resetTokenRegistry.delete(key);
      }
    }

    return randomHex;
  },

  /**
   * Verifikasi validitas token (belum expired & belum digunakan)
   */
  verifyResetToken(token: string): {
    valid: boolean;
    data?: ResetTokenData;
    message?: string;
  } {
    if (!token) {
      return { valid: false, message: "Token otentikasi tidak ditemukan." };
    }

    const data = resetTokenRegistry.get(token);
    if (!data) {
      return {
        valid: false,
        message: "Tautan tidak valid atau telah kadaluarsa.",
      };
    }

    if (data.isUsed) {
      return {
        valid: false,
        message: "Tautan ini adalah satu kali pakai dan sudah pernah digunakan.",
      };
    }

    if (Date.now() > data.expiresAt) {
      resetTokenRegistry.delete(token);
      return {
        valid: false,
        message: "Masa berlaku tautan pemulihan (15 menit) telah habis. Silakan minta tautan baru.",
      };
    }

    return { valid: true, data };
  },

  /**
   * Hanguskan token setelah dipakai (Single-Use / Burn after reading)
   */
  consumeToken(token: string): boolean {
    const item = resetTokenRegistry.get(token);
    if (!item || item.isUsed) return false;
    item.isUsed = true;
    resetTokenRegistry.set(token, item);
    return true;
  },

  /**
   * Kirim pesan bot Telegram ke petugas
   */
  async sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken || !chatId) {
        console.log("[TelegramAuth] Bot token or chatId not configured. Text preview:", text);
        return false;
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
        }),
      });

      return res.ok;
    } catch (err) {
      console.error("[TelegramAuth] Failed to send telegram message:", err);
      return false;
    }
  },
};
