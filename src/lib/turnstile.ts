export interface SiteverifyResult {
  success: boolean;
  message?: string;
  errorCodes?: string[];
  action?: string;
  hostname?: string;
}

/**
 * Canonical server-side Cloudflare Turnstile siteverify helper
 * Follows Cloudflare official Turnstile Spin prompt specifications.
 */
export async function verifyTurnstileToken(
  token: unknown,
  clientIp?: string,
  expectedAction?: string
): Promise<SiteverifyResult> {
  const secret =
    process.env.TURNSTILE_SECRET ||
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    "0x4AAAAAAEx_itsAXbxebd32xo0FLqdOrZA";

  if (!secret) {
    // If no secret is configured, bypass check gracefully
    return { success: true };
  }

  if (
    typeof token !== "string" ||
    token.trim().length === 0 ||
    token.length > 2048
  ) {
    return {
      success: false,
      message: "Token verifikasi keamanan Turnstile tidak valid atau kosong.",
    };
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({
        secret,
        response: token.trim(),
        ...(clientIp ? { remoteip: clientIp } : {}),
      }),
    });

    if (!res.ok) {
      throw new Error(`siteverify returned HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        message: "Verifikasi keamanan Turnstile gagal atau telah kadaluarsa.",
        errorCodes: data["error-codes"],
      };
    }

    // Validate expected action if specified
    if (expectedAction && data.action && data.action !== expectedAction) {
      return {
        success: false,
        message: `Action token (${data.action}) tidak sesuai dengan yang diharapkan (${expectedAction}).`,
      };
    }

    // Validate expected hostname if configured
    const allowedHostnames = (process.env.TURNSTILE_HOSTNAMES ?? "p2kdkalisalak.my.id,www.p2kdkalisalak.my.id,localhost,127.0.0.1")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    if (allowedHostnames.length > 0 && data.hostname) {
      const incomingHost = data.hostname.toLowerCase();
      const isAllowed = allowedHostnames.some((h) => {
        // Exact match
        if (h === incomingHost) return true;
        // Support www <-> apex equivalence (e.g. p2kdkalisalak.my.id matches www.p2kdkalisalak.my.id)
        if (incomingHost === `www.${h}` || h === `www.${incomingHost}`) return true;
        // Subdomain matching
        if (incomingHost.endsWith(`.${h}`)) return true;
        // Vercel preview domains
        if (incomingHost.endsWith(".vercel.app")) return true;
        return false;
      });

      if (!isAllowed) {
        console.warn(`[Turnstile] Hostname mismatch: incoming=${data.hostname}, allowed=${allowedHostnames.join(", ")}`);
        return {
          success: false,
          message: `Hostname token (${data.hostname}) tidak diizinkan.`,
        };
      }
    }

    return {
      success: true,
      action: data.action,
      hostname: data.hostname,
    };
  } catch (err) {
    console.error("Cloudflare siteverify exception:", err);
    return {
      success: false,
      message: "Gagal memverifikasi keamanan dengan server Cloudflare.",
    };
  }
}
