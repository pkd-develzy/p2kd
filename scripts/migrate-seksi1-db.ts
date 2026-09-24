import { Client } from "pg";

const oldUrl = "postgresql://postgres.apiastdpwrycnsbskpmy:Muh4mm4dkhul4l.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";
const newUrl = "postgresql://postgres.ewzhaldoxepheugxjquz:Muh4mm4dkhul4l.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function migrate() {
  console.log("Connecting to both databases...");
  const oldDb = new Client({ connectionString: oldUrl, ssl: { rejectUnauthorized: false } });
  const newDb = new Client({ connectionString: newUrl, ssl: { rejectUnauthorized: false } });

  await oldDb.connect();
  await newDb.connect();
  console.log("Both databases connected successfully!");

  // Step 1: Create Tables on New Database
  console.log("Ensuring schema, tables, and indexes on new database...");
  await newDb.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS public.tps (
      id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
      kode_tps character varying NULL,
      nomor_tps character varying NOT NULL,
      nama_tps character varying NOT NULL,
      wilayah_id text NULL,
      lokasi character varying NULL,
      alamat text NULL,
      rt character varying NULL,
      rw character varying NULL,
      kuota_maksimal integer NOT NULL DEFAULT 300,
      status character varying NOT NULL DEFAULT 'AKTIF'::character varying,
      created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
      nama_tabung text NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tps_nomor ON public.tps USING btree (nomor_tps);

    CREATE TABLE IF NOT EXISTS public.pendaftaran_petugas_dpt (
      id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
      nik text NOT NULL,
      nama_lengkap text NOT NULL,
      tempat_lahir text NULL,
      tanggal_lahir text NULL,
      jenis_kelamin text NULL,
      no_kk text NULL,
      alamat text NULL,
      rt text NULL,
      rw text NULL,
      desa text NULL DEFAULT 'Desa Kalisalak'::character varying,
      nomor_whatsapp text NOT NULL,
      is_calon_kades boolean NULL DEFAULT false,
      is_tim_sukses boolean NULL DEFAULT false,
      is_memiliki_kepentingan boolean NULL DEFAULT false,
      keterangan_kepentingan text NULL,
      status_verifikasi text NULL DEFAULT 'DISETUJUI'::character varying,
      catatan_verifikasi text NULL,
      surat_pernyataan_url text NULL,
      surat_pernyataan_signed boolean NULL DEFAULT true,
      tanggal_pendaftaran timestamp with time zone NULL DEFAULT now(),
      created_at timestamp with time zone NULL DEFAULT now(),
      nomor_registrasi text NULL,
      nik_masked text NULL,
      no_kk_masked text NULL,
      dusun text NULL,
      nomor_wa text NULL,
      is_kepentingan_calon boolean NULL DEFAULT false,
      status text NULL DEFAULT 'MENUNGGU_VERIFIKASI'::character varying,
      catatan_panitia text NULL,
      assigned_wilayah text NULL,
      persetujuan_pernyataan boolean NULL DEFAULT true,
      tanda_tangan_url text NULL,
      keterangan_calon_kades text NULL,
      keterangan_tim_sukses text NULL,
      updated_at timestamp with time zone NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_petugas_dpt_rw ON public.pendaftaran_petugas_dpt USING btree (rw);
    CREATE INDEX IF NOT EXISTS idx_petugas_dpt_nik ON public.pendaftaran_petugas_dpt USING btree (nik);

    CREATE TABLE IF NOT EXISTS public.pemilih (
      id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
      nik character varying NOT NULL,
      nik_encrypted text NULL,
      nik_hash character varying NULL,
      no_kk character varying NULL,
      nama_lengkap character varying NOT NULL,
      tempat_lahir character varying NULL,
      tanggal_lahir date NULL,
      jenis_kelamin character varying NULL,
      status_perkawinan character varying NULL,
      alamat text NULL,
      rt character varying NULL,
      rw character varying NULL,
      desa character varying NULL DEFAULT 'Kalisalak'::character varying,
      kecamatan character varying NULL DEFAULT 'Margasari'::character varying,
      tps character varying NULL,
      tps_id text NULL,
      disabilitas character varying NULL,
      status_aktif character varying NULL DEFAULT 'AKTIF'::character varying,
      alasan_tms text NULL,
      coklit_status character varying NULL DEFAULT 'BELUM_COKLIT'::character varying,
      coklit_tanggal date NULL,
      coklit_catatan text NULL,
      coklit_petugas text NULL,
      tahap character varying NULL DEFAULT 'DPS'::character varying,
      created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_pemilih_nama ON public.pemilih USING btree (nama_lengkap);
    CREATE INDEX IF NOT EXISTS idx_pemilih_tps ON public.pemilih USING btree (tps);
    CREATE INDEX IF NOT EXISTS idx_pemilih_rt_rw ON public.pemilih USING btree (rt, rw);
    CREATE INDEX IF NOT EXISTS idx_pemilih_status_aktif ON public.pemilih USING btree (status_aktif);
    CREATE INDEX IF NOT EXISTS idx_pemilih_nik ON public.pemilih USING btree (nik);
    CREATE INDEX IF NOT EXISTS idx_pemilih_tahap ON public.pemilih USING btree (tahap);

    ALTER TABLE public.tps ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.pendaftaran_petugas_dpt ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.pemilih ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tps' AND policyname = 'service_role_all') THEN
        CREATE POLICY "service_role_all" ON public.tps FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tps' AND policyname = 'Allow public read tps') THEN
        CREATE POLICY "Allow public read tps" ON public.tps FOR SELECT TO anon, authenticated USING (true);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pendaftaran_petugas_dpt' AND policyname = 'service_role_all') THEN
        CREATE POLICY "service_role_all" ON public.pendaftaran_petugas_dpt FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pendaftaran_petugas_dpt' AND policyname = 'Allow read pendaftaran_petugas_dpt') THEN
        CREATE POLICY "Allow read pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt FOR SELECT TO anon, authenticated USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pendaftaran_petugas_dpt' AND policyname = 'Allow anon insert pendaftaran_petugas_dpt') THEN
        CREATE POLICY "Allow anon insert pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt FOR INSERT TO anon, authenticated WITH CHECK ((nama_lengkap IS NOT NULL) AND (nik IS NOT NULL));
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pemilih' AND policyname = 'service_role_all') THEN
        CREATE POLICY "service_role_all" ON public.pemilih FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pemilih' AND policyname = 'Allow public read pemilih') THEN
        CREATE POLICY "Allow public read pemilih" ON public.pemilih FOR SELECT TO anon, authenticated USING (true);
      END IF;
    END $$;
  `);
  console.log("Schema, indexes, and RLS policies verified.");

  // Helper for batch inserting rows
  async function bulkInsert(tableName: string, rows: any[], chunkSize: number = 250) {
    if (rows.length === 0) return;
    const columns = Object.keys(rows[0]);
    const colSql = columns.map(c => `"${c}"`).join(", ");

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const values: any[] = [];
      const valueClauses: string[] = [];

      chunk.forEach((row, rowIndex) => {
        const offset = rowIndex * columns.length;
        const placeholders = columns.map((_, colIndex) => `$${offset + colIndex + 1}`);
        valueClauses.push(`(${placeholders.join(", ")})`);
        columns.forEach(col => values.push(row[col]));
      });

      const sql = `
        INSERT INTO public."${tableName}" (${colSql})
        VALUES ${valueClauses.join(", ")}
        ON CONFLICT (id) DO NOTHING;
      `;
      await newDb.query(sql, values);
      console.log(`Inserted ${Math.min(i + chunkSize, rows.length)} / ${rows.length} into ${tableName}...`);
    }
  }

  // TPS
  console.log("Migrating TPS...");
  const tpsRows = await oldDb.query(`SELECT * FROM public.tps`);
  await bulkInsert("tps", tpsRows.rows, 100);

  // Petugas DPT
  console.log("Migrating pendaftaran_petugas_dpt...");
  const petugasRows = await oldDb.query(`SELECT * FROM public.pendaftaran_petugas_dpt`);
  await bulkInsert("pendaftaran_petugas_dpt", petugasRows.rows, 100);

  // Pemilih
  console.log("Migrating pemilih in chunks...");
  const totalPemilihRes = await oldDb.query(`SELECT count(*) FROM public.pemilih`);
  const totalPemilih = parseInt(totalPemilihRes.rows[0].count, 10);
  console.log(`Total pemilih: ${totalPemilih}`);

  const fetchChunk = 1000;
  for (let offset = 0; offset < totalPemilih; offset += fetchChunk) {
    const pemilihRows = await oldDb.query(`
      SELECT * FROM public.pemilih ORDER BY id LIMIT $1 OFFSET $2
    `, [fetchChunk, offset]);
    await bulkInsert("pemilih", pemilihRows.rows, 200);
  }

  // Final verification
  console.log("\n================ VERIFICATION ================");
  const countTps = await newDb.query(`SELECT count(*) FROM public.tps`);
  const countPetugas = await newDb.query(`SELECT count(*) FROM public.pendaftaran_petugas_dpt`);
  const countPemilih = await newDb.query(`SELECT count(*) FROM public.pemilih`);

  console.log(`TPS in new DB: ${countTps.rows[0].count}`);
  console.log(`Petugas in new DB: ${countPetugas.rows[0].count}`);
  console.log(`Pemilih in new DB: ${countPemilih.rows[0].count}`);

  await oldDb.end();
  await newDb.end();
  console.log("Migration complete successfully!");
}

migrate().catch(console.error);
