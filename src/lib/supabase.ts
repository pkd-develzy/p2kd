import { createClient } from "@supabase/supabase-js";

// --- Primary Database (Public Portal & Panitia Umum) ---
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://apiastdpwrycnsbskpmy.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "anon-key";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";

// 1. Client-Side Browser Supabase Instance (Public Anon Key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 2. Server-Side Admin Supabase Instance (Service Role Key for elevated backend operations)
export const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || supabaseUrl;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || supabaseServiceKey;
  if (!key) {
    return supabase;
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// --- Dedicated Database (Seksi 1: Pendaftaran Pemilih & Pantarlih - ewzhaldoxepheugxjquz) ---
const supabaseSeksi1Url =
  process.env.NEXT_PUBLIC_SUPABASE_SEKSI1_URL ||
  process.env.SUPABASE_SEKSI1_URL ||
  "https://ewzhaldoxepheugxjquz.supabase.co";

const supabaseSeksi1AnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_SEKSI1_ANON_KEY ||
  process.env.SUPABASE_SEKSI1_PUBLISHABLE_KEY ||
  "anon-key";

const supabaseSeksi1ServiceKey =
  process.env.SUPABASE_SEKSI1_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SEKSI1_SECRET_KEY ||
  "";

export const supabaseSeksi1 = createClient(supabaseSeksi1Url, supabaseSeksi1AnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getSupabaseSeksi1Admin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_SEKSI1_URL || process.env.SUPABASE_SEKSI1_URL || supabaseSeksi1Url;
  const key = process.env.SUPABASE_SEKSI1_SERVICE_ROLE_KEY || process.env.SUPABASE_SEKSI1_SECRET_KEY || supabaseSeksi1ServiceKey;
  if (!key) {
    throw new Error(
      "[STRICT ISOLATION FATAL ERROR] SUPABASE_SEKSI1_SERVICE_ROLE_KEY is missing! Seksi 1 & Pantarlih database is strictly isolated and forbidden from querying the old server."
    );
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// --- Dedicated Database (Server 3: Dashboard Panitia / Seksi 2 & 3 Calon & Real Count - msrefdzbexmkputwbyjc) ---
const supabaseServer3Url =
  process.env.NEXT_PUBLIC_SUPABASE_SERVER3_URL ||
  process.env.SUPABASE_SERVER3_URL ||
  "https://msrefdzbexmkputwbyjc.supabase.co";

const supabaseServer3AnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_SERVER3_ANON_KEY ||
  process.env.SUPABASE_SERVER3_PUBLISHABLE_KEY ||
  "anon-key";

const supabaseServer3ServiceKey =
  process.env.SUPABASE_SERVER3_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVER3_SECRET_KEY ||
  "";

export const supabaseServer3 = createClient(supabaseServer3Url, supabaseServer3AnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getSupabaseServer3Admin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_SERVER3_URL || process.env.SUPABASE_SERVER3_URL || supabaseServer3Url;
  const key = process.env.SUPABASE_SERVER3_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVER3_SECRET_KEY || supabaseServer3ServiceKey;
  if (!key) {
    throw new Error(
      "[STRICT ISOLATION FATAL ERROR] SUPABASE_SERVER3_SERVICE_ROLE_KEY is missing! Panitia & Calon & Real Count database is strictly isolated."
    );
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Database Schema Interfaces for Supabase Type Safety
export interface Database {
  public: {
    Tables: {
      pemilih: {
        Row: {
          id: string;
          nik: string;
          nik_encrypted: string | null;
          nik_hash: string | null;
          no_kk: string;
          nama_lengkap: string;
          tempat_lahir: string;
          tanggal_lahir: string;
          jenis_kelamin: string;
          status_perkawinan: string;
          alamat: string;
          rt: string;
          rw: string;
          desa: string;
          kecamatan: string;
          tps: string;
          disabilitas: string | null;
          status_aktif: string;
          alasan_tms: string | null;
          coklit_status: string;
          coklit_tanggal: string | null;
          coklit_catatan: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      anggota_p2kd: {
        Row: {
          id: string;
          nama_lengkap: string;
          nik: string;
          jabatan: string;
          seksi: string;
          seksi_label: string;
          username: string;
          role: string;
          kontak_wa: string;
          alamat_dusun: string;
          assigned_tps: string | null;
          status: string;
          sk_penetapan: string;
          created_at: string;
          updated_at: string;
        };
      };
      balon_penjaringan: {
        Row: {
          id: string;
          nama_lengkap: string;
          nik: string;
          tempat_tanggal_lahir: string;
          alamat_domisili: string;
          pendidikan_terakhir: string;
          pekerjaan: string;
          tanggal_pendaftaran: string;
          status_berkas: string;
          kelengkapan: Record<string, boolean> | null;
          catatan_penjaringan: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      kandidat_kades: {
        Row: {
          id: string;
          nomor_urut: number;
          nama_lengkap: string;
          gelar_depan: string | null;
          gelar_belakang: string | null;
          tempat_tanggal_lahir: string;
          pendidikan_terakhir: string;
          pekerjaan: string;
          tagline: string;
          visi: string;
          misi: string[] | null;
          program_unggulan: string[] | null;
          foto_url: string;
          warna_tema: string | null;
          status_verifikasi: string;
          created_at: string;
          updated_at: string;
        };
      };
      tps: {
        Row: {
          id: string;
          kode_tps: string;
          nomor_tps: string;
          nama_tps: string;
          wilayah_id: string | null;
          lokasi: string;
          alamat: string;
          rt: string | null;
          rw: string | null;
          kuota_maksimal: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      aduan_pemilih: {
        Row: {
          id: string;
          nomor_aduan: string;
          nama_pelapor: string;
          nik: string;
          nik_masked: string | null;
          kontak_pelapor: string;
          rt: string;
          rw: string;
          jenis_aduan: string;
          isi_aduan: string;
          status: string;
          catatan_petugas: string | null;
          tanggal: string;
          tanggal_disetujui: string | null;
          created_at: string;
        };
      };
      tps_vote_count: {
        Row: {
          id: string;
          tps_id: string;
          nomor_tps: string;
          nama_tps: string;
          lokasi: string;
          total_dpt: number;
          suara_masuk: number;
          suara_sah: number;
          suara_tidak_sah: number;
          suara_kandidat: Record<string, number> | null;
          status_pleno_tps: string;
          waktu_input: string | null;
          petugas_input: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          aksi: string;
          modul: string;
          user_name: string;
          role: string;
          detail: string;
          ip_address: string | null;
          created_at: string;
        };
      };
      berita_artikel: {
        Row: {
          id: string;
          slug: string;
          judul: string;
          kategori: string;
          ringkasan: string | null;
          konten: string;
          gambar_url: string | null;
          penulis_nama: string | null;
          penulis_jabatan: string | null;
          status: string;
          is_headline: boolean;
          lampiran_pdf_url: string | null;
          lampiran_pdf_nama: string | null;
          views_count: number;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
