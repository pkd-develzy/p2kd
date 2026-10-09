import * as dotenv from "dotenv";
dotenv.config();
import { Client } from "pg";

async function inspectPgFunctions() {
  const pgUrl = process.env.DIRECT_SEKSI1_URL || process.env.DATABASE_SEKSI1_URL;
  const client = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // 1. Cek isi fungsi recalculate_statistik_pemilih
  const funcRes = await client.query(`
    SELECT routine_name, routine_definition
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name LIKE '%statistik%';
  `);
  console.log("Statistik functions:", funcRes.rows);

  // 2. Cek kolom pemilih_status_history
  const histCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pemilih_status_history'
    ORDER BY ordinal_position;
  `);
  console.log("Columns in 'pemilih_status_history':", histCols.rows);

  // 3. Cek jumlah baris di pemilih_status_history
  const histCount = await client.query(`SELECT COUNT(*) FROM public.pemilih_status_history;`);
  console.log("Count in 'pemilih_status_history':", histCount.rows[0].count);

  await client.end();
}

inspectPgFunctions().catch(console.error);
