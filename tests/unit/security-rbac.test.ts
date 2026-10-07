import { describe, it, expect } from "vitest";
import {
  isDeveloper,
  isKetuaP2KD,
  isSeksiPemilih,
  isPantarlih,
  canAccessVoterData,
  isAuthorizedForVoterTps,
} from "@/lib/auth-middleware";
import { AuthTokenPayload } from "@/lib/encryption";

describe("Strict RBAC & Keamanan Hak Akses Pemilih", () => {
  const devUser: AuthTokenPayload = {
    username: "develzy",
    role: "DEVELOPER",
    nama: "Develzy",
    seksi: "PIMPINAN",
    assignedTps: "SEMUA",
    isSuperAdmin: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const ketuaUser: AuthTokenPayload = {
    username: "khasanudin",
    role: "KETUA",
    jabatan: "Ketua P2KD",
    nama: "Khasanudin, S.Pd.SD",
    seksi: "PIMPINAN",
    assignedTps: "SEMUA",
    isSuperAdmin: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const seksi1User: AuthTokenPayload = {
    username: "khulal",
    role: "SEKSI_PEMILIH",
    seksi: "SEKSI_PEMILIH",
    jabatan: "Koordinator Seksi Pendaftaran Pemilih",
    nama: "M. Lu'lu Khulaludin",
    assignedTps: "SEMUA",
    isSuperAdmin: false,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const pantarlihRw1: AuthTokenPayload = {
    username: "pps_rw01",
    role: "PETUGAS_TPS",
    seksi: "PANTARLIH_LAPANGAN",
    assignedTps: "Tabung Pemilihan 01",
    nama: "Petugas RW 01",
    isSuperAdmin: false,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const bendaharaUser: AuthTokenPayload = {
    username: "bendahara_p2kd",
    role: "BENDAHARA",
    seksi: "PIMPINAN",
    nama: "Ali Nurhakim",
    jabatan: "Bendahara P2KD",
    assignedTps: "SEMUA",
    isSuperAdmin: false,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  it("Developer, Ketua, dan Seksi 1 harus memiliki hak akses universal", () => {
    expect(isDeveloper(devUser)).toBe(true);
    expect(canAccessVoterData(devUser)).toBe(true);
    expect(isAuthorizedForVoterTps(devUser, "Tabung Pemilihan 01")).toBe(true);
    expect(isAuthorizedForVoterTps(devUser, "Tabung Pemilihan 13")).toBe(true);

    expect(isKetuaP2KD(ketuaUser)).toBe(true);
    expect(canAccessVoterData(ketuaUser)).toBe(true);
    expect(isAuthorizedForVoterTps(ketuaUser, "Tabung Pemilihan 05")).toBe(true);

    expect(isSeksiPemilih(seksi1User)).toBe(true);
    expect(canAccessVoterData(seksi1User)).toBe(true);
    expect(isAuthorizedForVoterTps(seksi1User, "Tabung Pemilihan 10")).toBe(true);
  });

  it("Pantarlih hanya boleh mengakses TPS/RW binaannya sendiri", () => {
    expect(isPantarlih(pantarlihRw1)).toBe(true);
    expect(canAccessVoterData(pantarlihRw1)).toBe(true);

    // Boleh akses tabung binaan (Tabung 01)
    expect(isAuthorizedForVoterTps(pantarlihRw1, "Tabung Pemilihan 01")).toBe(true);

    // DITOLAK jika mencoba akses tabung lain (Tabung 02, Tabung 13)
    expect(isAuthorizedForVoterTps(pantarlihRw1, "Tabung Pemilihan 02")).toBe(false);
    expect(isAuthorizedForVoterTps(pantarlihRw1, "Tabung Pemilihan 13")).toBe(false);
  });

  it("Role selain Pendaftaran Pemilih (misal: Bendahara) DITOLAK dari data pemilih", () => {
    expect(canAccessVoterData(bendaharaUser)).toBe(false);
    expect(isAuthorizedForVoterTps(bendaharaUser, "Tabung Pemilihan 01")).toBe(false);
  });
});
