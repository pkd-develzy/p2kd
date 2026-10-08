import { NextResponse } from "next/server";
import { SessionTracker } from "@/lib/session-tracker";
import { verifyAuthToken } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let sessionId = body?.sessionId;

    if (!sessionId) {
      const cookieToken = req.headers.get("cookie")?.split("; ").find(c => c.startsWith("admin_token="))?.split("=")[1];
      if (cookieToken) {
        const payload = verifyAuthToken(cookieToken) as Record<string, unknown> | null;
        if (payload && typeof payload.sessionId === "string") {
          sessionId = payload.sessionId;
        }
      }
    }

    if (sessionId) {
      await SessionTracker.recordLogout(sessionId);
    }
  } catch (err) {
    console.warn("[AUTH-LOGOUT] Session update notice:", err);
  }

  const response = NextResponse.json({
    success: true,
    message: "Sesi berhasil diakhiri dan dicatat di database.",
  });

  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
