# BLUEPRINT SISTEM PENDAFTARAN PEMILIH

Berikut blueprint yang saya sarankan. Saya buat dengan prinsip bahwa **data pemilih adalah satu master data**, sedangkan DPS/DPT merupakan tahapan/status administrasi yang memiliki riwayat dan dapat diaudit.

## 1. Visi Sistem

Sistem ini menjadi pusat administrasi Seksi Pendaftaran Pemilih untuk:

* pendataan pemilih;
* penyusunan DPS;
* pemutakhiran/perbaikan DPS;
* pendataan pemilih tambahan;
* pencatatan pemilih TMS;
* pencatatan mutasi pemilih;
* finalisasi dan penetapan DPT;
* pembagian pemilih berdasarkan TPS;
* pengumuman data publik;
* pencetakan laporan;
* audit seluruh perubahan data.

Arsitektur:

```text
                         SISTEM PENDAFTARAN PEMILIH
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              PORTAL PUBLIK                  PORTAL PRIVATE
              Tanpa Login                        Login
                    │                               │
          ┌─────────┼─────────┐          ┌─────────┼──────────┐
          │         │         │          │         │          │
       Informasi  Cek Data   TPS       Dashboard  Data      Rekap
          │         │         │                    Pemilih
          │         │         │                      │
          └─────────┴─────────┘                      │
                                                     │
                                             DPS → Perbaikan
                                                     │
                                              Tambahan/TMS
                                                     │
                                                    DPT
                                                     │
                                           Penetapan + Lock
                                                     │
                           ┌─────────────────────────┴───────┐
                           │                                 │
                    DATABASE UTAMA                      AUDIT LOG
```

---

## 

Prinsip terpenting:

> **Satu orang hanya mempunyai satu identitas master.**

Jangan membuat data yang sama secara terpisah di tabel DPS dan DPT.

Contoh:

```text
PEMILIH
Muhammad Ahmad
NIK xxxxxxxxxxxxxxxx
        │
        ├── Pendataan
        ├── DPS
        ├── Perbaikan
        └── DPT
```

Bukan:

```text
Tabel DPS
Muhammad Ahmad

Tabel DPT
Muhammad Ahmad
```

Karena cara kedua menghasilkan duplikasi dan menyulitkan audit.

---

## 

Saya sarankan database dibagi menjadi beberapa kelompok.

## A. Master Data

### `pemilih`

Tabel inti identitas pemilih.

```text
id
nik
no_kk
nama_lengkap
tempat_lahir
tanggal_lahir
jenis_kelamin
status_perkawinan
alamat
rt
rw
desa
kecamatan
status_aktif
created_at
updated_at
```

Untuk keamanan, NIK/KK sebaiknya tidak diperlakukan sembarangan di frontend.

---

### `tps`

```text
id
kode_tps
nomor_tps
nama_tps
alamat
rt
rw
lokasi
status
created_at
updated_at
```

---

### `wilayah`

Jika sistem nantinya mencakup banyak desa:

```text
id
nama
jenis
parent_id
```

Contoh:

```text
Kabupaten
   └── Kecamatan
        └── Desa
             └── RW
                  └── RT
```

---

## 

### `tahapan`

```text
id
nama_tahapan
kode
tanggal_mulai
tanggal_selesai
status
```

Contoh:

```text
PENDATAAN
DPS
PERBAIKAN_DPS
DPT_TAMBAHAN
FINALISASI_DPT
DPT
```

Status:

```text
DRAFT
AKTIF
SELESAI
DIKUNCI
```

Ini memungkinkan sistem mengetahui **tahapan aktif saat ini**.

---

## 

### `pendaftaran_pemilih`

Ini sangat penting.

```text
id
pemilih_id
tahapan_id
status
tps_id
tanggal_mulai
tanggal_selesai
sumber_data
keterangan
created_by
created_at
```

Contoh satu pemilih:

```text
PEMILIH #001

14 Agustus
PENDATAAN

20 Agustus
DPS

25 Agustus
PERBAIKAN DPS

30 Agustus
DPT
```

Semua riwayat tetap tersimpan.

---

## 

### `perubahan_pemilih`

```text
id
pemilih_id
jenis_perubahan
field
nilai_lama
nilai_baru
alasan
sumber
created_by
created_at
```

Contoh:

```text
Pemilih: 001

Field:
TPS

Lama:
003

Baru:
004

Alasan:
Penyesuaian wilayah TPS

Operator:
Ahmad

Tanggal:
25-08-2026
```

---

## 

### `mutasi_pemilih`

```text
id
pemilih_id
jenis_mutasi
tps_asal_id
tps_tujuan_id
wilayah_asal
wilayah_tujuan
tanggal
alasan
status
diverifikasi_oleh
verified_at
```

Jenis:

```text
PINDAH_MASUK
PINDAH_KELUAR
PINDAH_TPS
```

---

## 

Tidak perlu menghapus pemilih.

Gunakan:

### `status_pemilih`

atau tabel khusus:

### `pemilih_tms`

```text
id
pemilih_id
alasan_tms
tanggal_tms
sumber
bukti
diverifikasi_oleh
keterangan
```

Contoh:

```text
Pemilih:
Ahmad

Status:
TMS

Alasan:
Meninggal Dunia
```

Data identitas tetap tersimpan untuk kebutuhan audit.

---

## 

### `aduan_pemilih`

```text
id
nomor_aduan
pemilih_id
nama_pelapor
kontak_pelapor
jenis_aduan
isi_aduan
bukti
status
catatan_petugas
ditangani_oleh
created_at
resolved_at
```

Status:

```text
BARU
DIVERIFIKASI
DITOLAK
DITERIMA
SELESAI
```

Contoh:

> "Nama saya belum masuk DPS."

Pengurus menerima laporan → melakukan verifikasi → jika benar, memasukkan ke proses pemutakhiran.

---

## 

### `users`

```text
id
nama
username
email
password_hash
role_id
status
last_login
created_at
updated_at
```

### `roles`

```text
id
nama_role
```

Role:

```text
SUPER_ADMIN
KETUA
ADMIN_PENDAFTARAN
VERIFIKATOR
OPERATOR
VIEWER
```

---

## 

Jangan hanya menggunakan role.

Buat permission:

```text
pemilih.view
pemilih.create
pemilih.update

dps.view
dps.create
dps.update
dps.verify

tambahan.view
tambahan.create
tambahan.verify

tms.view
tms.create
tms.verify

mutasi.view
mutasi.create
mutasi.verify

dpt.view
dpt.finalize
dpt.lock

tps.view
tps.manage

report.view
report.export
report.print

user.manage
audit.view
```

Kemudian role mendapatkan permission.

---

## 

| Modul          | Ketua | Admin | Verifikator | Operator | Viewer |
| -------------- | ----: | ----: | ----------: | -------: | -----: |
| Dashboard      |     ✓ |     ✓ |           ✓ |        ✓ |      ✓ |
| Pemilih        |     ✓ |     ✓ |           ✓ |        ✓ |   View |
| DPS            |     ✓ |     ✓ |           ✓ |        ✓ |   View |
| Perbaikan      |     ✓ |     ✓ |           ✓ |        ✓ |   View |
| Tambahan       |     ✓ |     ✓ |           ✓ |        ✓ |   View |
| TMS            |     ✓ |     ✓ |           ✓ | Terbatas |   View |
| Mutasi         |     ✓ |     ✓ |           ✓ |        ✓ |   View |
| TPS            |     ✓ |     ✓ |        View |     View |   View |
| Finalisasi DPT |     ✓ |     ✓ |           — |        — |      — |
| Lock DPT       |     ✓ |     — |           — |        — |      — |
| Export         |     ✓ |     ✓ |           ✓ | Terbatas |      — |
| User           |     ✓ |     — |           — |        — |      — |
| Audit Log      |     ✓ |     ✓ |        View |        — |      — |

---

## 

Menu:

```text
BERANDA
├── Informasi Pemilihan
├── Tahapan
├── Cek Hak Pilih
├── DPS
├── DPT
├── TPS
├── Pengumuman
├── Ajukan Perbaikan
├── FAQ
└── Kontak Panitia
```

## Beranda

Isi:

```text
PEMILIHAN KEPALA DESA

[Nama Desa]

Tahapan Saat Ini
PENGUMUMAN DPS

DPS
1.245

DPT
1.198

TPS
24

[ CEK HAK PILIH ]
```

---

## 

Jangan menggunakan pencarian nama bebas sebagai mekanisme utama.

Gunakan:

```text
NIK
[________________]

Tanggal Lahir
[__/__/____]

[ CEK DATA ]
```

Hasil publik:

```text
DATA DITEMUKAN

Nama       : MUHAMMAD AHMAD
Status     : DPT
TPS        : TPS 004
Wilayah    : RW 03
```

NIK lengkap jangan ditampilkan kembali.

---

## 

API publik tidak boleh mengembalikan:

```text
nik
no_kk
tanggal_lahir
nomor_hp
alamat_lengkap
```

Response publik harus berupa data minimum:

```text
{
  "nama": "MUHAMMAD AHMAD",
  "status": "DPT",
  "tps": "TPS 004",
  "wilayah": "RW 03"
}
```

Bahkan endpoint publik sebaiknya tidak bisa dipakai untuk melakukan enumeration seluruh database.

---

## 

Sidebar:

```text
Dashboard

DATA PEMILIH
├── Semua Pemilih
├── Pendataan
├── DPS
├── Perbaikan DPS
├── Pemilih Tambahan
├── TMS
├── Mutasi
└── DPT

WILAYAH
├── Wilayah
└── TPS

VERIFIKASI
├── Menunggu Verifikasi
├── Aduan Masyarakat
└── Riwayat Verifikasi

LAPORAN
├── Rekapitulasi
├── Daftar Pemilih
├── Rekap TPS
└── Export

PENGATURAN
├── Tahapan
├── Pengguna
├── Role & Permission
└── Audit Log
```

---

## 

Dashboard harus menjadi pusat monitoring.

```text
PENDAFTARAN PEMILIH

TOTAL PEMILIH
1.250

DPS
1.245

PEMILIH TAMBAHAN
37

TMS
24

DPT
1.198
```

Kemudian:

```text
JENIS KELAMIN

Laki-laki     620
Perempuan     578
```

Dan:

```text
REKAP TPS

TPS 001     48
TPS 002     51
TPS 003     47
TPS 004     53
...
```

---

## 

Ini bagian inti sistem.

```text
                DATA AWAL
                    │
                    ▼
              VERIFIKASI
                    │
                    ▼
                  DPS
                    │
          ┌─────────┼─────────┐
          │         │         │
          ▼         ▼         ▼
       Tetap     Perbaikan   TMS
          │         │
          │         ▼
          │     Verifikasi
          │         │
          └────┬────┘
               ▼
        PEMUTAKHIRAN
               │
      ┌────────┼─────────┐
      │        │         │
      ▼        ▼         ▼
    Tetap   Tambahan   Mutasi
      │        │         │
      └────────┼─────────┘
               ▼
          FINALISASI
               │
               ▼
              DPT
               │
               ▼
             LOCK
```

---

## 

Admin dapat:

```text
Import Excel
```

Sistem melakukan:

```text
Upload
   ↓
Validasi
   ↓
Deteksi duplikat
   ↓
Preview
   ↓
Konfirmasi
   ↓
Import
```

Validasi minimal:

* NIK 16 digit;
* NIK duplikat;
* KK;
* nama;
* tanggal lahir;
* jenis kelamin;
* RT/RW;
* TPS;
* data kosong;
* format tidak valid.

---

## 

Operator memilih:

```text
Jadikan DPS
```

Sistem menyimpan:

```text
tahapan = DPS
```

Bukan membuat salinan data baru.

DPS kemudian dapat:

* difilter per TPS;
* difilter per RW;
* difilter per RT;
* diurutkan berdasarkan nama;
* dicetak;
* diekspor.

---

## 

Semua perubahan masuk ke workflow.

Misalnya:

```text
Pemilih mengajukan perubahan
        ↓
Aduan masuk
        ↓
Verifikator
        ↓
Diterima / Ditolak
        ↓
Perubahan data
        ↓
Audit Log
```

Tidak boleh operator langsung mengubah data final tanpa jejak.

---

## 

Pemilih baru:

```text
Tambah Pemilih
       ↓
Input identitas
       ↓
Validasi NIK
       ↓
Validasi syarat
       ↓
Verifikasi
       ↓
Disetujui
       ↓
Masuk daftar sesuai tahapan
```

---

## 

Jika ditemukan pemilih yang tidak memenuhi syarat:

```text
Pilih Pemilih
      ↓
Ajukan TMS
      ↓
Pilih alasan
      ↓
Upload bukti jika diperlukan
      ↓
Verifikasi
      ↓
Disetujui
```

Contoh alasan harus mengikuti regulasi yang berlaku, bukan dibuat sembarangan oleh aplikasi.

---

## 

Sebelum DPT ditetapkan, sistem menampilkan checklist validasi:

```text
Total pemilih
NIK duplikat
Data kosong
TPS kosong
Pemilih TMS
Pemilih mutasi
Aduan belum selesai
Data belum diverifikasi
```

Jika masih ada error kritis:

```text
FINALISASI DITOLAK
```

Jika semuanya valid:

```text
FINALISASI DPT
```

---

## 

Setelah ditetapkan:

```text
DPT
STATUS: FINAL
LOCKED: YES
```

Operator tidak dapat mengubahnya secara normal.

Perubahan setelah lock harus melalui:

```text
Pengajuan Perubahan
        ↓
Verifikasi
        ↓
Persetujuan
        ↓
Perubahan
        ↓
Audit
```

---

## 

Setiap operasi penting dicatat.

```text
14-08-2026 09:32
AHMAD

UPDATE PEMILIH

Pemilih:
PLH-000182

Field:
TPS

OLD:
003

NEW:
004

Alasan:
Penyesuaian wilayah
```

Audit log idealnya **append-only**.

Artinya operator tidak dapat menghapus riwayat.

---

## 

Ini bagian yang harus dianggap sebagai fitur inti, bukan tambahan.

## Authentication

Gunakan:

* password hashing;
* session aman;
* cookie HttpOnly;
* Secure;
* SameSite;
* rate limiting;
* session expiration;
* logout semua perangkat.

Password **tidak pernah disimpan dalam bentuk plaintext**.

---

## Authorization

Jangan hanya menyembunyikan tombol.

Contoh:

```text
Operator tidak melihat tombol "Lock DPT"
```

belum cukup.

Backend juga harus menolak:

```text
POST /api/dpt/lock
```

jika user tidak memiliki permission.

---

## 

NIK adalah data yang sangat sensitif untuk sistem ini.

Prinsipnya:

```text
DATABASE
   ↓
PRIVATE API
   ↓
AUTHORIZED USER
```

bukan:

```text
DATABASE
   ↓
PUBLIC API
```

Untuk portal publik, tampilkan data seminimal mungkin.

---

## 

Endpoint:

```text
/api/public/cek-pemilih
```

harus memiliki rate limit.

Misalnya:

```text
Terlalu banyak permintaan
Silakan coba beberapa saat lagi.
```

Tujuannya mencegah seseorang mencoba ribuan NIK secara otomatis.

Tambahkan CAPTCHA/challenge bila diperlukan berdasarkan pola serangan.

---

## 

Minimal:

```text
Backup harian
Backup mingguan
Backup sebelum finalisasi
Backup sebelum perubahan besar
```

Dan jangan menyimpan satu-satunya backup pada server yang sama.

---

## 

Untuk data administratif:

```text
deleted_at
deleted_by
```

Jika memang secara teknis perlu "menghapus", data tidak langsung dihancurkan.

Untuk data pemilih, lebih baik menggunakan status:

```text
AKTIF
TMS
PINDAH
ARSIP
```

daripada delete permanen.

---

## 

Menu:

```text
DATA PEMILIH
    ↓
IMPORT
    ├── Download Template
    ├── Upload Excel
    ├── Validasi
    └── Import

EXPORT
    ├── DPS
    ├── DPT
    ├── TMS
    ├── Mutasi
    └── Rekap TPS
```

Export data sensitif harus membutuhkan permission.

---

## 

Sistem sebaiknya bisa menghasilkan:

```text
Daftar DPS
Daftar DPT
Daftar per TPS
Daftar per RW
Daftar per RT
Daftar Pemilih Tambahan
Daftar TMS
Daftar Mutasi
Rekapitulasi
```

Format:

```text
PDF
Excel
Print
```

---

## 

Gambaran sederhananya:

```text
users
  │
  ├─────────────── audit_logs
  │
  └─────────────── perubahan_pemilih

pemilih
  │
  ├────────────── pendaftaran_pemilih
  │                       │
  │                       ├── tahapan
  │                       └── tps
  │
  ├────────────── perubahan_pemilih
  │
  ├────────────── mutasi_pemilih
  │
  └────────────── aduan_pemilih

wilayah
  │
  └────────────── tps

roles
  │
  └────────────── permissions
```

---

## 

Jika menggunakan stack yang Anda biasa gunakan:

```text
Next.js
React
Tailwind CSS
shadcn/ui
TanStack Query
React Hook Form
Zod

Cloudflare Workers
Cloudflare D1
Drizzle ORM

Cloudflare R2
```

Struktur fitur:

```text
features/
├── auth/
├── dashboard/
├── pemilih/
├── dps/
├── dpt/
├── tambahan/
├── tms/
├── mutasi/
├── tps/
├── wilayah/
├── aduan/
├── tahapan/
├── reports/
├── import-export/
├── users/
├── roles/
└── audit/
```

---

## 

Portal publik:

```text
/
 /informasi
 /tahapan
 /cek-pemilih
 /dps
 /dpt
 /tps
 /pengumuman
 /aduan
 /faq
```

Portal private:

```text
/admin
/admin/dashboard
/admin/pemilih
/admin/pemilih/[id]
/admin/dps
/admin/dps/perbaikan
/admin/tambahan
/admin/tms
/admin/mutasi
/admin/dpt
/admin/tps
/admin/wilayah
/admin/aduan
/admin/laporan
/admin/import
/admin/export
/admin/tahapan
/admin/users
/admin/roles
/admin/audit-log
```

---

## 

Saya sarankan desainnya bukan seperti aplikasi pemerintahan lama yang penuh tabel dan tombol.

Gunakan:

### Clean Administrative SaaS

Karakter:

* putih;
* abu-abu/netral;
* satu warna aksen;
* sidebar;
* data table modern;
* filter jelas;
* status badge;
* drawer/detail panel;
* modal konfirmasi;
* responsive;
* mobile-friendly untuk operator lapangan.

Contoh:

```text
┌───────────────────────────────────────────────┐
│ Logo     Pendaftaran Pemilih       Admin ▼   │
├────────────┬──────────────────────────────────┤
│ Dashboard  │                                  │
│ Pemilih    │  DATA PEMILIH                    │
│ DPS        │                                  │
│ DPT        │  [Cari...] [Filter] [Import]    │
│ Tambahan   │                                  │
│ TMS        │  ┌────────────────────────────┐  │
│ Mutasi     │  │ Nama │ NIK │ TPS │ Status │  │
│ TPS        │  │──────┼─────┼─────┼────────│  │
│ Laporan    │  │ Ahmad│ ... │ 004 │ DPT    │  │
│ Audit      │  │ Budi │ ... │ 002 │ DPS    │  │
│            │  └────────────────────────────┘  │
└────────────┴──────────────────────────────────┘
```

---

## 

Sistem harus memiliki aturan yang tegas:

```text
1. Satu NIK = satu pemilih.
2. Data pemilih tidak dihapus sembarangan.
3. DPS dan DPT bukan duplikasi database.
4. Setiap perubahan memiliki riwayat.
5. Setiap perubahan penting memiliki user/petugas.
6. DPT dapat dikunci setelah penetapan.
7. Data terkunci hanya dapat diubah melalui workflow resmi.
8. Data publik berbeda dengan data internal.
9. NIK tidak ditampilkan secara terbuka.
10. Semua proses mengikuti tahapan yang sedang aktif.
11. User hanya dapat melakukan tindakan sesuai permission.
12. Export data sensitif dibatasi.
13. Audit Log tidak dapat diubah operator.
14. Import Excel selalu melewati validasi.
15. Rekapitulasi dihitung dari database, bukan diketik manual.
```

---

## 

Dengan blueprint ini, sistem akhirnya akan menjadi:

```text
                  ┌──────────────────────┐
                  │   PORTAL PUBLIK      │
                  │                      │
                  │ Informasi            │
                  │ Cek Hak Pilih        │
                  │ DPS / DPT            │
                  │ TPS                   │
                  │ Aduan                 │
                  └──────────┬───────────┘
                             │
                             │
                    ┌────────▼────────┐
                    │ DATABASE UTAMA  │
                    │                 │
                    │ PEMILIH         │
                    │ TPS             │
                    │ WILAYAH         │
                    │ PENDAFTARAN      │
                    │ MUTASI           │
                    │ TMS              │
                    │ ADUAN            │
                    └────────┬────────┘
                             │
                  ┌──────────▼──────────┐
                  │   PORTAL PRIVATE    │
                  │                     │
                  │ Dashboard           │
                  │ Master Pemilih      │
                  │ DPS                 │
                  │ Perbaikan           │
                  │ Tambahan            │
                  │ TMS                 │
                  │ Mutasi              │
                  │ DPT                 │
                  │ TPS                 │
                  │ Laporan             │
                  │ Import / Export     │
                  │ User & Permission   │
                  │ Audit Log            │
                  └─────────────────────┘
```

**Rekomendasi saya:** jangan langsung mulai dari halaman dashboard. Urutan pembangunan yang paling aman adalah **Database & aturan bisnis → Authentication/RBAC → Master Pemilih → TPS/Wilayah → DPS → Perbaikan/TMS/Tambahan/Mutasi → DPT & Lock → Audit Log → Portal Publik → Laporan/Export**.

Dengan urutan tersebut, portal publik hanya menjadi lapisan presentasi di atas sistem administrasi yang sudah benar, bukan sistem terpisah yang nantinya sulit disinkronkan.
