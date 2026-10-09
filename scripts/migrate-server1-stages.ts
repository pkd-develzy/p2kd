import * as dotenv from "dotenv";
dotenv.config();
import { Client } from "pg";

async function runServer1Migration() {
  const pgUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!pgUrl) return;

  console.log("Connecting to PostgreSQL Server 1...");
  const client = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query("BEGIN;");
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    console.log("Updating Server 1 public.pemilih schema...");
    await client.query(`
      ALTER TABLE public.pemilih 
        ALTER COLUMN tahap SET DEFAULT 'CALON_DPS';

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS sumber_data character varying NOT NULL DEFAULT 'REGULER';

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS dps_at timestamp with time zone NULL;

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS dpshp_at timestamp with time zone NULL;

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS dpt_at timestamp with time zone NULL;

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS is_dpshp_verified boolean NOT NULL DEFAULT false;

      CREATE INDEX IF NOT EXISTS idx_pemilih_sumber_data ON public.pemilih USING btree (sumber_data);
      CREATE INDEX IF NOT EXISTS idx_pemilih_tahap_aktif ON public.pemilih USING btree (tahap, status_aktif);
    `);

    console.log("Creating Server 1 public.pemilih_pembenahan_dpshp table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.pemilih_pembenahan_dpshp (
        id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
        pemilih_id text NOT NULL REFERENCES public.pemilih(id) ON DELETE CASCADE,
        tahap_asal character varying NOT NULL DEFAULT 'DPS',
        jenis_pembenahan character varying NOT NULL, 
        field_changed character varying NULL,
        old_value text NULL,
        new_value text NULL,
        alasan text NOT NULL,
        status_validasi character varying NOT NULL DEFAULT 'PENDING',
        is_eligible_dpshp boolean NOT NULL DEFAULT false,
        petugas_pengusul text NOT NULL,
        petugas_pemvalidasi text NULL,
        validated_at timestamp with time zone NULL,
        metadata jsonb NULL DEFAULT '{}'::jsonb,
        created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_pembenahan_pemilih ON public.pemilih_pembenahan_dpshp USING btree (pemilih_id);
      CREATE INDEX IF NOT EXISTS idx_pembenahan_validasi ON public.pemilih_pembenahan_dpshp USING btree (status_validasi, is_eligible_dpshp);
      CREATE INDEX IF NOT EXISTS idx_pembenahan_created_at ON public.pemilih_pembenahan_dpshp USING btree (created_at);

      ALTER TABLE public.pemilih_pembenahan_dpshp ENABLE ROW LEVEL SECURITY;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pemilih_pembenahan_dpshp' AND policyname = 'service_role_all') THEN
          CREATE POLICY "service_role_all" ON public.pemilih_pembenahan_dpshp FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pemilih_pembenahan_dpshp' AND policyname = 'Allow public read pembenahan') THEN
          CREATE POLICY "Allow public read pembenahan" ON public.pemilih_pembenahan_dpshp FOR SELECT TO anon, authenticated USING (true);
        END IF;
      END $$;
    `);

    console.log("Creating Server 1 public.pemilih_riwayat_tahap table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.pemilih_riwayat_tahap (
        id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
        pemilih_id text NOT NULL REFERENCES public.pemilih(id) ON DELETE CASCADE,
        tahap_asal character varying NOT NULL,
        tahap_tujuan character varying NOT NULL,
        alasan text NOT NULL,
        petugas text NOT NULL DEFAULT 'SYSTEM',
        role_petugas text NOT NULL DEFAULT 'PANITIA',
        batch_ref text NULL,
        metadata jsonb NULL DEFAULT '{}'::jsonb,
        created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_riwayat_tahap_pemilih ON public.pemilih_riwayat_tahap USING btree (pemilih_id);
      CREATE INDEX IF NOT EXISTS idx_riwayat_tahap_transisi ON public.pemilih_riwayat_tahap USING btree (tahap_asal, tahap_tujuan);
      CREATE INDEX IF NOT EXISTS idx_riwayat_tahap_created ON public.pemilih_riwayat_tahap USING btree (created_at);

      ALTER TABLE public.pemilih_riwayat_tahap ENABLE ROW LEVEL SECURITY;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pemilih_riwayat_tahap' AND policyname = 'service_role_all') THEN
          CREATE POLICY "service_role_all" ON public.pemilih_riwayat_tahap FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pemilih_riwayat_tahap' AND policyname = 'Allow public read riwayat_tahap') THEN
          CREATE POLICY "Allow public read riwayat_tahap" ON public.pemilih_riwayat_tahap FOR SELECT TO anon, authenticated USING (true);
        END IF;
      END $$;
    `);

    console.log("Migrating Server 1 existing voter stages to CALON_DPS...");
    const updateRes = await client.query(`
      UPDATE public.pemilih
      SET 
        tahap = 'CALON_DPS',
        sumber_data = COALESCE(sumber_data, 'REGULER')
      WHERE tahap = 'DPS' OR tahap IS NULL OR tahap = '';
    `);
    console.log(`Server 1 updated ${updateRes.rowCount} voters to CALON_DPS.`);

    console.log("Updating Server 1 public.statistik_pemilih schema...");
    await client.query(`
      ALTER TABLE public.statistik_pemilih
        ADD COLUMN IF NOT EXISTS dpshp integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS dpshp_dibenahi integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS dptb integer NOT NULL DEFAULT 0;
    `);

    console.log("Updating Server 1 recalculate_statistik_pemilih function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.recalculate_statistik_pemilih()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      DECLARE
        v_total_terdaftar integer;
        v_total_aktif integer;
        v_calon_dps integer;
        v_dps integer;
        v_dpshp integer;
        v_dpshp_dibenahi integer;
        v_dpt integer;
        v_dptb integer;
        v_total_laki integer;
        v_total_perempuan integer;
        v_total_tms integer;
        v_total_disabilitas integer;
        v_coklit_selesai integer;
        v_breakdown_tabung jsonb;
      BEGIN
        -- Total Terdaftar
        SELECT count(*) INTO v_total_terdaftar FROM public.pemilih;
        
        -- Total Aktif
        SELECT count(*) INTO v_total_aktif FROM public.pemilih WHERE status_aktif = 'AKTIF';
        
        -- 1. CALON DPS: Pemilih aktif pada tahap Calon DPS (belum ditetapkan pleno DPS)
        SELECT count(*) INTO v_calon_dps FROM public.pemilih 
        WHERE status_aktif = 'AKTIF' AND UPPER(COALESCE(tahap, 'CALON_DPS')) = 'CALON_DPS';
        
        -- 2. DPS: Pemilih aktif yang sah ditetapkan sebagai DPS
        SELECT count(*) INTO v_dps FROM public.pemilih 
        WHERE status_aktif = 'AKTIF' AND UPPER(COALESCE(tahap, '')) = 'DPS';

        -- 3. DPSHP DIBENAHI: Jumlah pemilih unik di tahap DPS/DPSHP yang memiliki pembenahan sah & valid
        SELECT count(DISTINCT pemilih_id) INTO v_dpshp_dibenahi 
        FROM public.pemilih_pembenahan_dpshp
        WHERE status_validasi = 'VALID' AND is_eligible_dpshp = true;

        -- 4. DPSHP DITETAPKAN: Pemilih aktif yang telah ditetapkan ke tahap DPSHP
        SELECT count(*) INTO v_dpshp FROM public.pemilih 
        WHERE status_aktif = 'AKTIF' AND UPPER(COALESCE(tahap, '')) = 'DPSHP';
        
        -- 5. DPT: Pemilih aktif yang telah sah ditetapkan dalam Berita Acara Pleno DPT Final
        SELECT count(*) INTO v_dpt FROM public.pemilih 
        WHERE status_aktif = 'AKTIF' AND UPPER(COALESCE(tahap, '')) = 'DPT';

        -- 6. DPTb / Pemilih Tambahan: Pemilih dengan sumber data DPTb
        SELECT count(*) INTO v_dptb FROM public.pemilih 
        WHERE UPPER(COALESCE(sumber_data, '')) = 'DPTB';
        
        -- Agregat Demografis
        SELECT count(*) INTO v_total_laki FROM public.pemilih 
        WHERE status_aktif = 'AKTIF' AND jenis_kelamin ILIKE 'L%';
        
        SELECT count(*) INTO v_total_perempuan FROM public.pemilih 
        WHERE status_aktif = 'AKTIF' AND jenis_kelamin ILIKE 'P%';
        
        SELECT count(*) INTO v_total_tms FROM public.pemilih 
        WHERE status_aktif = 'TMS';
        
        -- Disabilitas: Hanya menghitung jika valid
        SELECT count(*) INTO v_total_disabilitas FROM public.pemilih 
        WHERE status_aktif = 'AKTIF' 
          AND disabilitas IS NOT NULL 
          AND TRIM(disabilitas) != '' 
          AND UPPER(TRIM(disabilitas)) NOT IN ('TIDAK', 'BUKAN', '0', 'NULL', 'NORMAL', '-');
        
        -- Coklit Selesai
        SELECT count(*) INTO v_coklit_selesai FROM public.pemilih 
        WHERE coklit_status IS NOT NULL 
          AND TRIM(coklit_status) != '' 
          AND UPPER(TRIM(coklit_status)) NOT IN ('BELUM_COKLIT', 'BELUM', '');

        -- Breakdown Agregat per Tabung Pemilihan (13 RW Desa Kalisalak)
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'nomorRw', LPAD(REGEXP_REPLACE(t.nomor_tps, '\\D', '', 'g'), 2, '0'),
            'namaWilayah', 'Wilayah RW ' || LPAD(REGEXP_REPLACE(t.nomor_tps, '\\D', '', 'g'), 2, '0'),
            'namaTabung', COALESCE(t.nama_tabung, 'Tabung Pemilihan ' || LPAD(REGEXP_REPLACE(t.nomor_tps, '\\D', '', 'g'), 2, '0')),
            'cakupanWilayah', 'RW ' || LPAD(REGEXP_REPLACE(t.nomor_tps, '\\D', '', 'g'), 2, '0') || ' (' || COALESCE(NULLIF(t.rt, ''), 'RT 01, 02, 03') || ')',
            'pusatLokasi', 'Desa Kalisalak',
            'total', COALESCE(agg.total, 0),
            'laki', COALESCE(agg.laki, 0),
            'perempuan', COALESCE(agg.perempuan, 0),
            'calonDps', COALESCE(agg.calon_dps, 0),
            'dps', COALESCE(agg.dps, 0),
            'dpshp', COALESCE(agg.dpshp, 0),
            'dpTambahan', COALESCE(agg.dp_tambahan, 0),
            'dpt', COALESCE(agg.dpt, 0),
            'rt', COALESCE(t.rt, 'RT 01, 02, 03'),
            'rw', 'RW ' || LPAD(REGEXP_REPLACE(t.nomor_tps, '\\D', '', 'g'), 2, '0')
          ) ORDER BY LPAD(REGEXP_REPLACE(t.nomor_tps, '\\D', '', 'g'), 2, '0') ASC
        ) INTO v_breakdown_tabung
        FROM public.tps t
        LEFT JOIN (
          SELECT 
            'RW ' || LPAD(REGEXP_REPLACE(rw, '\\D', '', 'g'), 2, '0') as rw_key,
            COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE jenis_kelamin ILIKE 'L%')::int as laki,
            COUNT(*) FILTER (WHERE jenis_kelamin ILIKE 'P%')::int as perempuan,
            COUNT(*) FILTER (WHERE UPPER(COALESCE(tahap, 'CALON_DPS')) = 'CALON_DPS')::int as calon_dps,
            COUNT(*) FILTER (WHERE UPPER(COALESCE(tahap, '')) = 'DPS')::int as dps,
            COUNT(*) FILTER (WHERE UPPER(COALESCE(tahap, '')) = 'DPSHP')::int as dpshp,
            COUNT(*) FILTER (WHERE UPPER(COALESCE(sumber_data, '')) = 'DPTB')::int as dp_tambahan,
            COUNT(*) FILTER (WHERE UPPER(COALESCE(tahap, '')) = 'DPT')::int as dpt
          FROM public.pemilih
          WHERE status_aktif = 'AKTIF'
          GROUP BY 1
        ) agg ON ('RW ' || LPAD(REGEXP_REPLACE(t.nomor_tps, '\\D', '', 'g'), 2, '0')) = agg.rw_key;

        -- Upsert ke Master Tabel statistik_pemilih
        INSERT INTO public.statistik_pemilih (
          id, calon_dps, dps, dpshp, dpshp_dibenahi, dpt, dptb,
          dp_tambahan, pemilih_tambahan,
          total_pemilih, total_terdaftar, total_aktif, total_laki, total_perempuan,
          total_tms, total_disabilitas, coklit_selesai,
          breakdown_rw, breakdown_tabung, updated_at, calculated_by
        ) VALUES (
          'main', v_calon_dps, v_dps, v_dpshp, v_dpshp_dibenahi, v_dpt, v_dptb,
          v_dptb, v_dptb,
          v_total_aktif, v_total_terdaftar, v_total_aktif, v_total_laki, v_total_perempuan,
          v_total_tms, v_total_disabilitas, v_coklit_selesai,
          COALESCE(v_breakdown_tabung, '[]'::jsonb), COALESCE(v_breakdown_tabung, '[]'::jsonb),
          CURRENT_TIMESTAMP, 'POSTGRESQL_TRIGGER'
        )
        ON CONFLICT (id) DO UPDATE SET
          calon_dps = EXCLUDED.calon_dps,
          dps = EXCLUDED.dps,
          dpshp = EXCLUDED.dpshp,
          dpshp_dibenahi = EXCLUDED.dpshp_dibenahi,
          dpt = EXCLUDED.dpt,
          dptb = EXCLUDED.dptb,
          dp_tambahan = EXCLUDED.dp_tambahan,
          pemilih_tambahan = EXCLUDED.pemilih_tambahan,
          total_pemilih = EXCLUDED.total_pemilih,
          total_terdaftar = EXCLUDED.total_terdaftar,
          total_aktif = EXCLUDED.total_aktif,
          total_laki = EXCLUDED.total_laki,
          total_perempuan = EXCLUDED.total_perempuan,
          total_tms = EXCLUDED.total_tms,
          total_disabilitas = EXCLUDED.total_disabilitas,
          coklit_selesai = EXCLUDED.coklit_selesai,
          breakdown_rw = EXCLUDED.breakdown_rw,
          breakdown_tabung = EXCLUDED.breakdown_tabung,
          updated_at = CURRENT_TIMESTAMP,
          calculated_by = EXCLUDED.calculated_by;
      END;
      $func$;
    `);

    console.log("Recalculating Server 1 statistics...");
    await client.query(`SELECT public.recalculate_statistik_pemilih();`);

    await client.query("COMMIT;");
    console.log("SERVER 1 MIGRATION COMPLETED SUCCESSFULLY!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Server 1 migration failed:", err);
    throw err;
  } finally {
    await client.end();
  }
}

runServer1Migration().catch((err) => {
  console.error("Fatal Server 1 migration error:", err);
  process.exit(1);
});
