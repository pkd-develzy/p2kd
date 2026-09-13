require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);
  const grouped = {};
  for (const row of res.rows) {
    if (!grouped[row.table_name]) grouped[row.table_name] = [];
    grouped[row.table_name].push(`${row.column_name} (${row.data_type}, null:${row.is_nullable})`);
  }
  for (const [table, cols] of Object.entries(grouped)) {
    console.log('=== ' + table + ' ===');
    console.log(cols.join(', '));
  }
  await client.end();
}
run().catch(console.error);
