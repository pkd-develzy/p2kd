import { describe, it, expect } from "vitest";
import { validateStageTransition } from "@/types/voter-stages";

describe("Audit & Validasi Transisi Alur Tahapan Pemilih P2KD Kalisalak", () => {
  // Skenario 1: Seluruh data masih berupa Calon DPS -> DPSHP harus 0 & Calon DPS tidak boleh loncat
  it("Skenario 1 & 8: Calon DPS dilarang langsung meloncat ke DPT tanpa melewati DPS dan DPSHP", () => {
    const res = validateStageTransition("CALON_DPS", "DPT");
    expect(res.allowed).toBe(false);
    expect(res.message).toContain("Transisi Ilegal");
  });

  it("Skenario 1b: Calon DPS dilarang langsung meloncat ke DPSHP tanpa pleno DPS", () => {
    const res = validateStageTransition("CALON_DPS", "DPSHP");
    expect(res.allowed).toBe(false);
    expect(res.message).toContain("Transisi Ilegal");
  });

  // Skenario 2: Data masuk ke DPS secara sah
  it("Skenario 2: Calon DPS sah ditetapkan menjadi DPS", () => {
    const res = validateStageTransition("CALON_DPS", "DPS");
    expect(res.allowed).toBe(true);
    expect(res.message).toContain("Valid");
  });

  // Skenario 3: DPS belum dibenahi -> dilarang ke DPSHP tanpa bukti pembenahan valid
  it("Skenario 3: DPS tanpa bukti pembenahan sah ditolak beralih ke DPSHP (DPSHP tetap 0)", () => {
    const res = validateStageTransition("DPS", "DPSHP", { hasValidCorrection: false });
    expect(res.allowed).toBe(false);
    expect(res.message).toContain("DPS hanya dapat beralih ke DPSHP jika memiliki bukti catatan pembenahan data yang sah");
  });

  // Skenario 4: DPS dengan pembenahan sah lolos verifikasi -> sah ke DPSHP
  it("Skenario 4: DPS dengan catatan pembenahan valid sah bertransisi ke DPSHP", () => {
    const res = validateStageTransition("DPS", "DPSHP", { hasValidCorrection: true });
    expect(res.allowed).toBe(true);
    expect(res.message).toContain("Valid");
  });

  // Skenario 5: DPS dilarang bypass langsung ke DPT
  it("Skenario 5: DPS dilarang langsung ditetapkan menjadi DPT tanpa melewati DPSHP", () => {
    const res = validateStageTransition("DPS", "DPT");
    expect(res.allowed).toBe(false);
    expect(res.message).toContain("Transisi Ilegal: DPS tidak boleh langsung ditetapkan ke DPT");
  });

  // Skenario 6: DPSHP sah ditetapkan menjadi DPT
  it("Skenario 6: Data DPSHP sah ditetapkan menjadi DPT pada sidang pleno final", () => {
    const res = validateStageTransition("DPSHP", "DPT");
    expect(res.allowed).toBe(true);
    expect(res.message).toContain("Valid: DPSHP sah ditetapkan menjadi DPT");
  });

  // Skenario 7: Pemilih tambahan (DPTb) dilarang langsung ke DPT
  it("Skenario 7: Pemilih tambahan (sumber DPTb) yang masih Calon DPS dilarang langsung menjadi DPT", () => {
    const res = validateStageTransition("CALON_DPS", "DPT", { sumberData: "DPTB" });
    expect(res.allowed).toBe(false);
    expect(res.message).toContain("Transisi Ilegal");
  });

  // Skenario 8: Rollback transisi bertingkat
  it("Skenario 8a: DPT sah di-rollback kembali ke DPSHP", () => {
    const res = validateStageTransition("DPT", "DPSHP");
    expect(res.allowed).toBe(true);
  });

  it("Skenario 8b: DPT dilarang di-rollback langsung melompati tahap ke Calon DPS", () => {
    const res = validateStageTransition("DPT", "CALON_DPS");
    expect(res.allowed).toBe(false);
  });

  it("Skenario 8c: DPSHP sah di-rollback ke DPS", () => {
    const res = validateStageTransition("DPSHP", "DPS");
    expect(res.allowed).toBe(true);
  });

  it("Skenario 8d: DPSHP dilarang langsung di-rollback ke Calon DPS", () => {
    const res = validateStageTransition("DPSHP", "CALON_DPS");
    expect(res.allowed).toBe(false);
  });

  it("Skenario 8e: DPS sah di-rollback ke Calon DPS", () => {
    const res = validateStageTransition("DPS", "CALON_DPS");
    expect(res.allowed).toBe(true);
  });

  // Skenario 9: Segel & Kunci DPT (Immutability Protection)
  it("Skenario 9: Jika DPT telah disegel dan dikunci digital, seluruh transisi ditolak", () => {
    const res1 = validateStageTransition("DPSHP", "DPT", { isDptLocked: true });
    expect(res1.allowed).toBe(false);
    expect(res1.message).toContain("DPT telah dikunci");

    const res2 = validateStageTransition("DPT", "DPSHP", { isDptLocked: true });
    expect(res2.allowed).toBe(false);
    expect(res2.message).toContain("DPT telah dikunci");
  });

  // Skenario 10: Idempoten & Transisi status sama
  it("Skenario 10: Transisi ke status yang sama ditolak tanpa mengubah database", () => {
    const res = validateStageTransition("DPS", "DPS");
    expect(res.allowed).toBe(false);
    expect(res.message).toContain("sudah berada pada tahap DPS");
  });

  // Skenario 11: Perhitungan unik pemilih DPSHP (Anti-Duplikasi Koreksi)
  it("Skenario 11: Satu pemilih memiliki banyak catatan pembenahan hanya dihitung 1 pemilih unik", () => {
    const corrections = [
      { id: "c1", pemilihId: "voter-001", statusValidasi: "VALID", isEligibleDpshp: true },
      { id: "c2", pemilihId: "voter-001", statusValidasi: "VALID", isEligibleDpshp: true },
      { id: "c3", pemilihId: "voter-002", statusValidasi: "VALID", isEligibleDpshp: true },
    ];

    const uniqueEligibleVoters = new Set(
      corrections.filter((c) => c.statusValidasi === "VALID" && c.isEligibleDpshp).map((c) => c.pemilihId)
    );

    expect(uniqueEligibleVoters.size).toBe(2);
  });

  // Skenario 12: Pembenahan berstatus PENDING atau DITOLAK tidak memenuhi syarat DPSHP
  it("Skenario 12: Pembenahan dengan status PENDING atau DITOLAK tidak dihitung sebagai DPSHP valid", () => {
    const corrections = [
      { id: "c1", pemilihId: "voter-001", statusValidasi: "PENDING", isEligibleDpshp: false },
      { id: "c2", pemilihId: "voter-002", statusValidasi: "DITOLAK", isEligibleDpshp: false },
    ];

    const validVoters = corrections.filter(
      (c) => c.statusValidasi === "VALID" && c.isEligibleDpshp === true
    );

    expect(validVoters.length).toBe(0);
  });
});
