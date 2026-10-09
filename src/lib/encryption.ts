import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit recommended for GCM

export interface AuthTokenPayload {
  username: string;
  nama: string;
  role: string;
  seksi: string;
  jabatan?: string;
  assignedTps: string;
  isSuperAdmin: boolean;
  sessionId?: string;
  exp: number; // unix timestamp in seconds
  iat?: number; // unix timestamp in seconds of token issuance
}

/**
 * Returns encryption key derived from environment or fallback for development.
 * Key must be 32 bytes (256 bits).
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "development_secret_key_32_bytes_len!";
  return crypto.createHash("sha256").update(secret).digest();
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || "daftarpemilih_jwt_secret_secure_key_2026";
}

/**
 * Encrypts sensitive text (e.g. NIK) using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex)
 */
export function encryptData(plainText: string): string {
  if (!plainText) return plainText;

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted string.
 */
export function decryptData(encryptedPayload: string): string {
  if (!encryptedPayload || !encryptedPayload.includes(":")) {
    return encryptedPayload;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedPayload.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) return encryptedPayload;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt data:", error);
    return "[DECRYPTION_FAILED]";
  }
}

/**
 * Creates a deterministic one-way SHA-256 hash for fast database lookups (indexed).
 * Also incorporates a salt from the environment for additional security.
 */
export function hashSearchIndex(value: string): string {
  if (!value) return "";
  const salt = process.env.SEARCH_HASH_SALT || "daftarpemilih_salt_2026";
  return crypto.createHash("sha256").update(`${value}:${salt}`).digest("hex");
}

/**
 * Masks NIK for privacy display (1 digit awal, 13 bintang, 2 digit terakhir: e.g. 3*************01).
 */
export function maskNIK(nik: string): string {
  if (!nik) return "****************";
  const clean = String(nik).trim();
  if (clean.length <= 3) return "****************";
  return `${clean.slice(0, 1)}*************${clean.slice(-2)}`;
}

/**
 * Masks KK for privacy display (1 digit awal, 13 bintang, 2 digit terakhir: e.g. 3*************01).
 */
export function maskKK(kk?: string): string {
  if (!kk) return "-";
  const clean = String(kk).trim();
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 1)}*************${clean.slice(-2)}`;
}

/**
 * Hashes password using PBKDF2 with a unique salt.
 * Output format: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Creates stored password format that combines one-way PBKDF2 hash
 * and AES-256-GCM reversible ciphertext for authorized administrative view:
 * Format: "salt:hash$$iv:authTag:cipher"
 */
export function createStoredPassword(password: string): string {
  const hash = hashPassword(password);
  const encrypted = encryptData(password);
  return `${hash}$$${encrypted}`;
}

/**
 * Resolves the currently active plain text password from stored record.
 * Handles dual-mode "$$cipher", plain text, and common default passwords.
 */
export function resolveActivePassword(storedHashOrPlain?: string, defaultFallback = "p2kd2026"): string {
  if (!storedHashOrPlain) return defaultFallback;

  // 1. If stored with reversible AES-256-GCM cipher
  if (storedHashOrPlain.includes("$$")) {
    const parts = storedHashOrPlain.split("$$");
    if (parts[1]) {
      const decrypted = decryptData(parts[1]);
      if (decrypted && decrypted !== "[DECRYPTION_FAILED]") {
        return decrypted;
      }
    }
  }

  // 2. If stored as direct plain text without ":"
  if (!storedHashOrPlain.includes(":")) {
    return storedHashOrPlain;
  }

  // 3. Test against common default passwords
  const candidates = [
    defaultFallback,
    "pantarlih123",
    "p2kd2026",
    "p2kd12345",
    "p2kd2027",
    "admin123",
    "12345678",
    "123456789",
    "kalisalak2026",
    "kalisalak2027",
    "admin_kalisalak",
  ];

  for (const candidate of candidates) {
    if (verifyPassword(candidate, storedHashOrPlain)) {
      return candidate;
    }
  }

  return defaultFallback;
}

/**
 * Verifies a plain text password against stored hash or dual-mode hash.
 * Also supports fallback backward-compatibility for initial setup defaults.
 */
export function verifyPassword(plain: string, storedHashOrPlain: string): boolean {
  if (!plain || !storedHashOrPlain) return false;

  // Strip cipher suffix if stored in "salt:hash$$cipher" format
  const hashPart = storedHashOrPlain.includes("$$")
    ? storedHashOrPlain.split("$$")[0]
    : storedHashOrPlain;

  // 1. If stored in salt:hash format
  if (hashPart.includes(":")) {
    const [salt, originalHash] = hashPart.split(":");
    if (!salt || !originalHash) return false;
    try {
      const computedHash = crypto.pbkdf2Sync(plain, salt, 10000, 64, "sha512").toString("hex");
      const bufComputed = Buffer.from(computedHash);
      const bufOriginal = Buffer.from(originalHash);
      if (bufComputed.length !== bufOriginal.length) return false;
      return crypto.timingSafeEqual(bufComputed, bufOriginal);
    } catch {
      return false;
    }
  }

  // 2. Fallback for plain initial seed default passwords (e.g. "p2kd2026")
  return plain === hashPart;
}

/**
 * Generates a signed cryptographic HMAC SHA-256 session token.
 * Token structure: base64Url(payload) . signature
 */
export function generateAuthToken(payload: Omit<AuthTokenPayload, "exp" | "iat">, expiresInSeconds = 172800): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;
  const fullPayload: AuthTokenPayload = { iat: now, ...payload, exp };

  const payloadEncoded = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const secret = getJwtSecret();
  const signature = crypto.createHmac("sha256", secret).update(payloadEncoded).digest("base64url");

  return `${payloadEncoded}.${signature}`;
}

/**
 * Verifies and decodes an HMAC SHA-256 session token.
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  try {
    const [payloadEncoded, signature] = token.split(".");
    if (!payloadEncoded || !signature) return null;

    const secret = getJwtSecret();
    const expectedSignature = crypto.createHmac("sha256", secret).update(payloadEncoded).digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadEncoded, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as AuthTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
