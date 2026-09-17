require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const remediationSQL = `
-- 1. Fix SECURITY DEFINER View
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'tps_vote_count'
  ) THEN
    ALTER VIEW public.tps_vote_count SET (security_invoker = true);
  END IF;
END $$;

-- 2. Fix Permissive RLS Policies on Tables

-- 2.1 aduan_pemilih
ALTER TABLE public.aduan_pemilih ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ops" ON public.aduan_pemilih;
DROP POLICY IF EXISTS "Allow anon insert aduan_pemilih" ON public.aduan_pemilih;
DROP POLICY IF EXISTS "Allow public read aduan_pemilih" ON public.aduan_pemilih;

CREATE POLICY "Allow anon insert aduan_pemilih" 
ON public.aduan_pemilih 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (nama_pelapor IS NOT NULL AND isi_aduan IS NOT NULL);

CREATE POLICY "Allow public read aduan_pemilih" 
ON public.aduan_pemilih 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.2 anggota_p2kd
ALTER TABLE public.anggota_p2kd ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ops" ON public.anggota_p2kd;
DROP POLICY IF EXISTS "Allow public read anggota_p2kd" ON public.anggota_p2kd;

CREATE POLICY "Allow public read anggota_p2kd" 
ON public.anggota_p2kd 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.3 audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ops" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public read audit_logs" ON public.audit_logs;

-- 2.4 balon_penjaringan
ALTER TABLE public.balon_penjaringan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all service_role balon_penjaringan" ON public.balon_penjaringan;
DROP POLICY IF EXISTS "allow_all_ops" ON public.balon_penjaringan;
DROP POLICY IF EXISTS "Allow public read balon_penjaringan" ON public.balon_penjaringan;

CREATE POLICY "Allow public read balon_penjaringan" 
ON public.balon_penjaringan 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.5 kandidat_kades
ALTER TABLE public.kandidat_kades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all service_role kandidat_kades" ON public.kandidat_kades;
DROP POLICY IF EXISTS "allow_all_ops" ON public.kandidat_kades;
DROP POLICY IF EXISTS "Allow public read kandidat_kades" ON public.kandidat_kades;

CREATE POLICY "Allow public read kandidat_kades" 
ON public.kandidat_kades 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.6 pemilih
ALTER TABLE public.pemilih ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ops" ON public.pemilih;
DROP POLICY IF EXISTS "Allow public read pemilih" ON public.pemilih;

CREATE POLICY "Allow public read pemilih" 
ON public.pemilih 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.7 pendaftaran_petugas_dpt
ALTER TABLE public.pendaftaran_petugas_dpt ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all service_role pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt;
DROP POLICY IF EXISTS "Allow anon insert pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt;
DROP POLICY IF EXISTS "allow_all_ops" ON public.pendaftaran_petugas_dpt;
DROP POLICY IF EXISTS "anon_insert_petugas" ON public.pendaftaran_petugas_dpt;
DROP POLICY IF EXISTS "Allow read pendaftaran_petugas_dpt" ON public.pendaftaran_petugas_dpt;

CREATE POLICY "Allow anon insert pendaftaran_petugas_dpt" 
ON public.pendaftaran_petugas_dpt 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (nama_lengkap IS NOT NULL AND nik IS NOT NULL);

CREATE POLICY "Allow read pendaftaran_petugas_dpt" 
ON public.pendaftaran_petugas_dpt 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.8 pengumuman
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ops" ON public.pengumuman;
DROP POLICY IF EXISTS "Allow public read pengumuman" ON public.pengumuman;

CREATE POLICY "Allow public read pengumuman" 
ON public.pengumuman 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.9 tahapan
ALTER TABLE public.tahapan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ops" ON public.tahapan;
DROP POLICY IF EXISTS "Allow public read tahapan" ON public.tahapan;

CREATE POLICY "Allow public read tahapan" 
ON public.tahapan 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.10 tps
ALTER TABLE public.tps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ops" ON public.tps;
DROP POLICY IF EXISTS "Allow public read tps" ON public.tps;

CREATE POLICY "Allow public read tps" 
ON public.tps 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.11 tps_vote_counts
ALTER TABLE public.tps_vote_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all service_role tps_vote_counts" ON public.tps_vote_counts;
DROP POLICY IF EXISTS "allow_all_ops" ON public.tps_vote_counts;
DROP POLICY IF EXISTS "Allow public read tps_vote_counts" ON public.tps_vote_counts;

CREATE POLICY "Allow public read tps_vote_counts" 
ON public.tps_vote_counts 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2.12 web_config
ALTER TABLE public.web_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ops" ON public.web_config;
DROP POLICY IF EXISTS "Allow public read web_config" ON public.web_config;

CREATE POLICY "Allow public read web_config" 
ON public.web_config 
FOR SELECT 
TO anon, authenticated 
USING (true);
`;

async function applyFixes() {
  console.log('Connecting to PostgreSQL database...');
  await client.connect();
  console.log('Applying security & RLS remediation script...');
  await client.query(remediationSQL);
  console.log('Security fixes applied successfully!');
  await client.end();
}

applyFixes().catch((err) => {
  console.error('Error applying security fixes:', err);
  process.exit(1);
});
