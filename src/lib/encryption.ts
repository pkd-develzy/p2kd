import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit recommended for GCM

export interface AuthTokenPayload {
  username: string;
  nama: string;
  role: string;
  seksi: string;
  assignedTps: string;
  isSuperAdmin: boolean;
  exp: number; // unix timestamp in seconds
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
 * Verifies a plain text password against stored hash.
 * Also supports fallback backward-compatibility for initial setup defaults.
 */
export function verifyPassword(plain: string, storedHashOrPlain: string): boolean {
  if (!plain || !storedHashOrPlain) return false;

  // 1. If stored in salt:hash format
  if (storedHashOrPlain.includes(":")) {
    const [salt, originalHash] = storedHashOrPlain.split(":");
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(plain, salt, 10000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(originalHash));
  }

  // 2. Fallback for plain initial seed default passwords (e.g. "p2kd2026")
  return plain === storedHashOrPlain;
}

/**
 * Generates a signed cryptographic HMAC SHA-256 session token.
 * Token structure: base64Url(payload) . signature
 */
export function generateAuthToken(payload: Omit<AuthTokenPayload, "exp">, expiresInSeconds = 86400): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload: AuthTokenPayload = { ...payload, exp };

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
