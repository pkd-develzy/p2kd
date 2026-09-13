require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

function maskNIK(nik) {
  if (!nik || nik.length < 8) return nik || '';
  return nik.substring(0, 4) + '********' + nik.substring(nik.length - 4);
}

function maskKK(kk) {
  if (!kk || kk.length < 8) return kk || '';
  return kk.substring(0, 4) + '********' + kk.substring(kk.length - 4);
}

async function recoverRegistrations() {
  console.log('--- RECOVERING MAR\'UFAH & YANI YUSWANTI ---');

  const mar = {
    id: 'ptg-rec-1789290700001',
    nomor_registrasi: 'PTG-KLS-2026-00001',
    nik: '3328014907790004',
    nik_masked: maskNIK('3328014907790004'),
    nama_lengkap: "MAR'UFAH",
    tempat_lahir: 'TEGAL',
    tanggal_lahir: '1979-07-09',
    jenis_kelamin: 'P',
    no_kk: '3328011702110021',
    no_kk_masked: maskKK('3328011702110021'),
    alamat: 'KALISALAK',
    rt: '01',
    rw: '03',
    dusun: 'Desa Kalisalak',
    desa: 'Desa Kalisalak',
    nomor_wa: '085879584257', // default sekretariat kontak / konfirmasi
    nomor_whatsapp: '085879584257',
    is_calon_kades: false,
    keterangan_calon_kades: null,
    is_tim_sukses: false,
    keterangan_tim_sukses: null,
    is_kepentingan_calon: false,
    is_memiliki_kepentingan: false,
    keterangan_kepentingan: null,
    persetujuan_pernyataan: true,
    surat_pernyataan_signed: true,
    tanda_tangan_url: null,
    surat_pernyataan_url: null,
    status: 'MENUNGGU_VERIFIKASI',
    status_verifikasi: 'MENUNGGU_VERIFIKASI',
    catatan_panitia: 'Pendaftaran mandiri berhasil tercatat via portal publik (Pukul 16:11 WIB). Nomor kontak & tanda tangan digital perlu dikonfirmasi ulang panitia saat verifikasi administrasi.',
    catatan_verifikasi: 'Pendaftaran mandiri berhasil tercatat via portal publik (Pukul 16:11 WIB). Nomor kontak & tanda tangan digital perlu dikonfirmasi ulang panitia saat verifikasi administrasi.',
    assigned_wilayah: 'RW 03',
    tanggal_pendaftaran: '2026-09-13T09:11:40.749Z',
    created_at: '2026-09-13T09:11:40.749Z',
    updated_at: '2026-09-13T09:11:40.749Z'
  };

  const yani = {
    id: 'ptg-rec-1789292600002',
    nomor_registrasi: 'PTG-KLS-2026-00002',
    nik: '3328015810840004',
    nik_masked: maskNIK('3328015810840004'),
    nama_lengkap: 'YANI YUSWANTI',
    tempat_lahir: 'TEGAL',
    tanggal_lahir: '1984-10-18',
    jenis_kelamin: 'P',
    no_kk: '3328011702110224',
    no_kk_masked: maskKK('3328011702110224'),
    alamat: 'KALISALAK',
    rt: '01',
    rw: '09',
    dusun: 'Desa Kalisalak',
    desa: 'Desa Kalisalak',
    nomor_wa: '085879584257',
    nomor_whatsapp: '085879584257',
    is_calon_kades: false,
    keterangan_calon_kades: null,
    is_tim_sukses: false,
    keterangan_tim_sukses: null,
    is_kepentingan_calon: false,
    is_memiliki_kepentingan: false,
    keterangan_kepentingan: null,
    persetujuan_pernyataan: true,
    surat_pernyataan_signed: true,
    tanda_tangan_url: null,
    surat_pernyataan_url: null,
    status: 'MENUNGGU_VERIFIKASI',
    status_verifikasi: 'MENUNGGU_VERIFIKASI',
    catatan_panitia: 'Pendaftaran mandiri berhasil tercatat via portal publik (Pukul 16:43 WIB). Nomor kontak & tanda tangan digital perlu dikonfirmasi ulang panitia saat verifikasi administrasi.',
    catatan_verifikasi: 'Pendaftaran mandiri berhasil tercatat via portal publik (Pukul 16:43 WIB). Nomor kontak & tanda tangan digital perlu dikonfirmasi ulang panitia saat verifikasi administrasi.',
    assigned_wilayah: 'RW 09',
    tanggal_pendaftaran: '2026-09-13T09:43:21.820Z',
    created_at: '2026-09-13T09:43:21.820Z',
    updated_at: '2026-09-13T09:43:21.820Z'
  };

  const { error: errMar } = await supabase.from('pendaftaran_petugas_dpt').upsert(mar);
  console.log('Insert MAR\'UFAH:', errMar || 'BERHASIL (PTG-KLS-2026-00001)');

  const { error: errYani } = await supabase.from('pendaftaran_petugas_dpt').upsert(yani);
  console.log('Insert YANI YUSWANTI:', errYani || 'BERHASIL (PTG-KLS-2026-00002)');
}

recoverRegistrations();
