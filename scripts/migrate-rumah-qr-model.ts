import * as dotenv from "dotenv";
dotenv.config();
import { Client } from "pg";
import crypto from "crypto";

export async function runMigration() {
  const pgUrl = process.env.DIRECT_SEKSI1_URL || process.env.DATABASE_SEKSI1_URL;
  if (!pgUrl) {
    throw new Error("DATABASE_SEKSI1_URL / DIRECT_SEKSI1_URL tidak ditemukan dalam konfigurasi!");
  }

  console.log("==================================================================");
  console.log("MIGRASI MODEL DATABASE P2KD KALISALAK:");
  console.log("1 QR CODE = 1 RUMAH = BANYAK KK = BANYAK ANGGOTA KELUARGA");
  console.log("==================================================================");
  console.log("Menghubungkan ke PostgreSQL Seksi 1 Database...");

  const client = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Koneksi berhasil!");

  try {
    await client.query("BEGIN;");

    // 1. Ekstensi pgcrypto
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 2. Buat tabel qr_rumah (Master Identitas QR Fisik Rumah)
    console.log("1. Membuat tabel public.qr_rumah...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.qr_rumah (
        id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
        qr_token text NOT NULL UNIQUE,
        status text NOT NULL DEFAULT 'UNASSIGNED',
        batch_ref text NULL,
        assigned_tps text NULL,
        assigned_rw text NULL,
        assigned_petugas text NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_qr_rumah_token ON public.qr_rumah USING btree (qr_token);
      CREATE INDEX IF NOT EXISTS idx_qr_rumah_status ON public.qr_rumah USING btree (status);
      CREATE INDEX IF NOT EXISTS idx_qr_rumah_rw ON public.qr_rumah USING btree (assigned_rw);
    `);

    // 3. Buat tabel rumah (Master Entitas Fisik Rumah)
    console.log("2. Membuat tabel public.rumah...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.rumah (
        id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
        qr_id text NULL REFERENCES public.qr_rumah(id) ON DELETE SET NULL,
        qr_token text NULL UNIQUE,
        nomor_rumah text NULL,
        alamat text NOT NULL,
        rt text NOT NULL,
        rw text NOT NULL,
        desa text NULL DEFAULT 'Kalisalak',
        kecamatan text NULL DEFAULT 'Margasari',
        tps text NULL,
        koordinat_lat double precision NULL,
        koordinat_lng double precision NULL,
        keterangan_lokasi text NULL,
        status_pendataan text NOT NULL DEFAULT 'BELUM_DIDATA',
        petugas_pendata text NULL,
        petugas_id text NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_rumah_qr_id ON public.rumah USING btree (qr_id);
      CREATE INDEX IF NOT EXISTS idx_rumah_qr_token ON public.rumah USING btree (qr_token);
      CREATE INDEX IF NOT EXISTS idx_rumah_rt_rw ON public.rumah USING btree (rt, rw);
      CREATE INDEX IF NOT EXISTS idx_rumah_status ON public.rumah USING btree (status_pendataan);
      CREATE INDEX IF NOT EXISTS idx_rumah_tps ON public.rumah USING btree (tps);
    `);

    // 4. Buat tabel kartu_keluarga (Entitas Kartu Keluarga di dalam Rumah)
    console.log("3. Membuat tabel public.kartu_keluarga...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.kartu_keluarga (
        id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
        rumah_id text NULL REFERENCES public.rumah(id) ON DELETE SET NULL,
        no_kk text NOT NULL UNIQUE,
        kepala_keluarga_nama text NOT NULL,
        alamat text NULL,
        rt text NULL,
        rw text NULL,
        status_kk text NOT NULL DEFAULT 'AKTIF',
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_kk_rumah_id ON public.kartu_keluarga USING btree (rumah_id);
      CREATE INDEX IF NOT EXISTS idx_kk_no_kk ON public.kartu_keluarga USING btree (no_kk);
      CREATE INDEX IF NOT EXISTS idx_kk_rt_rw ON public.kartu_keluarga USING btree (rt, rw);
    `);

    // 5. Tambah kolom relasi ke rumah & KK pada tabel pemilih (Anggota Keluarga)
    console.log("4. Memperbarui tabel public.pemilih dengan kolom relasi rumah & KK...");
    await client.query(`
      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS rumah_id text NULL REFERENCES public.rumah(id) ON DELETE SET NULL;

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS kk_id text NULL REFERENCES public.kartu_keluarga(id) ON DELETE SET NULL;

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS verifikasi_status text NULL DEFAULT 'BELUM_DIVERIFIKASI';

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS verifikasi_catatan text NULL;

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS verifikasi_petugas text NULL;

      ALTER TABLE public.pemilih 
        ADD COLUMN IF NOT EXISTS verifikasi_at timestamp with time zone NULL;

      CREATE INDEX IF NOT EXISTS idx_pemilih_rumah_id ON public.pemilih USING btree (rumah_id);
      CREATE INDEX IF NOT EXISTS idx_pemilih_kk_id ON public.pemilih USING btree (kk_id);
      CREATE INDEX IF NOT EXISTS idx_pemilih_verifikasi_status ON public.pemilih USING btree (verifikasi_status);
    `);

    // 6. Buat tabel kunjungan_coklit (Entitas Kunjungan Faktual Lapangan)
    console.log("5. Membuat tabel public.kunjungan_coklit...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.kunjungan_coklit (
        id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
        rumah_id text NOT NULL REFERENCES public.rumah(id) ON DELETE CASCADE,
        qr_token text NOT NULL,
        petugas_username text NOT NULL,
        petugas_nama text NOT NULL,
        tps text NOT NULL,
        waktu_kunjungan timestamp with time zone NOT NULL DEFAULT now(),
        status_kunjungan text NOT NULL DEFAULT 'SELESAI',
        total_kk integer NOT NULL DEFAULT 1,
        total_anggota integer NOT NULL DEFAULT 0,
        anggota_sesuai integer NOT NULL DEFAULT 0,
        anggota_ubah_data integer NOT NULL DEFAULT 0,
        anggota_tms integer NOT NULL DEFAULT 0,
        anggota_belum_ditemui integer NOT NULL DEFAULT 0,
        catatan_kunjungan text NULL,
        stiker_ditempel boolean NOT NULL DEFAULT true,
        nama_stiker_manual text NULL,
        idempotency_key text NULL UNIQUE,
        sync_status text NOT NULL DEFAULT 'SYNCED',
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_kunjungan_rumah ON public.kunjungan_coklit USING btree (rumah_id);
      CREATE INDEX IF NOT EXISTS idx_kunjungan_qr ON public.kunjungan_coklit USING btree (qr_token);
      CREATE INDEX IF NOT EXISTS idx_kunjungan_petugas ON public.kunjungan_coklit USING btree (petugas_username);
      CREATE INDEX IF NOT EXISTS idx_kunjungan_waktu ON public.kunjungan_coklit USING btree (waktu_kunjungan);
    `);

    // 7. Buat tabel kunjungan_anggota_log (Log Hasil Verifikasi Masing-Masing Anggota)
    console.log("6. Membuat tabel public.kunjungan_anggota_log...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.kunjungan_anggota_log (
        id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
        kunjungan_id text NOT NULL REFERENCES public.kunjungan_coklit(id) ON DELETE CASCADE,
        pemilih_id text NOT NULL REFERENCES public.pemilih(id) ON DELETE CASCADE,
        status_verifikasi text NOT NULL,
        catatan text NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_kunjungan_log_kunjungan ON public.kunjungan_anggota_log USING btree (kunjungan_id);
      CREATE INDEX IF NOT EXISTS idx_kunjungan_log_pemilih ON public.kunjungan_anggota_log USING btree (pemilih_id);
    `);

    // 8. RLS Policies
    console.log("7. Mengatur Row Level Security (RLS)...");
    await client.query(`
      ALTER TABLE public.qr_rumah ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.rumah ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.kartu_keluarga ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.kunjungan_coklit ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.kunjungan_anggota_log ENABLE ROW LEVEL SECURITY;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qr_rumah' AND policyname = 'qr_rumah_allow_all') THEN
          CREATE POLICY qr_rumah_allow_all ON public.qr_rumah FOR ALL USING (true) WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rumah' AND policyname = 'rumah_allow_all') THEN
          CREATE POLICY rumah_allow_all ON public.rumah FOR ALL USING (true) WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kartu_keluarga' AND policyname = 'kartu_keluarga_allow_all') THEN
          CREATE POLICY kartu_keluarga_allow_all ON public.kartu_keluarga FOR ALL USING (true) WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kunjungan_coklit' AND policyname = 'kunjungan_allow_all') THEN
          CREATE POLICY kunjungan_allow_all ON public.kunjungan_coklit FOR ALL USING (true) WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kunjungan_anggota_log' AND policyname = 'kunjungan_log_allow_all') THEN
          CREATE POLICY kunjungan_log_allow_all ON public.kunjungan_anggota_log FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `);

    // 9. Batch Migrasi Data Master KK dari Tabel Pemilih Eksisting (Super Cepat dengan 1 query SQL)
    console.log("8. Migrasi data Nomor KK ke tabel kartu_keluarga...");
    const kkInsertRes = await client.query(`
      INSERT INTO public.kartu_keluarga (no_kk, kepala_keluarga_nama, alamat, rt, rw)
      SELECT DISTINCT ON (trim(no_kk))
        trim(no_kk) as no_kk,
        COALESCE(nama_lengkap, 'Kepala Keluarga') as kepala_keluarga_nama,
        COALESCE(alamat, 'Desa Kalisalak') as alamat,
        COALESCE(rt, '01') as rt,
        COALESCE(rw, '01') as rw
      FROM public.pemilih
      WHERE no_kk IS NOT NULL AND length(trim(no_kk)) >= 6
      ORDER BY trim(no_kk), created_at ASC
      ON CONFLICT (no_kk) DO NOTHING;
    `);
    console.log(`Berhasil memproses baris KK di tabel kartu_keluarga (rowCount: ${kkInsertRes.rowCount}).`);

    // Tautkan pemilih.kk_id ke kartu_keluarga.id
    console.log("9. Menautkan foreign key pemilih.kk_id ke kartu_keluarga.id...");
    const linkRes = await client.query(`
      UPDATE public.pemilih p
      SET kk_id = k.id
      FROM public.kartu_keluarga k
      WHERE trim(p.no_kk) = k.no_kk AND (p.kk_id IS NULL OR p.kk_id <> k.id);
    `);
    console.log(`Berhasil menautkan ${linkRes.rowCount} pemilih ke KK master.`);

    // 10. Batch Terbitkan Token QR Rumah Awal (Pre-generated Unassigned House QRs) untuk tiap RW (RW 01 - RW 13)
    console.log("10. Memeriksa dan menerbitkan batch token QR Rumah (UNASSIGNED) untuk 13 RW...");
    const totalQrCountRes = await client.query(`SELECT COUNT(*) as cnt FROM public.qr_rumah;`);
    const currentQrCount = parseInt(totalQrCountRes.rows[0].cnt, 10);

    if (currentQrCount === 0) {
      console.log("Menerbitkan 1.300 token QR Rumah resmi secara batch (100 token per RW)...");
      const values: string[] = [];
      const params: string[] = [];
      let pIdx = 1;

      for (let rw = 1; rw <= 13; rw++) {
        const rwStr = `RW ${String(rw).padStart(2, "0")}`;
        const tpsStr = `Tabung Pemilihan ${String(rw).padStart(2, "0")}`;
        const batchRef = `BATCH-STIKER-${String(rw).padStart(2, "0")}`;

        for (let i = 0; i < 100; i++) {
          const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
          const qrToken = `KLK-HM-${String(rw).padStart(2, "0")}-${randomHex}`;
          values.push(`($${pIdx}, 'UNASSIGNED', $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3})`);
          params.push(qrToken, batchRef, rwStr, tpsStr);
          pIdx += 4;
        }
      }

      await client.query(`
        INSERT INTO public.qr_rumah (qr_token, status, batch_ref, assigned_rw, assigned_tps)
        VALUES ${values.join(", ")};
      `, params);
      console.log("1.300 token QR Rumah UNASSIGNED berhasil diterbitkan!");
    } else {
      console.log(`Sudah terdapat ${currentQrCount} token QR di tabel qr_rumah.`);
    }

    await client.query("COMMIT;");
    console.log("==================================================================");
    console.log("MIGRASI DATABASE BERHASIL 100%!");
    console.log("Tabel qr_rumah, rumah, kartu_keluarga, kunjungan_coklit, dan kunjungan_anggota_log siap digunakan.");
    console.log("==================================================================");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("MIGRASI GAGAL, DATABASE TELAH DI-ROLLBACK KE STATUS SEMULA:", err);
    throw err;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigration().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
