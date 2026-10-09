import { z } from "zod";

export const voterFormSchema = z.object({
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "NIK wajib berupa 16 digit angka"),
  kk: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\d{16}$/.test(val), {
      message: "Nomor KK harus 16 digit angka jika diisi",
    }),
  namaLengkap: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  tempatLahir: z.string().trim().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().trim().min(1, "Tanggal lahir wajib diisi"),
  jenisKelamin: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin Laki-laki (L) atau Perempuan (P)",
  }),
  statusPerkawinan: z.enum(["B", "S", "P"], {
    message: "Status perkawinan wajib dipilih (Belum / Kawin / Pernah)",
  }),
  alamat: z.string().trim().min(1, "Alamat domisili wajib diisi"),
  rt: z.string().trim().min(1, "RT wajib dipilih"),
  rw: z.string().trim().min(1, "RW wajib dipilih"),
  tps: z.string().trim().min(1, "Alokasi TPS / Tabung wajib dipilih"),
  statusAktif: z.enum(["AKTIF", "TMS"]),
  tahap: z.enum(["CALON_DPS", "DPS", "DPSHP", "DPT"]).optional(),
  sumberData: z.enum(["REGULER", "DPTB"]).optional(),
  alasanTms: z.string().optional(),
});

export type VoterFormValues = z.infer<typeof voterFormSchema>;
