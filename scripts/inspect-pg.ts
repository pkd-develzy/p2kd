import * as dotenv from "dotenv";
dotenv.config();
import { Client } from "pg";

async function inspectPg() {
  const pgUrl = process.env.DIRECT_SEKSI1_URL || process.env.DATABASE_SEKSI1_URL;
  console.log("Connecting to:", pgUrl?.replace(/:[^:]*@/, ":***@"));
  const client = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // 1. Cek semua tabel di schema public
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("Tables in public schema:", tablesRes.rows.map(r => r.table_name));

  // 2. Cek kolom di tabel pemilih
  const colsRes = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pemilih'
    ORDER BY ordinal_position;
  `);
  console.log("\nColumns in 'pemilih':", colsRes.rows);

  // 3. Cek jumlah real pemilih dan rincian tahap
  const countRes = await client.query(`
    SELECT tahap, status_aktif, coklit_status, COUNT(*) as cnt
    FROM public.pemilih
    GROUP BY tahap, status_aktif, coklit_status;
  `);
  console.log("\nCounts by tahap in public.pemilih:", countRes.rows);

  // 4. Cek triggers di pemilih
  const trigRes = await client.query(`
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'pemilih';
  `);
  console.log("\nTriggers on 'pemilih':", trigRes.rows);

  await client.end();
}

inspectPg().catch(console.error);
