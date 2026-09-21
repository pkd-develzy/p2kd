import { NextResponse } from "next/server";
import { verifyAuthToken, AuthTokenPayload } from "./encryption";

export interface SessionVerificationResult {
  authenticated: boolean;
  user?: AuthTokenPayload;
  response?: NextResponse;
}

/**
 * Validates admin request authentication token from Authorization header or cookie.
 */
export function verifyAdminSession(req: Request): SessionVerificationResult {
  let token: string | null = null;

  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check Cookie if header not present
  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin_token=([^;]+)/);
    if (match && match[1]) {
      token = match[1];
    }
  }

  if (!token) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Akses Ditolak: Anda belum login atau tidak memiliki token otorisasi yang sah.",
        },
        { status: 401 }
      ),
    };
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          success: false,
          code: "INVALID_SESSION",
          message: "Akses Ditolak: Sesi Anda telah berakhir atau tanda tangan token tidak valid. Silakan login kembali.",
        },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    user: payload,
  };
}

export function isDeveloper(user?: AuthTokenPayload): boolean {
  if (!user) return false;
  const username = (user.username || "").toLowerCase();
  const role = (user.role || "").toUpperCase();
  return username === "develzy" || role === "DEVELOPER";
}

export function isKetuaP2KD(user?: AuthTokenPayload): boolean {
  if (!user) return false;
  const username = (user.username || "").toLowerCase();
  const jabatan = (user.jabatan || user.nama || "").toLowerCase();
  if (username === "khasanudin" || username === "admin_kalisalak") return true;
  return (
    jabatan.includes("ketua") &&
    !jabatan.includes("seksi") &&
    !jabatan.includes("wakil")
  );
}

export function isSeksiPemilih(user?: AuthTokenPayload): boolean {
  if (!user) return false;
  const seksi = (user.seksi || "").toUpperCase();
  const role = (user.role || "").toUpperCase();
  const username = (user.username || "").toLowerCase();
  const jabatan = (user.jabatan || user.nama || "").toLowerCase();
  return (
    seksi === "SEKSI_PEMILIH" ||
    role === "SEKSI_PEMILIH" ||
    username.includes("pemilih") ||
    jabatan.includes("pendaftaran pemilih") ||
    jabatan.includes("seksi 1")
  );
}

export function isPantarlih(user?: AuthTokenPayload): boolean {
  if (!user) return false;
  const seksi = (user.seksi || "").toUpperCase();
  const role = (user.role || "").toUpperCase();
  const username = (user.username || "").toLowerCase();
  const jabatan = (user.jabatan || user.nama || "").toLowerCase();
  return (
    role === "PETUGAS_TPS" ||
    role === "PANTARLIH" ||
    seksi === "PANTARLIH_LAPANGAN" ||
    username.startsWith("pps") ||
    username.includes("pantarlih") ||
    jabatan.includes("pantarlih") ||
    (Boolean(user.assignedTps) && user.assignedTps !== "SEMUA")
  );
}

/**
 * Enforces Strict RBAC:
 * ONLY Developer, Ketua P2KD, Seksi 1, and Pantarlih (assigned RW only) can access voter data.
 * All other roles (Sekretaris, Bendahara, Seksi 2, 3, 4, 5) are strictly denied.
 */
export function canAccessVoterData(user?: AuthTokenPayload): boolean {
  if (!user) return false;
  return isDeveloper(user) || isKetuaP2KD(user) || isSeksiPemilih(user) || isPantarlih(user);
}

/**
 * Validates if the user is authorized to view or mutate a voter from a specific TPS/RW.
 * Developer, Ketua, and Seksi 1 have universal access (all TPS).
 * Pantarlih can ONLY access their own assigned TPS/RW.
 */
export function isAuthorizedForVoterTps(user: AuthTokenPayload, voterTps: string): boolean {
  if (isDeveloper(user) || isKetuaP2KD(user) || isSeksiPemilih(user)) {
    return true;
  }
  if (isPantarlih(user)) {
    if (!user.assignedTps || user.assignedTps === "SEMUA") {
      return false;
    }
    const cleanUserTps = user.assignedTps.toLowerCase().replace(/[^0-9]/g, "");
    const cleanVoterTps = (voterTps || "").toLowerCase().replace(/[^0-9]/g, "");
    return cleanUserTps !== "" && cleanUserTps === cleanVoterTps;
  }
  return false;
}
