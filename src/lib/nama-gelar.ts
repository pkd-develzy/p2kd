/**
 * Utility Pemformatan Nama & Gelar Resmi P2KD Desa Kalisalak
 *
 * Aturan:
 * 1. Semua nama orang wajib HURUF BALOK / KAPITAL BESAR SEMUA (contoh: "KHASANUDIN", "LINDA FARIDA", "M. LU'LU KHULALUDIN").
 * 2. Gelar akademik, keagamaan, profesi, dan kehormatan TETAP mempertahankan kaidah penulisan gelar standar (contoh: "S.Pd", "S.Pd.SD", "Drs.", "dr.", "H.", "M.Si", "Ph.D").
 */

/** Kamus Gelar Depan Resmi */
export const GELAR_DEPAN_MAP: Record<string, string> = {
  dr: "dr.",
  "dr.": "dr.",
  drg: "drg.",
  "drg.": "drg.",
  apt: "apt.",
  "apt.": "apt.",
  drh: "drh.",
  "drh.": "drh.",
  drb: "drb.",
  "drb.": "drb.",
  prof: "Prof.",
  "prof.": "Prof.",
  ir: "Ir.",
  "ir.": "Ir.",
  drs: "Drs.",
  "drs.": "Drs.",
  dra: "Dra.",
  "dra.": "Dra.",
  h: "H.",
  "h.": "H.",
  hj: "Hj.",
  "hj.": "Hj.",
  kh: "KH.",
  "kh.": "KH.",
  "k.h.": "K.H.",
  "k.h": "K.H.",
  ust: "Ust.",
  "ust.": "Ust.",
  ustadz: "Ustadz",
  ustadzah: "Ustadzah",
  gus: "Gus",
  raden: "Raden",
  r: "R.",
  "r.": "R.",
  tb: "Tb.",
  "tb.": "Tb.",
  st: "St.",
  "st.": "St.",
};

/** Kamus Gelar Belakang Akademik & Profesi Resmi */
export const GELAR_BELAKANG_MAP: Record<string, string> = {
  // Sarjana (S1 / S.Tr)
  "s.pd": "S.Pd",
  "s.pd.": "S.Pd.",
  "s.pd.sd": "S.Pd.SD",
  "s.pd.sd.": "S.Pd.SD.",
  "s.pd.i": "S.Pd.I",
  "s.pd.i.": "S.Pd.I.",
  "s.pd.aud": "S.Pd.Aud",
  "s.pd.aud.": "S.Pd.Aud.",
  "s.e": "S.E",
  "s.e.": "S.E.",
  "s.t": "S.T",
  "s.t.": "S.T.",
  "s.kom": "S.Kom",
  "s.kom.": "S.Kom.",
  "s.sos": "S.Sos",
  "s.sos.": "S.Sos.",
  "s.h": "S.H",
  "s.h.": "S.H.",
  "s.ag": "S.Ag",
  "s.ag.": "S.Ag.",
  "s.ked": "S.Ked",
  "s.ked.": "S.Ked.",
  "s.si": "S.Si",
  "s.si.": "S.Si.",
  "s.farm": "S.Farm",
  "s.farm.": "S.Farm.",
  "s.gz": "S.Gz",
  "s.gz.": "S.Gz.",
  "s.sn": "S.Sn",
  "s.sn.": "S.Sn.",
  "s.ip": "S.IP",
  "s.ip.": "S.IP.",
  "s.ap": "S.AP",
  "s.ap.": "S.AP.",
  "s.psi": "S.Psi",
  "s.psi.": "S.Psi.",
  "s.p": "S.P",
  "s.p.": "S.P.",
  "s.pt": "S.Pt",
  "s.pt.": "S.Pt.",
  "s.pi": "S.Pi",
  "s.pi.": "S.Pi.",
  "s.hut": "S.Hut",
  "s.hut.": "S.Hut.",
  "s.kel": "S.Kel",
  "s.kel.": "S.Kel.",
  "s.ak": "S.Ak",
  "s.ak.": "S.Ak.",
  "s.stat": "S.Stat",
  "s.stat.": "S.Stat.",
  "s.mat": "S.Mat",
  "s.mat.": "S.Mat.",
  "s.bio": "S.Bio",
  "s.bio.": "S.Bio.",
  "s.tr": "S.Tr",
  "s.tr.": "S.Tr.",
  "s.tr.t": "S.Tr.T",
  "s.tr.t.": "S.Tr.T.",
  "s.tr.kom": "S.Tr.Kom",
  "s.tr.kom.": "S.Tr.Kom.",
  "s.f.u": "S.F.U",
  "s.f.u.": "S.F.U.",

  // Magister (S2)
  "m.m": "M.M",
  "m.m.": "M.M.",
  "m.pd": "M.Pd",
  "m.pd.": "M.Pd.",
  "m.pd.i": "M.Pd.I",
  "m.pd.i.": "M.Pd.I.",
  "m.si": "M.Si",
  "m.si.": "M.Si.",
  "m.t": "M.T",
  "m.t.": "M.T.",
  "m.kom": "M.Kom",
  "m.kom.": "M.Kom.",
  "m.h": "M.H",
  "m.h.": "M.H.",
  "m.ag": "M.Ag",
  "m.ag.": "M.Ag.",
  "m.sc": "M.Sc",
  "m.sc.": "M.Sc.",
  "m.kes": "M.Kes",
  "m.kes.": "M.Kes.",
  "m.psi": "M.Psi",
  "m.psi.": "M.Psi.",
  "m.farm": "M.Farm",
  "m.farm.": "M.Farm.",
  "m.sn": "M.Sn",
  "m.sn.": "M.Sn.",
  "m.ip": "M.IP",
  "m.ip.": "M.IP.",
  "m.ap": "M.AP",
  "m.ap.": "M.AP.",
  "m.ak": "M.Ak",
  "m.ak.": "M.Ak.",
  "m.hum": "M.Hum",
  "m.hum.": "M.Hum.",
  mba: "MBA",

  // Doktoral (S3) & Internasional
  "ph.d": "Ph.D",
  "ph.d.": "Ph.D.",
  "ed.d": "Ed.D",
  "ed.d.": "Ed.D.",
  "d.sc": "D.Sc",
  "d.sc.": "D.Sc.",

  // Diploma (D1 - D4)
  "a.md": "A.Md",
  "a.md.": "A.Md.",
  "a.md.kom": "A.Md.Kom",
  "a.md.kom.": "A.Md.Kom.",
  "a.md.keb": "A.Md.Keb",
  "a.md.keb.": "A.Md.Keb.",
  "a.md.kep": "A.Md.Kep",
  "a.md.kep.": "A.Md.Kep.",
  "a.md.farm": "A.Md.Farm",
  "a.md.farm.": "A.Md.Farm.",
  "a.ma": "A.Ma",
  "a.ma.": "A.Ma.",
  "a.ma.pd": "A.Ma.Pd",
  "a.ma.pd.": "A.Ma.Pd.",

  // Gelar Asing / Profesi
  "b.sc": "B.Sc",
  "b.sc.": "B.Sc.",
  "b.a": "B.A",
  "b.a.": "B.A.",
  "b.eng": "B.Eng",
  "b.eng.": "B.Eng.",
  "m.a": "M.A",
  "m.a.": "M.A.",
  "m.eng": "M.Eng",
  "m.eng.": "M.Eng.",
  "sp.a": "Sp.A",
  "sp.a.": "Sp.A.",
  "sp.b": "Sp.B",
  "sp.b.": "Sp.B.",
  "sp.pd": "Sp.PD",
  "sp.pd.": "Sp.PD.",
  "sp.og": "Sp.OG",
  "sp.og.": "Sp.OG.",
  "sp.rad": "Sp.Rad",
  "sp.rad.": "Sp.Rad.",
  "sp.an": "Sp.An",
  "sp.an.": "Sp.An.",
  "sp.m": "Sp.M",
  "sp.m.": "Sp.M.",
  "sp.tht": "Sp.THT",
  "sp.tht.": "Sp.THT.",
  "sp.s": "Sp.S",
  "sp.s.": "Sp.S.",
  "sp.jp": "Sp.JP",
  "sp.jp.": "Sp.JP.",
  "sp.kfr": "Sp.KFR",
  "sp.kfr.": "Sp.KFR.",
  lc: "Lc",
  "lc.": "Lc.",
  cpa: "CPA",
  ca: "CA",
  cfp: "CFP",
  cfa: "CFA",
  gr: "Gr.",
  "gr.": "Gr.",
  ns: "Ns.",
  "ns.": "Ns.",
};

/**
 * Format satu kata/segmen gelar depan
 */
export function formatGelarDepan(gelarRaw?: string): string {
  if (!gelarRaw || typeof gelarRaw !== "string") return "";
  const words = gelarRaw.trim().split(/\s+/).filter(Boolean);
  const formattedWords = words.map((w, idx) => {
    const lower = w.toLowerCase();
    if (GELAR_DEPAN_MAP[lower]) {
      // Jika diawali Prof., maka Dr. berikutnya adalah Doktor (S3), bukan dokter
      if ((lower === "dr" || lower === "dr.") && idx > 0) {
        return "Dr.";
      }
      return GELAR_DEPAN_MAP[lower];
    }
    // Jika ada titik seperti Dr. atau Drs.
    if (w.includes(".")) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
  return formattedWords.join(" ");
}

/**
 * Format satu segmen gelar belakang (misal "S.Pd.SD" atau "M.Si.")
 */
export function formatGelarBelakang(gelarRaw?: string): string {
  if (!gelarRaw || typeof gelarRaw !== "string") return "";
  // Split jika terdapat koma di dalam string gelar belakang
  const segments = gelarRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const formattedSegments = segments.map((seg) => {
    const lower = seg.toLowerCase();
    if (GELAR_BELAKANG_MAP[lower]) {
      return GELAR_BELAKANG_MAP[lower];
    }
    // Fallback cerdas berdasarkan dot: X.Yy.Zz
    if (seg.includes(".")) {
      return seg
        .split(".")
        .map((part) => {
          if (!part) return "";
          if (part.length === 1) return part.toUpperCase();
          const pLower = part.toLowerCase();
          if (["sd", "ip", "ap", "og", "pd", "tht", "jp", "kfr", "fu"].includes(pLower)) {
            return part.toUpperCase();
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join(".");
    }
    return seg;
  });
  return formattedSegments.join(", ");
}

/**
 * Format nama orang saja menjadi HURUF BALOK (kapital besar semua)
 */
export function formatNamaSaja(namaRaw?: string): string {
  if (!namaRaw || typeof namaRaw !== "string") return "";
  return namaRaw.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Fungsi Utama: Format Nama Lengkap Beserta Gelar
 *
 * Mengubah nama menjadi huruf balok besar semua, namun mempertahankan
 * kaidah penulisan gelar resmi (Depan & Belakang).
 *
 * Contoh:
 * - "khasanudin, s.pd.sd"        -> "KHASANUDIN, S.Pd.SD"
 * - "Linda Farida, S.Pd"         -> "LINDA FARIDA, S.Pd"
 * - "Drs. slamet riyadi, m.si"   -> "Drs. SLAMET RIYADI, M.Si"
 * - "dr. budi santoso, sp.a"     -> "dr. BUDI SANTOSO, Sp.A"
 * - "m. lu'lu khulaludin, s.f.u" -> "M. LU'LU KHULALUDIN, S.F.U"
 * - "yani yuswanti"              -> "YANI YUSWANTI"
 * - "Linda Farida S.Pd"          -> "LINDA FARIDA, S.Pd"
 */
export function formatNamaGelar(raw?: string): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  // 1. Pisahkan berdasarkan koma untuk memisahkan nama utama dan gelar belakang
  const parts = trimmed
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";

  let namePart = parts[0];
  const backTitles = parts.slice(1);

  // 2. Jika tidak ada koma, cek apakah kata terakhir adalah gelar belakang yang dikenal
  if (backTitles.length === 0) {
    const words = namePart.split(" ");
    if (words.length > 1) {
      const lastWord = words[words.length - 1];
      const lastLower = lastWord.toLowerCase();
      if (
        GELAR_BELAKANG_MAP[lastLower] ||
        (lastLower.includes(".") && (lastLower.startsWith("s.") || lastLower.startsWith("m.") || lastLower.startsWith("a.")))
      ) {
        backTitles.push(words.pop() || "");
        namePart = words.join(" ");
      }
    }
  }

  // 3. Parse front titles dari namePart
  const words = namePart.split(" ").filter(Boolean);
  const frontTitles: string[] = [];
  const coreNameWords: string[] = [];

  let inFrontTitleZone = true;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wLower = w.toLowerCase();

    if (inFrontTitleZone && GELAR_DEPAN_MAP[wLower]) {
      if ((wLower === "dr" || wLower === "dr.") && (w.startsWith("Dr") || w.startsWith("DR"))) {
        frontTitles.push("Dr.");
      } else if ((wLower === "dr" || wLower === "dr.") && frontTitles.length > 0) {
        // Didahului gelar lain (misal Prof.), maka merupakan Doktor (Dr.)
        frontTitles.push("Dr.");
      } else {
        frontTitles.push(GELAR_DEPAN_MAP[wLower]);
      }
    } else {
      inFrontTitleZone = false;
      coreNameWords.push(w);
    }
  }

  // Jika semua kata terdeteksi sebagai front title tapi nama kosong, ambil kata terakhir sebagai nama
  let coreName = coreNameWords.join(" ").toUpperCase();
  if (!coreName && frontTitles.length > 0) {
    coreName = (frontTitles.pop() || "").toUpperCase();
  }

  const formattedFront = frontTitles.length > 0 ? frontTitles.join(" ") : "";
  const formattedBack = backTitles.length > 0 ? formatGelarBelakang(backTitles.join(", ")) : "";

  let result = "";
  if (formattedFront) {
    result += formattedFront + " ";
  }
  result += coreName;
  if (formattedBack) {
    result += ", " + formattedBack;
  }

  return result.trim();
}

/**
 * Memecah nama menjadi komponen: gelarDepan, namaLengkap (balok), gelarBelakang
 */
export function pisahkanNamaDanGelar(raw?: string): {
  gelarDepan: string;
  namaLengkap: string;
  gelarBelakang: string;
} {
  if (!raw || typeof raw !== "string") {
    return { gelarDepan: "", namaLengkap: "", gelarBelakang: "" };
  }

  const full = formatNamaGelar(raw);
  const parts = full.split(",").map((p) => p.trim());
  const gelarBelakang = parts.slice(1).join(", ");

  const namePart = parts[0] || "";
  const words = namePart.split(" ").filter(Boolean);

  const frontWords: string[] = [];
  const nameWords: string[] = [];

  let inFront = true;
  for (const w of words) {
    const lower = w.toLowerCase();
    if (inFront && GELAR_DEPAN_MAP[lower]) {
      frontWords.push(w);
    } else {
      inFront = false;
      nameWords.push(w);
    }
  }

  return {
    gelarDepan: frontWords.join(" "),
    namaLengkap: nameWords.join(" ").toUpperCase(),
    gelarBelakang,
  };
}
