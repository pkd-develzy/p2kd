require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

const tables = [
  'pemilih',
  'anggota_p2kd',
  'balon_penjaringan',
  'kandidat_kades',
  'tps',
  'aduan_pemilih',
  'tps_vote_count',
  'audit_logs',
  'tahapan',
  'pengumuman',
  'web_config',
  'pendaftaran_petugas_dpt',
  'berita_artikel'
];

async function checkTables() {
  console.log('=== CHECKING ALL SUPABASE TABLES ===');
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: false }).limit(1);
      if (error) {
        console.log(`[FAIL] Table '${table}': ${error.message} (${error.code})`);
      } else {
        const sampleKeys = data && data[0] ? Object.keys(data[0]).join(', ') : '(empty table)';
        console.log(`[OK] Table '${table}' count: ${count}`);
        console.log(`     Columns: ${sampleKeys}`);
      }
    } catch (e) {
      console.log(`[ERR] Table '${table}': ${e.message}`);
    }
  }
}

checkTables();
