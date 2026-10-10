import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateNotifikasiBanner() {
  console.log('--- Migrasi Database: Menambahkan image_url dan is_banner ke tabel notifikasi_petugas ---');
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.');
    return;
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      ALTER TABLE notifikasi_petugas 
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS is_banner BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Kolom image_url dan is_banner berhasil ditambahkan!');

    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifikasi_petugas';
    `);
    console.log('Skema notifikasi_petugas saat ini:', res.rows);
  } catch (err: any) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrateNotifikasiBanner();
