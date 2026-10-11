import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateNotifikasiSchedule() {
  console.log('--- Migrasi Database: Menambahkan start_date dan end_date (WIB Schedule) ke notifikasi_petugas ---');
  
  const dbs = [
    { name: 'DATABASE_URL', url: process.env.DATABASE_URL },
    { name: 'DIRECT_SEKSI1_URL', url: process.env.DIRECT_SEKSI1_URL || process.env.DATABASE_SEKSI1_URL }
  ];

  for (const db of dbs) {
    if (!db.url) continue;
    console.log(`Menghubungkan ke ${db.name}...`);
    const pool = new Pool({
      connectionString: db.url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 7000
    });
    try {
      await pool.query(`
        ALTER TABLE notifikasi_petugas 
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS is_banner BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
      `);
      console.log(`✅ Kolom start_date dan end_date berhasil ditambahkan di ${db.name}!`);

      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notifikasi_petugas';
      `);
      console.log(`Skema notifikasi_petugas di ${db.name}:`, res.rows.map(r => r.column_name));
    } catch (err: any) {
      console.error(`Migration error di ${db.name}:`, err.message);
    } finally {
      await pool.end();
    }
  }
}

migrateNotifikasiSchedule();
