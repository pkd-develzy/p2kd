import * as dotenv from "dotenv";
dotenv.config();
import { SupabaseDbService } from "../src/lib/supabase-db";

async function inspectVoterStages() {
  const client = SupabaseDbService.getSeksi1Client();

  // 1. Cek isi statistik_pemilih
  const { data: statRow, error: statErr } = await client.from("statistik_pemilih").select("*");
  console.log("statistik_pemilih row:", statRow, statErr);

  // 2. Cek distinct tahap di tabel pemilih
  const { data: tahapCounts, error: tErr } = await client
    .from("pemilih")
    .select("tahap, status_aktif, coklit_status");
  
  if (tErr) {
    console.error("Error fetching pemilih:", tErr);
    return;
  }

  const breakdown: Record<string, number> = {};
  for (const row of tahapCounts || []) {
    const key = `tahap: ${row.tahap || 'NULL'} | status_aktif: ${row.status_aktif} | coklit: ${row.coklit_status}`;
    breakdown[key] = (breakdown[key] || 0) + 1;
  }

  console.log("Total pemilih count:", tahapCounts?.length);
  console.log("Breakdown tahap pemilih di DB:", breakdown);
}

inspectVoterStages().catch(console.error);
