/**
 * DEFINISI RESMI TAHAPAN DATA PEMILIH P2KD KALISALAK
 *
 * Alur Pemilih Reguler:
 * CALON DPS -> DPS -> DPSHP -> DPT
 *
 * Alur Pemilih Tambahan (DPTb):
 * DPTb (Sumber) -> DPS -> DPSHP -> DPT
 */

export type VoterStage = "CALON_DPS" | "DPS" | "DPSHP" | "DPT";
export type VoterSource = "REGULER" | "DPTB";

export type PembenahanType =
  | "KOREKSI_IDENTITAS"
  | "MUTASI_WILAYAH"
  | "TANGGAPAN_MASYARAKAT"
  | "PEMBENAHAN_DISABILITAS"
  | "DPTB_VERIFIKASI";

export type ValidationStatus = "PENDING" | "VALID" | "DITOLAK";

export interface VoterStageHistoryItem {
  id: string;
  pemilihId: string;
  tahapAsal: VoterStage;
  tahapTujuan: VoterStage;
  alasan: string;
  petugas: string;
  rolePetugas: string;
  batchRef?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface VoterCorrectionItem {
  id: string;
  pemilihId: string;
  tahapAsal: VoterStage;
  jenisPembenahan: PembenahanType;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  alasan: string;
  statusValidasi: ValidationStatus;
  isEligibleDpshp: boolean;
  petugasPengusul: string;
  petugasPemvalidasi?: string;
  validatedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Validasi Transisi Status Tahapan Pemilih (Strict State Machine)
 */
export function validateStageTransition(
  fromStage: string | undefined | null,
  toStage: string,
  options?: {
    isDptLocked?: boolean;
    hasValidCorrection?: boolean;
    sumberData?: VoterSource;
  }
): { allowed: boolean; message: string } {
  const currentStage: VoterStage = (fromStage ? fromStage.toUpperCase() : "CALON_DPS") as VoterStage;
  const targetStage: VoterStage = toStage.toUpperCase() as VoterStage;

  if (options?.isDptLocked && (currentStage === "DPT" || targetStage === "DPT")) {
    return {
      allowed: false,
      message: "Akses Ditolak: DPT telah dikunci dan disegel secara digital. Tidak dapat mengubah tahapan.",
    };
  }

  if (currentStage === targetStage) {
    return {
      allowed: false,
      message: `Pemilih sudah berada pada tahap ${targetStage}. Tidak ada perubahan status.`,
    };
  }

  // 1. Dari CALON_DPS
  if (currentStage === "CALON_DPS") {
    if (targetStage === "DPS") {
      return { allowed: true, message: "Valid: Calon DPS ditetapkan menjadi DPS." };
    }
    if (targetStage === "DPSHP") {
      return {
        allowed: false,
        message: "Transisi Ilegal: Calon DPS tidak dapat langsung menjadi DPSHP tanpa penetapan pleno DPS.",
      };
    }
    if (targetStage === "DPT") {
      return {
        allowed: false,
        message: "Transisi Ilegal: Calon DPS dilarang langsung ditetapkan menjadi DPT tanpa melewati tahap DPS dan DPSHP.",
      };
    }
  }

  // 2. Dari DPS
  if (currentStage === "DPS") {
    if (targetStage === "DPSHP") {
      if (!options?.hasValidCorrection) {
        return {
          allowed: false,
          message:
            "Transisi Ilegal: DPS hanya dapat beralih ke DPSHP jika memiliki bukti catatan pembenahan data yang sah dan lolos verifikasi.",
        };
      }
      return { allowed: true, message: "Valid: DPS yang dibenahi ditetapkan menjadi DPSHP." };
    }
    if (targetStage === "CALON_DPS") {
      return { allowed: true, message: "Valid: Rollback penetapan DPS kembali ke Calon DPS." };
    }
    if (targetStage === "DPT") {
      return {
        allowed: false,
        message:
          "Transisi Ilegal: DPS tidak boleh langsung ditetapkan ke DPT. Harus melalui tahap pembenahan DPSHP terlebih dahulu.",
      };
    }
  }

  // 3. Dari DPSHP
  if (currentStage === "DPSHP") {
    if (targetStage === "DPT") {
      return { allowed: true, message: "Valid: DPSHP sah ditetapkan menjadi DPT pada sidang pleno final." };
    }
    if (targetStage === "DPS") {
      return { allowed: true, message: "Valid: Rollback penetapan DPSHP kembali ke DPS." };
    }
    if (targetStage === "CALON_DPS") {
      return {
        allowed: false,
        message: "Transisi Ilegal: Rollback dari DPSHP harus melalui tahap DPS terlebih dahulu.",
      };
    }
  }

  // 4. Dari DPT
  if (currentStage === "DPT") {
    if (targetStage === "DPSHP") {
      return { allowed: true, message: "Valid: Pembatalan penetapan DPT dikembalikan ke status DPSHP." };
    }
    return {
      allowed: false,
      message: `Transisi Ilegal: DPT tidak dapat langsung diubah ke ${targetStage}.`,
    };
  }

  return { allowed: false, message: `Transisi tidak dikenal dari ${currentStage} ke ${targetStage}.` };
}
