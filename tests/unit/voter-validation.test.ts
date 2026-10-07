import { describe, it, expect } from "vitest";
import { voterFormSchema } from "@/features/pemilih/schemas/voter.schema";

describe("Validasi Data Pemilih (Zod Schema)", () => {
  it("harus meloloskan data pemilih yang valid", () => {
    const validData = {
      nik: "3328011204900001",
      kk: "3328011204900002",
      namaLengkap: "AHMAD FAUZI",
      tempatLahir: "Batang",
      tanggalLahir: "1990-04-12",
      jenisKelamin: "L" as const,
      statusPerkawinan: "S" as const,
      alamat: "RT 01 RW 01 Desa Kalisalak",
      rt: "01",
      rw: "01",
      tps: "Tabung Pemilihan 01",
      statusAktif: "AKTIF" as const,
      tahap: "DPS" as const,
    };

    const result = voterFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("harus menolak NIK yang kurang dari 16 digit atau mengandung huruf", () => {
    const invalidNik1 = {
      nik: "332801", // hanya 6 digit
      namaLengkap: "BUDI SANTOSO",
      tempatLahir: "Tegal",
      tanggalLahir: "1995-01-01",
      jenisKelamin: "L" as const,
      statusPerkawinan: "B" as const,
      alamat: "Kalisalak",
      rt: "01",
      rw: "01",
      tps: "Tabung 01",
      statusAktif: "AKTIF" as const,
    };

    const res1 = voterFormSchema.safeParse(invalidNik1);
    expect(res1.success).toBe(false);

    const invalidNik2 = {
      ...invalidNik1,
      nik: "332801120490000A", // ada huruf
    };
    const res2 = voterFormSchema.safeParse(invalidNik2);
    expect(res2.success).toBe(false);
  });

  it("harus menolak jika nama kosong", () => {
    const invalidName = {
      nik: "3328011204900001",
      namaLengkap: " ",
      tempatLahir: "Tegal",
      tanggalLahir: "1995-01-01",
      jenisKelamin: "P" as const,
      statusPerkawinan: "B" as const,
      alamat: "Kalisalak",
      rt: "01",
      rw: "01",
      tps: "Tabung 01",
      statusAktif: "AKTIF" as const,
    };

    const res = voterFormSchema.safeParse(invalidName);
    expect(res.success).toBe(false);
  });
});
