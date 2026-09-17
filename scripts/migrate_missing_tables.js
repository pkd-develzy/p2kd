require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('--- STARTING COMPREHENSIVE DATABASE FIX ---');
  await client.connect();

  // 1. Add missing columns to web_config
  console.log('1. Adding missing columns to web_config...');
  await client.query(`
    ALTER TABLE public.web_config
    ADD COLUMN IF NOT EXISTS sk_p2kd text,
    ADD COLUMN IF NOT EXISTS sk_penetapan_balon text,
    ADD COLUMN IF NOT EXISTS sk_penetapan_calon text,
    ADD COLUMN IF NOT EXISTS sk_penetapan_dpt text,
    ADD COLUMN IF NOT EXISTS perbup_pilkades text;
  `);

  // Update default values for web_config if null
  await client.query(`
    UPDATE public.web_config
    SET 
      sk_p2kd = COALESCE(sk_p2kd, 'Keputusan BPD Desa Kalisalak No. 04/BPD-KLS/VII/2026'),
      sk_penetapan_balon = COALESCE(sk_penetapan_balon, 'Keputusan P2KD No. 05/P2KD-KLS/VIII/2026'),
      sk_penetapan_calon = COALESCE(sk_penetapan_calon, 'Keputusan P2KD No. 06/P2KD-KLS/IX/2026'),
      sk_penetapan_dpt = COALESCE(sk_penetapan_dpt, 'Berita Acara & Keputusan P2KD No. 07/BA-DPT/X/2026'),
      perbup_pilkades = COALESCE(perbup_pilkades, 'Perda No. 2/2015 & Perbup Tegal No. 27/2018 jo PP No. 16/2026')
    WHERE id = 'main_config';
  `);
  console.log('   [OK] web_config updated.');

  // 2. Create balon_penjaringan table
  console.log('2. Creating table balon_penjaringan...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.balon_penjaringan (
      id text PRIMARY KEY,
      nama_lengkap character varying NOT NULL,
      nik character varying NOT NULL,
      tempat_tanggal_lahir character varying,
      alamat_domisili text,
      pendidikan_terakhir character varying,
      pekerjaan character varying,
      tanggal_pendaftaran character varying,
      status_berkas character varying DEFAULT 'MENUNGGU',
      kelengkapan jsonb,
      catatan_penjaringan text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
    ALTER TABLE public.balon_penjaringan ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read balon_penjaringan" ON public.balon_penjaringan;
    DROP POLICY IF EXISTS "Allow all service_role balon_penjaringan" ON public.balon_penjaringan;
    CREATE POLICY "Allow public read balon_penjaringan" ON public.balon_penjaringan FOR SELECT TO anon, authenticated USING (true);
    GRANT ALL ON public.balon_penjaringan TO anon, authenticated, service_role;
  `);
  console.log('   [OK] balon_penjaringan ready.');

  // 3. Create kandidat_kades table
  console.log('3. Creating table kandidat_kades...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.kandidat_kades (
      id text PRIMARY KEY,
      nomor_urut integer NOT NULL,
      nama_lengkap character varying NOT NULL,
      gelar_depan character varying,
      gelar_belakang character varying,
      tempat_tanggal_lahir character varying,
      pendidikan_terakhir character varying,
      pekerjaan character varying,
      tagline character varying,
      visi text,
      misi jsonb,
      program_unggulan jsonb,
      foto_url text,
      warna_tema character varying,
      status_verifikasi character varying DEFAULT 'MEMENUHI_SYARAT',
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
    ALTER TABLE public.kandidat_kades ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read kandidat_kades" ON public.kandidat_kades;
    DROP POLICY IF EXISTS "Allow all service_role kandidat_kades" ON public.kandidat_kades;
    CREATE POLICY "Allow public read kandidat_kades" ON public.kandidat_kades FOR SELECT TO anon, authenticated USING (true);
    GRANT ALL ON public.kandidat_kades TO anon, authenticated, service_role;
  `);
  console.log('   [OK] kandidat_kades ready.');

  // 4. Create tps_vote_counts table & view
  console.log('4. Creating table tps_vote_counts...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.tps_vote_counts (
      id text PRIMARY KEY,
      tps_id text,
      nomor_tps character varying NOT NULL UNIQUE,
      nama_tps character varying,
      lokasi character varying,
      total_dpt integer DEFAULT 0,
      suara_masuk integer DEFAULT 0,
      suara_sah integer DEFAULT 0,
      suara_tidak_sah integer DEFAULT 0,
      suara_kandidat jsonb,
      status_pleno_tps character varying DEFAULT 'BELUM_MULAI',
      waktu_input timestamp with time zone,
      petugas_input character varying,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
    ALTER TABLE public.tps_vote_counts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read tps_vote_counts" ON public.tps_vote_counts;
    DROP POLICY IF EXISTS "Allow all service_role tps_vote_counts" ON public.tps_vote_counts;
    CREATE POLICY "Allow public read tps_vote_counts" ON public.tps_vote_counts FOR SELECT TO anon, authenticated USING (true);
    GRANT ALL ON public.tps_vote_counts TO anon, authenticated, service_role;

    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'tps_vote_count') THEN
        ALTER VIEW public.tps_vote_count SET (security_invoker = true);
      END IF;
    END $$;
  `);
  console.log('   [OK] tps_vote_counts ready.');

  // 5. Seed initial row for tahapan if empty
  console.log('5. Ensuring tahapan initial state...');
  await client.query(`
    INSERT INTO public.tahapan (
      id, kode_tahapan, nama_tahapan, kategori, status, is_locked, nomor_berita_acara, created_at, updated_at
    ) VALUES (
      'thp-penetapan-dpt',
      'THP-PENETAPAN-DPT',
      'Penetapan Daftar Pemilih Tetap (DPT)',
      'PENETAPAN',
      'DRAFT',
      false,
      'BA/01/P2KD-KLS/XII/2026',
      now(),
      now()
    ) ON CONFLICT (id) DO NOTHING;
    GRANT ALL ON public.tahapan TO anon, authenticated, service_role;
  `);
  console.log('   [OK] tahapan seeded.');

  // 6. Ensure pendaftaran_petugas_dpt permissions
  console.log('6. Ensuring pendaftaran_petugas_dpt permissions...');
  await client.query(`
    GRANT ALL ON public.pendaftaran_petugas_dpt TO anon, authenticated, service_role;
    DROP POLICY IF EXISTS "allow_all_ops" ON public.pendaftaran_petugas_dpt;
    DROP POLICY IF EXISTS "anon_insert_petugas" ON public.pendaftaran_petugas_dpt;
    DROP POLICY IF EXISTS "Allow all service_role pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt;
    DROP POLICY IF EXISTS "Allow anon insert pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt;
    DROP POLICY IF EXISTS "Allow read pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt;
    
    CREATE POLICY "Allow anon insert pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt FOR INSERT TO anon, authenticated WITH CHECK (nama_lengkap IS NOT NULL AND nik IS NOT NULL);
    CREATE POLICY "Allow read pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt FOR SELECT TO anon, authenticated USING (true);
  `);
  console.log('   [OK] pendaftaran_petugas_dpt permissions ready.');

  await client.end();
  console.log('--- ALL DATABASE MIGRATIONS COMPLETED SUCCESSFULLY ---');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
