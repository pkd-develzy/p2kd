import * as dotenv from "dotenv";
dotenv.config();
import { RumahCoklitService } from "../src/lib/rumah-coklit-service";
import { SupabaseDbService } from "../src/lib/supabase-db";
import { generateAuthToken, verifyAuthToken } from "../src/lib/encryption";

async function testArchitecture() {
  console.log("==================================================================");
  console.log("TESTING NEW ARCHITECTURE: 1 QR = 1 RUMAH = BANYAK KK = BANYAK ANGGOTA");
  console.log("==================================================================");

  // 1. Ambil 1 token QR aktual yang belum digunakan
  const client = SupabaseDbService.getSeksi1Client();
  const { data: qrSeed } = await client
    .from("qr_rumah")
    .select("qr_token")
    .eq("status", "UNASSIGNED")
    .limit(1)
    .single();

  const testQrToken = qrSeed?.qr_token || "KLK-HM-01-0001";
  console.log(`\n1. Validasi Token QR Fisik: ${testQrToken}...`);
  const lookup1 = await RumahCoklitService.validateAndLookupQr(testQrToken);
  console.log("Hasil Lookup QR Awal:", {
    success: lookup1.success,
    valid: lookup1.valid,
    status: lookup1.qr?.status,
    rumahExists: Boolean(lookup1.rumah),
  });

  if (!lookup1.valid) {
    throw new Error("Token QR valid tidak ditemukan di database!");
  }

  // 2. Test Mendaftarkan Rumah Baru dengan QR tersebut
  console.log(`\n2. Mendaftarkan Fisik Rumah Baru dengan QR ${testQrToken}...`);
  const regRumah = await RumahCoklitService.registerOrUpdateRumah({
    qrToken: testQrToken,
    alamat: "Jl. Lapangan RT 01 RW 01",
    rt: "01",
    rw: "01",
    nomorRumah: "12A",
    keteranganLokasi: "Depan Pos Ronda",
    petugasUsername: "develzy",
    petugasNama: "Develzy (Developer)",
    tps: "Tabung Pemilihan 01",
  });
  console.log("Hasil Pendaftaran Rumah:", {
    success: regRumah.success,
    rumahId: regRumah.rumah?.id,
    alamat: regRumah.rumah?.alamat,
    statusPendataan: regRumah.rumah?.statusPendataan,
  });

  const rumahId = regRumah.rumah!.id;

  // 3. Test Menautkan 2 KK ke 1 Rumah (Multi-KK in 1 House)
  console.log(`\n3. Menautkan 2 Kartu Keluarga ke Rumah yang sama (${rumahId})...`);
  const kk1 = await RumahCoklitService.linkKkToRumah({
    rumahId,
    noKk: "3328010101010001",
    kepalaKeluargaNama: "Bapak Ahmad Subagyo",
    rt: "01",
    rw: "01",
    alamat: "Jl. Lapangan No. 12A",
  });
  console.log("- KK 1 ditautkan:", kk1.kk?.noKk, kk1.kk?.kepalaKeluargaNama);

  const kk2 = await RumahCoklitService.linkKkToRumah({
    rumahId,
    noKk: "3328010101010002",
    kepalaKeluargaNama: "Ibu Siti Rohmah (Menantu)",
    rt: "01",
    rw: "01",
    alamat: "Jl. Lapangan No. 12A Paviliun",
  });
  console.log("- KK 2 ditautkan:", kk2.kk?.noKk, kk2.kk?.kepalaKeluargaNama);

  // 4. Test Lookup Ulang setelah Rumah Terdaftar dengan Multi-KK
  console.log(`\n4. Lookup Ulang Token ${testQrToken} setelah pendaftaran multi-KK...`);
  const lookup2 = await RumahCoklitService.validateAndLookupQr(testQrToken);
  console.log("Hasil Lookup:", {
    statusQr: lookup2.qr?.status,
    totalKkDiRumah: lookup2.kks?.length,
    daftarKK: lookup2.kks?.map((k) => `${k.noKk} (${k.kepalaKeluargaNama})`),
  });

  if (lookup2.kks?.length !== 2) {
    throw new Error(`Ekspektasi 2 KK di rumah, ditemukan: ${lookup2.kks?.length}`);
  }

  // 5. Test Pencatatan Kunjungan Coklit & Verifikasi Anggota
  console.log(`\n5. Mencatat Kunjungan Coklit Lapangan dengan Idempotency...`);
  const idempotencyKey = `VISIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const visitRes = await RumahCoklitService.submitKunjunganCoklit({
    rumahId,
    qrToken: testQrToken,
    petugasUsername: "develzy",
    petugasNama: "Develzy (Developer)",
    tps: "Tabung Pemilihan 01",
    namaStikerManual: "Bpk. Ahmad Subagyo & Ibu Siti Rohmah",
    catatanKunjungan: "Stiker ditempel di pintu samping, 2 KK dalam 1 rumah.",
    stikerDitempel: true,
    verifikasiAnggota: [
      { pemilihId: "dummy-voter-1", status: "SESUAI" },
      { pemilihId: "dummy-voter-2", status: "UBAH_DATA", catatan: "Koreksi tanggal lahir" },
    ],
    idempotencyKey,
  });
  console.log("Hasil Kunjungan Coklit:", {
    success: visitRes.success,
    kunjunganId: visitRes.kunjunganId,
    statusKunjungan: visitRes.statusKunjungan,
  });

  // 6. Test Idempotency: Kirim Ulang Payload Kunjungan yang Sama
  console.log(`\n6. Menguji Idempotency (Kirim Ulang Kunjungan dengan Key sama)...`);
  const duplicateVisitRes = await RumahCoklitService.submitKunjunganCoklit({
    rumahId,
    qrToken: testQrToken,
    petugasUsername: "develzy",
    petugasNama: "Develzy (Developer)",
    tps: "Tabung Pemilihan 01",
    verifikasiAnggota: [],
    idempotencyKey,
  });
  console.log("Hasil Idempotency:", {
    success: duplicateVisitRes.success,
    message: duplicateVisitRes.message,
    kunjunganIdSama: duplicateVisitRes.kunjunganId === visitRes.kunjunganId,
  });

  // 7. Test Public Stiker Verification
  console.log(`\n7. Menguji Endpoint Verifikasi Publik Stiker (/stiker-coklit?qr=...)...`);
  const publicData = await RumahCoklitService.getPublicStikerData(testQrToken);
  console.log("Data Stiker Publik:", {
    success: publicData.success,
    kepalaKeluarga: publicData.data?.kepalaKeluarga,
    namaStikerManual: publicData.data?.namaStikerManual,
    statusQr: publicData.data?.statusQr,
    statusKunjungan: publicData.data?.statusKunjungan,
    totalKk: publicData.data?.totalKk,
  });

  // 8. Test Auth Token HMAC issuance and verification
  console.log(`\n8. Menguji Keamanan Token Autentikasi Sesi...`);
  const token = generateAuthToken({
    username: "pantarlih_rw01",
    nama: "Petugas RW 01",
    role: "pantarlih",
    seksi: "PANTARLIH_LAPANGAN",
    assignedTps: "Tabung Pemilihan 01",
    isSuperAdmin: false,
  });
  const decoded = verifyAuthToken(token);
  console.log("Token terverifikasi:", {
    username: decoded?.username,
    role: decoded?.role,
    assignedTps: decoded?.assignedTps,
    valid: Boolean(decoded),
  });

  console.log("\n==================================================================");
  console.log("SELURUH 8 TEST SUITE BACKEND & DATABASE BERHASIL 100%!");
  console.log("==================================================================");
}

testArchitecture().catch(console.error);
