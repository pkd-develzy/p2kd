/**
 * In-Memory Sliding Window Rate Limiter for Next.js API Routes.
 * Protects sensitive endpoints (e.g. NIK verification, login, registration)
 * against brute-force, scraping, and denial-of-service attempts.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  const gcInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Remove records with all timestamps older than 10 minutes
      const validTimestamps = record.timestamps.filter((ts) => now - ts < 600000);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        record.timestamps = validTimestamps;
      }
    }
  }, 300000);

  if (gcInterval && typeof gcInterval.unref === "function") {
    gcInterval.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and records a request against a rate limit rule.
 * @param identifier Unique key (typically client IP + action name)
 * @param limit Maximum allowed requests within the time window
 * @param windowSeconds Window duration in seconds (e.g. 60 for 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const threshold = now - windowMs;

  const record = rateLimitStore.get(identifier) || { timestamps: [] };

  // Filter timestamps within current window
  const activeTimestamps = record.timestamps.filter((ts) => ts > threshold);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  // Record this request
  activeTimestamps.push(now);
  rateLimitStore.set(identifier, { timestamps: activeTimestamps });

  return {
    allowed: true,
    limit,
    remaining: limit - activeTimestamps.length,
    resetSeconds: windowSeconds,
  };
}

/**
 * Helper to extract client IP from incoming Next.js Request headers.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "127.0.0.1";
}
