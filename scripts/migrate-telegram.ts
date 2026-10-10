import { getSupabaseServer3Admin } from '../src/lib/supabase';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function runMigration() {
  console.log('--- Migrasi Database: Menambahkan Kolom Telegram Pribadi pada anggota_p2kd ---');
  
  if (process.env.DATABASE_URL) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query(`
        ALTER TABLE anggota_p2kd 
        ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100),
        ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;
      `);
      console.log('✅ Berhasil via PostgreSQL direct connection!');
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'anggota_p2kd' AND column_name LIKE 'telegram%'
      `);
      console.log('Kolom terverifikasi:', res.rows);
      await pool.end();
      return;
    } catch (err: any) {
      console.warn('Direct PG failed, trying Supabase RPC / query fallback:', err.message);
    }
  }

  // Supabase fallback
  const s3 = getSupabaseServer3Admin();
  console.log('Checking Supabase connection...');
  const { data, error } = await s3.from('anggota_p2kd').select('id, username').limit(1);
  if (error) {
    console.error('Supabase query error:', error);
  } else {
    console.log('Supabase connection active! Sample row:', data);
  }
}

runMigration();
