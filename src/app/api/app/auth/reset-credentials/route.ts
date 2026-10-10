import { NextResponse } from "next/server";
import { TelegramAuthService } from "@/lib/telegram-auth-service";
import { SupabaseDbService } from "@/lib/supabase-db";
import { createStoredPassword } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPin, newPassword } = body;

    const verification = TelegramAuthService.verifyResetToken(token);
    if (!verification.valid || !verification.data) {
      return NextResponse.json(
        { success: false, message: verification.message || "Tautan tidak valid atau kadaluarsa." },
        { status: 400 }
      );
    }

    const { username, type } = verification.data;

    if (type === "PIN") {
      if (!newPin || typeof newPin !== "string" || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
        return NextResponse.json(
          { success: false, message: "PIN baru harus terdiri dari tepat 6 angka." },
          { status: 400 }
        );
      }
    } else {
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      // Perbarui kata sandi di database Supabase Server 3
      try {
        const s3 = SupabaseDbService.getServer3Client();
        const newStoredHash = createStoredPassword(newPassword);
        const { error: errUpdate } = await s3
          .from("anggota_p2kd")
          .update({
            password_hash: newStoredHash,
            updated_at: new Date().toISOString(),
          })
          .eq("username", username);

        if (errUpdate) {
          console.error("[ResetAuth] DB password update error:", errUpdate);
        }
      } catch (dbErr) {
        console.error("[ResetAuth] DB error on updating password:", dbErr);
      }
    }

    // Hanguskan token seketika (Single-Use / Burn after use)
    TelegramAuthService.consumeToken(token);

    // Kirim notifikasi konfirmasi ke Telegram
    const targetChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || "";
    if (targetChatId) {
      const confirmMessage = `✅ <b>SUKSES PEMBARUAN ${type}</b>\n\n` +
        `Halo <b>${username}</b>, ${type === "PIN" ? "6-Digit PIN Keamanan" : "Kata Sandi"} akun Anda telah berhasil diperbarui.\n` +
        `Waktu Pembaruan: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB.\n\n` +
        `Jika Anda tidak melakukan perubahan ini, segera hubungi Sekretariat P2KD Kalisalak.`;
      await TelegramAuthService.sendTelegramMessage(targetChatId, confirmMessage);
    }

    return NextResponse.json({
      success: true,
      message: `${type === "PIN" ? "6-Digit PIN" : "Kata Sandi"} baru Anda berhasil disimpan. Silakan masuk kembali ke aplikasi.`,
    });
  } catch (err) {
    console.error("Error in reset-credentials route:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server saat memperbarui kredensial." },
      { status: 500 }
    );
  }
}
