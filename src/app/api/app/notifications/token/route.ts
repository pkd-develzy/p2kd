import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-middleware";
import { SupabaseDbService } from "@/lib/supabase-db";

// In-memory fallback token cache to ensure resilience even if database table is not yet migrated
const activeTokens = new Map<string, { username: string; role: string; deviceModel?: string; updatedAt: string }>();

export async function POST(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const body = await req.json();
    const token = (body.token || "").trim();
    const deviceModel = body.deviceModel || "Android Device";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token FCM tidak boleh kosong." },
        { status: 400 }
      );
    }

    const user = session.user;
    const now = new Date().toISOString();

    // Simpan ke in-memory cache
    activeTokens.set(token, {
      username: user.username,
      role: user.role,
      deviceModel,
      updatedAt: now,
    });

    // Coba simpan ke Supabase jika tabel device_tokens tersedia
    try {
      const client = SupabaseDbService.adminClient;
      await client.from("device_tokens").upsert({
        fcm_token: token,
        username: user.username,
        role: user.role,
        device_model: deviceModel,
        updated_at: now,
      }, { onConflict: "fcm_token" });
    } catch (dbErr) {
      // Graceful fallback jika tabel belum di-create di Supabase
      console.warn("FCM token DB persist fallback to memory:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Token perangkat berhasil didaftarkan.",
      tokenPreview: token.substring(0, 10) + "...",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error registering FCM token:", errorMsg);
    return NextResponse.json(
      { success: false, message: "Gagal mendaftarkan token perangkat: " + errorMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    const body = await req.json().catch(() => ({}));
    const token = (body.token || "").trim();
    const user = session.user;

    if (token) {
      activeTokens.delete(token);
    } else {
      // Hapus seluruh token milik user yang logout
      for (const [k, v] of activeTokens.entries()) {
        if (v.username === user.username) {
          activeTokens.delete(k);
        }
      }
    }

    try {
      const client = SupabaseDbService.adminClient;
      if (token) {
        await client.from("device_tokens").delete().eq("fcm_token", token);
      } else {
        await client.from("device_tokens").delete().eq("username", user.username);
      }
    } catch (dbErr) {
      console.warn("FCM token DB delete fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Token perangkat berhasil dicabut.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error revoking FCM token:", errorMsg);
    return NextResponse.json(
      { success: false, message: "Gagal mencabut token perangkat: " + errorMsg },
      { status: 500 }
    );
  }
}
