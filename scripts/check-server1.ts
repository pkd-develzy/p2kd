import * as dotenv from "dotenv";
dotenv.config();
import { Client } from "pg";

async function checkServer1() {
  const pgUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!pgUrl) return;
  console.log("Checking Server 1...");
  const client = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("Server 1 tables:", tablesRes.rows.map(r => r.table_name));
  await client.end();
}

checkServer1().catch(console.error);
