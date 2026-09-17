require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('=== MIGRATING TABLE berita_artikel ===');
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.berita_artikel (
      id text PRIMARY KEY,
      slug text UNIQUE NOT NULL,
      judul character varying NOT NULL,
      kategori character varying NOT NULL,
      ringkasan text,
      konten text NOT NULL,
      gambar_url text,
      penulis_nama character varying DEFAULT 'Sekretariat P2KD Kalisalak',
      penulis_jabatan character varying DEFAULT 'Seksi Publikasi & Dokumentasi',
      status character varying DEFAULT 'PUBLISHED',
      is_headline boolean DEFAULT false,
      lampiran_pdf_url text,
      lampiran_pdf_nama text,
      views_count integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_berita_slug ON public.berita_artikel(slug);
    CREATE INDEX IF NOT EXISTS idx_berita_kategori ON public.berita_artikel(kategori);
    CREATE INDEX IF NOT EXISTS idx_berita_status ON public.berita_artikel(status);

    ALTER TABLE public.berita_artikel ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read published berita" ON public.berita_artikel;
    CREATE POLICY "Allow public read published berita" 
    ON public.berita_artikel 
    FOR SELECT 
    TO anon, authenticated 
    USING (status = 'PUBLISHED' OR status IS NULL);

    GRANT ALL ON public.berita_artikel TO anon, authenticated, service_role;
  `);

  console.log('[OK] Table berita_artikel created and RLS configured.');

  // Seed sample initial official news articles if empty
  const countRes = await client.query('SELECT count(*) FROM public.berita_artikel');
  if (parseInt(countRes.rows[0].count, 10) === 0) {
    console.log('Seeding initial official news articles...');
    await client.query(`
      INSERT INTO public.berita_artikel (
        id, slug, judul, kategori, ringkasan, konten, gambar_url, penulis_nama, penulis_jabatan, status, is_headline, views_count, created_at, updated_at
      ) VALUES 
      (
        'news-01',
        'rapat-pleno-rekapitulasi-dps-desa-kalisalak',
        'P2KD Kalisalak Gelar Rapat Pleno Terbuka Rekapitulasi Daftar Pemilih Sementara (DPS)',
        'RAPAT_BA',
        'Panitia Pemilihan Kepala Desa Kalisalak menyelenggarakan rapat pleno terbuka rekapitulasi DPS bersama BPD, perangkat desa, dan tokoh masyarakat dengan total pemilih terdata 7.787 jiwa.',
        'Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal menggelar Rapat Pleno Terbuka Rekapitulasi Daftar Pemilih Sementara (DPS) bertempat di Balai Desa Kalisalak.\n\nDalam rapat pleno yang dipimpin langsung oleh Ketua P2KD Khasanudin, S.Pd.SD, disampaikan bahwa total pemilih terdaftar sementara mencapai 7.787 pemilih yang tersebar di 13 Tabung Pemilihan (TPS) dan 13 Rukun Warga (RW).\n\n"Kami mengimbau seluruh warga Desa Kalisalak untuk secara aktif memeriksa hak pilih masing-masing melalui portal resmi p2kdkalisalak.my.id atau melalui posko layanan aduan warga yang telah dibuka," ujar Sekretaris P2KD.\n\nBPD Desa Kalisalak memberikan apresiasi penuh atas transparansi digital dan kecepatan sinkronisasi data yang diterapkan oleh panitia pada pemilihan kepala desa periode ini.',
        '/images/p2kd-musyawarah-kalisalak.png',
        'Mashady, M.H.',
        'Sekretaris P2KD Kalisalak',
        'PUBLISHED',
        true,
        142,
        now() - interval '2 days',
        now()
      ),
      (
        'news-02',
        'bimbingan-teknis-pantarlih-13-rw-kalisalak',
        'Bimtek Pemutakhiran Data Pemilih (Coklit Faktual) bagi Pantarlih 13 Wilayah RW',
        'DOKUMENTASI',
        'Seksi Pendaftaran Pemilih P2KD Kalisalak mengadakan bimbingan teknis tatap muka dan pelatihan penggunaan aplikasi formulir Coklit digital bagi petugas pemutakhiran data.',
        'Bertempat di Sekretariat Panitia Pilkades, Seksi 1 (Pendaftaran Pemilih) menyelenggarakan pembekalan Bimbingan Teknis (Bimtek) bagi seluruh Petugas Pemutakhiran Data Pemilih (Pantarlih) yang bertugas di 13 RW dan 39 RT se-Desa Kalisalak.\n\nKoordinator Seksi Pemilih, M. Lu’lu Khulaludin, S.F.U, menekankan pentingnya verifikasi faktual door-to-door untuk memastikan tidak ada pemilih ganda, pemilih yang telah meninggal dunia segera dinyatakan TMS (Tidak Memenuhi Syarat), dan pemilih pemula yang genap berusia 17 tahun terakomodasi secara sah.\n\nSetiap petugas dibekali stiker coklit resmi ber-QR Code serta akun autentikasi untuk pencatatan real-time di lapangan.',
        '/images/p2kd-musyawarah-kalisalak.png',
        'Mohamad Khumaidi, S.Pd.I',
        'Koordinator Seksi Publikasi & Dokumentasi',
        'PUBLISHED',
        false,
        89,
        now() - interval '4 days',
        now()
      ),
      (
        'news-03',
        'sosialisasi-tahapan-dan-jadwal-pilkades-kalisalak-2027',
        'Pengumuman Resmi Jadwal & 9 Tahapan Utama Pilkades Desa Kalisalak',
        'TAHAPAN',
        'P2KD resmi mempublikasikan kalender agenda 9 tahapan Pilkades Serentak Gelombang I sesuai Perbup Tegal No. 27/2018 jo PP No. 16/2026.',
        'Panitia Pemilihan Kepala Desa Kalisalak merilis secara resmi infografis dan ketetapan jadwal 9 tahapan Pilkades Serentak.\n\nTahapan dimulai dari Pembentukan Panitia & Sosialisasi, Pemutakhiran DPS menuju DPT Faktual, Penjaringan Bakal Calon, Penyaringan dan Penetapan Calon Tetap, Masa Kampanye Damai, hingga Hari Pemungutan Suara yang dijadwalkan pada Rabu, 3 Februari 2027.\n\nWarga masyarakat dipersilakan mengunduh berkas salinan Surat Keputusan (SK) dan Berita Acara resmi melalui kanal publikasi website ini.',
        '/images/p2kd-musyawarah-kalisalak.png',
        'Khasanudin, S.Pd.SD',
        'Ketua P2KD Kalisalak',
        'PUBLISHED',
        false,
        215,
        now() - interval '6 days',
        now()
      ),
      (
        'news-04',
        'posko-layanan-aduan-dan-tanggapan-masyarakat-dibuka',
        'P2KD Buka Posko Layanan Aduan & Tanggapan Masyarakat Terhadap DPS',
        'SOSIALISASI',
        'Warga yang belum terdaftar atau menemukan ketidaksesuaian data dapat mengajukan formulir tanggapan secara online maupun langsung ke balai desa.',
        'Dalam rangka menjamin hak konstitusional setiap warga negara, P2KD Desa Kalisalak membuka kanal tanggapan dan aduan masyarakat terhadap Daftar Pemilih Sementara (DPS).\n\nBagi warga yang baru pindah domisili, terjadi kesalahan penulisan nama/NIK, atau anggota keluarga yang telah meninggal namun masih tercatat, dapat segera melapor melalui formulir digital di menu "Layanan Warga > Formulir Aduan Warga" atau datang langsung ke Sekretariat P2KD di Balai Desa Kalisalak pada jam pelayanan.',
        '/images/p2kd-musyawarah-kalisalak.png',
        'Mohamad Khumaidi, S.Pd.I',
        'Koordinator Seksi Publikasi & Dokumentasi',
        'PUBLISHED',
        false,
        178,
        now() - interval '8 days',
        now()
      );
    `);
    console.log('[OK] Sample initial news seeded.');
  }

  await client.end();
  console.log('=== MIGRATION COMPLETED SUCCESSFULLY ===');
}

runMigration().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
