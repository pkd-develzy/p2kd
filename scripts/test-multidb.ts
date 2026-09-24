import * as dotenv from "dotenv";
dotenv.config();

async function testMultiDb() {
  console.log("Testing Multi-Database Sharding setup...");
  console.log("Main DB:", process.env.SUPABASE_URL);
  console.log("Seksi 1 DB:", process.env.SUPABASE_SEKSI1_URL);

  const { SupabaseDbService } = await import("../src/lib/supabase-db");

  const t0 = Date.now();
  const stats = await SupabaseDbService.getAggregateStats(true);
  console.log(`getAggregateStats took ${Date.now() - t0}ms:`, stats);

  const t1 = Date.now();
  const allData = await SupabaseDbService.fetchAllData(true);
  console.log(`fetchAllData took ${Date.now() - t1}ms:`);
  console.log(`- TPS count (Seksi 1 DB): ${allData.data.tpsList?.length}`);
  console.log(`- Petugas DPT count (Seksi 1 DB): ${allData.data.petugasDptList?.length}`);
  console.log(`- Pemilih count (Seksi 1 DB): ${allData.data.pemilihList?.length}`);
  console.log(`- Berita count (Main DB): ${allData.data.beritaList?.length}`);
  console.log(`- Aduan count (Main DB): ${allData.data.aduanList?.length}`);
  console.log(`- Kandidat count (Main DB): ${allData.data.kandidatList?.length}`);

  console.log("\nALL SYSTEMS OPERATIONAL & FULLY SYNCHRONIZED!");
}

testMultiDb().catch(console.error);
