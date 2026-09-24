import { Client } from "pg";

const server1Url = "postgresql://postgres.apiastdpwrycnsbskpmy:Muh4mm4dkhul4l.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";
const server3Url = "postgresql://postgres.msrefdzbexmkputwbyjc:Muh4mm4dkhul4l.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function testAndMigrateServer3() {
  console.log("Connecting to Server 1 and Server 3...");
  const db1 = new Client({ connectionString: server1Url, ssl: { rejectUnauthorized: false } });
  const db3 = new Client({ connectionString: server3Url, ssl: { rejectUnauthorized: false } });

  await db1.connect();
  await db3.connect();
  console.log("Connected successfully to Server 1 and Server 3!");

  // Step 1: Create Tables on Server 3
  console.log("Creating tables on Server 3 (Panitia, Calon Kades, Real Count, Audit)...");
  await db3.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 1. Anggota P2KD (Akun Panitia & Login)
    CREATE TABLE IF NOT EXISTS public.anggota_p2kd (
      id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
      nama_lengkap character varying NOT NULL,
      nik character varying NOT NULL,
      jabatan character varying NOT NULL,
      seksi character varying NOT NULL,
      seksi_label character varying NOT NULL,
      username character varying NOT NULL,
      role character varying NOT NULL,
      kontak_wa character varying NOT NULL,
      alamat_dusun character varying NOT NULL,
      assigned_tps character varying NULL,
      status character varying NOT NULL DEFAULT 'AKTIF'::character varying,
      sk_penetapan character varying NOT NULL,
      foto_url text NULL,
      password_hash text NULL,
      created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_anggota_username ON public.anggota_p2kd USING btree (username);
    CREATE INDEX IF NOT EXISTS idx_anggota_role ON public.anggota_p2kd USING btree (role);

    -- 2. Balon Penjaringan (Seksi 2: Bakal Calon Kades)
    CREATE TABLE IF NOT EXISTS public.balon_penjaringan (
      id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
      nama_lengkap character varying NOT NULL,
      nik character varying NOT NULL,
      tempat_tanggal_lahir character varying NOT NULL,
      alamat_domisili text NOT NULL,
      pendidikan_terakhir character varying NOT NULL,
      pekerjaan character varying NOT NULL,
      tanggal_pendaftaran date NOT NULL,
      status_berkas character varying NOT NULL DEFAULT 'DIVERIFIKASI'::character varying,
      kelengkapan jsonb NULL,
      catatan_penjaringan text NULL,
      created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Kandidat Kades (Seksi 2: Calon Resmi Pilkades)
    CREATE TABLE IF NOT EXISTS public.kandidat_kades (
      id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
      nomor_urut integer NOT NULL,
      nama_lengkap character varying NOT NULL,
      gelar_depan character varying NULL,
      gelar_belakang character varying NULL,
      tempat_tanggal_lahir character varying NOT NULL,
      pendidikan_terakhir character varying NOT NULL,
      pekerjaan character varying NOT NULL,
      tagline text NOT NULL,
      visi text NOT NULL,
      misi text[] NULL,
      program_unggulan text[] NULL,
      foto_url text NOT NULL,
      warna_tema character varying NULL,
      status_verifikasi character varying NOT NULL DEFAULT 'MEMENUHI_SYARAT'::character varying,
      created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_kandidat_nomor_urut ON public.kandidat_kades USING btree (nomor_urut);

    -- 4. TPS Vote Counts (Seksi 3: Real Count Pleno Pilkades)
    CREATE TABLE IF NOT EXISTS public.tps_vote_counts (
      id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
      tps_id text NULL,
      nomor_tps character varying NOT NULL,
      nama_tps character varying NOT NULL,
      lokasi character varying NOT NULL,
      total_dpt integer NOT NULL DEFAULT 0,
      suara_masuk integer NOT NULL DEFAULT 0,
      suara_sah integer NOT NULL DEFAULT 0,
      suara_tidak_sah integer NOT NULL DEFAULT 0,
      suara_kandidat jsonb NULL,
      status_pleno_tps character varying NOT NULL DEFAULT 'BELUM_MULAI'::character varying,
      waktu_input timestamp with time zone NULL,
      petugas_input character varying NULL,
      created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_vote_counts_nomor ON public.tps_vote_counts USING btree (nomor_tps);

    -- 5. Audit Logs
    CREATE TABLE IF NOT EXISTS public.audit_logs (
      id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
      aksi character varying NOT NULL,
      entity character varying NULL,
      target character varying NULL,
      detail text NOT NULL,
      user_name character varying NOT NULL,
      role character varying NOT NULL,
      ip_address character varying NULL,
      created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs USING btree (created_at DESC);

    -- RLS Policies
    ALTER TABLE public.anggota_p2kd ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.balon_penjaringan ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kandidat_kades ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tps_vote_counts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'anggota_p2kd' AND policyname = 'service_role_all') THEN
        CREATE POLICY "service_role_all" ON public.anggota_p2kd FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'anggota_p2kd' AND policyname = 'Allow public read anggota') THEN
        CREATE POLICY "Allow public read anggota" ON public.anggota_p2kd FOR SELECT TO anon, authenticated USING (true);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'balon_penjaringan' AND policyname = 'service_role_all') THEN
        CREATE POLICY "service_role_all" ON public.balon_penjaringan FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'balon_penjaringan' AND policyname = 'Allow public read balon') THEN
        CREATE POLICY "Allow public read balon" ON public.balon_penjaringan FOR SELECT TO anon, authenticated USING (true);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kandidat_kades' AND policyname = 'service_role_all') THEN
        CREATE POLICY "service_role_all" ON public.kandidat_kades FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kandidat_kades' AND policyname = 'Allow public read kandidat') THEN
        CREATE POLICY "Allow public read kandidat" ON public.kandidat_kades FOR SELECT TO anon, authenticated USING (true);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tps_vote_counts' AND policyname = 'service_role_all') THEN
        CREATE POLICY "service_role_all" ON public.tps_vote_counts FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tps_vote_counts' AND policyname = 'Allow public read vote_counts') THEN
        CREATE POLICY "Allow public read vote_counts" ON public.tps_vote_counts FOR SELECT TO anon, authenticated USING (true);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'service_role_all') THEN
        CREATE POLICY "service_role_all" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Allow read audit_logs') THEN
        CREATE POLICY "Allow read audit_logs" ON public.audit_logs FOR SELECT TO anon, authenticated USING (true);
      END IF;
    END $$;
  `);
  console.log("Schema, tables, indexes, and RLS policies on Server 3 created successfully!");

  // Helper for copy
  async function copyTable(tableName: string) {
    const rows = await db1.query(`SELECT * FROM public."${tableName}"`);
    console.log(`Copying ${rows.rows.length} rows from ${tableName}...`);
    for (const row of rows.rows) {
      const keys = Object.keys(row);
      const cols = keys.map(k => `"${k}"`).join(", ");
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = Object.values(row);
      await db3.query(`
        INSERT INTO public."${tableName}" (${cols}) VALUES (${placeholders})
        ON CONFLICT (id) DO NOTHING;
      `, values);
    }
    console.log(`Table ${tableName} successfully copied.`);
  }

  await copyTable("anggota_p2kd");
  await copyTable("balon_penjaringan");
  await copyTable("kandidat_kades");
  await copyTable("tps_vote_counts");
  await copyTable("audit_logs");

  console.log("\n================ VERIFICATION SERVER 3 ================");
  const cAnggota = await db3.query(`SELECT count(*) FROM public.anggota_p2kd`);
  const cBalon = await db3.query(`SELECT count(*) FROM public.balon_penjaringan`);
  const cKandidat = await db3.query(`SELECT count(*) FROM public.kandidat_kades`);
  const cVote = await db3.query(`SELECT count(*) FROM public.tps_vote_counts`);
  const cAudit = await db3.query(`SELECT count(*) FROM public.audit_logs`);

  console.log(`Anggota P2KD on Server 3: ${cAnggota.rows[0].count}`);
  console.log(`Balon Penjaringan on Server 3: ${cBalon.rows[0].count}`);
  console.log(`Kandidat Kades on Server 3: ${cKandidat.rows[0].count}`);
  console.log(`TPS Vote Counts on Server 3: ${cVote.rows[0].count}`);
  console.log(`Audit Logs on Server 3: ${cAudit.rows[0].count}`);

  await db1.end();
  await db3.end();
  console.log("\nServer 3 migration finished successfully!");
}

testAndMigrateServer3().catch(console.error);
