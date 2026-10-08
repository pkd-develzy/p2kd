import { NextResponse } from "next/server";
import { SessionTracker } from "@/lib/session-tracker";
import { verifyAuthToken } from "@/lib/encryption";

export async function GET(req: Request) {
  try {
    const cookieToken = req.headers.get("cookie")?.split("; ").find(c => c.startsWith("admin_token="))?.split("=")[1];
    const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const token = cookieToken || authHeader;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    const url = new URL(req.url);
    const filterUsername = payload.isSuperAdmin ? url.searchParams.get("user") || undefined : payload.username;

    const sessions = await SessionTracker.getSessions(filterUsername);

    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length,
      activeCount: sessions.filter(s => s.isOnline).length,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, message: "Session ID wajib dikirim" }, { status: 400 });
    }

    const ok = await SessionTracker.touchSession(sessionId);
    return NextResponse.json({ success: ok });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, message: "Session ID wajib disertakan" }, { status: 400 });
    }

    const ok = await SessionTracker.revokeSession(sessionId);
    return NextResponse.json({ success: ok, message: ok ? "Sesi berhasil dicabut" : "Gagal mencabut sesi" });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
