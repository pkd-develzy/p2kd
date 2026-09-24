import "dotenv/config";
import { notifyNewAduan } from "../src/lib/telegram";

async function main() {
  console.log("🚀 Mengirim pesan uji coba ke Telegram...");
  console.log("Target Chat ID   :", process.env.TELEGRAM_CHAT_ID);
  console.log("Target Thread ID :", process.env.TELEGRAM_THREAD_ID || "(Topik Utama / General)");

  const result = await notifyNewAduan({
    nomorAduan: "ADUAN-TEST-001",
    namaPelapor: "Ahmad Santoso (Warga Uji Coba)",
    nikMasked: "330214******0003",
    kontakPelapor: "081234567890",
    rt: "03",
    rw: "01",
    jenisAduan: "BELUM_TERDAFTAR",
    pesan: "Halo Panitia P2KD, ini adalah pesan simulasi uji coba notifikasi bot Telegram ke topik #LAPORAN.",
    tanggal: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
  });

  if (result.success) {
    console.log("✅ BERHASIL! Pesan notifikasi aduan telah terkirim ke Telegram.");
  } else {
    console.error("❌ GAGAL mengirim notifikasi:", result.message);
  }
}

main().catch(console.error);
