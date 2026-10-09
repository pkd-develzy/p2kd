import * as dotenv from "dotenv";
dotenv.config();
import { Client } from "pg";

export async function runRollback() {
  const pgUrl = process.env.DIRECT_SEKSI1_URL || process.env.DATABASE_SEKSI1_URL;
  if (!pgUrl) {
    throw new Error("DATABASE_SEKSI1_URL / DIRECT_SEKSI1_URL tidak ditemukan!");
  }

  console.log("==================================================================");
  console.log("ROLLBACK MODEL DATABASE RUMAH - QR - KK - ANGGOTA");
  console.log("==================================================================");

  const client = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query("BEGIN;");

    console.log("1. Melepaskan foreign keys pada tabel pemilih...");
    await client.query(`
      ALTER TABLE public.pemilih DROP COLUMN IF EXISTS rumah_id;
      ALTER TABLE public.pemilih DROP COLUMN IF EXISTS kk_id;
      ALTER TABLE public.pemilih DROP COLUMN IF EXISTS verifikasi_status;
      ALTER TABLE public.pemilih DROP COLUMN IF EXISTS verifikasi_catatan;
      ALTER TABLE public.pemilih DROP COLUMN IF EXISTS verifikasi_petugas;
      ALTER TABLE public.pemilih DROP COLUMN IF EXISTS verifikasi_at;
    `);

    console.log("2. Menghapus tabel pendukung arsitektur rumah baru...");
    await client.query(`
      DROP TABLE IF EXISTS public.kunjungan_anggota_log CASCADE;
      DROP TABLE IF EXISTS public.kunjungan_coklit CASCADE;
      DROP TABLE IF EXISTS public.kartu_keluarga CASCADE;
      DROP TABLE IF EXISTS public.rumah CASCADE;
      DROP TABLE IF EXISTS public.qr_rumah CASCADE;
    `);

    await client.query("COMMIT;");
    console.log("Rollback berhasil diselesaikan.");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Rollback gagal:", err);
    throw err;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runRollback().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
