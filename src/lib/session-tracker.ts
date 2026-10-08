import { getSupabaseAdmin, getSupabaseSeksi1Admin } from "./supabase";

export interface UserSessionRecord {
  id: string;
  userId: string;
  username: string;
  sessionId: string;
  deviceId: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  appVersion?: string | null;
  loginAt: string;
  lastSeenAt: string;
  logoutAt?: string | null;
  status: "ACTIVE" | "IDLE" | "LOGGED_OUT" | "EXPIRED" | "REVOKED";
  isOnline: boolean;
}

export class SessionTracker {
  private static getClient() {
    return getSupabaseSeksi1Admin() || getSupabaseAdmin();
  }

  /**
   * Mencatat login baru dan mendaftarkan sesi perangkat
   */
  public static async recordLogin(params: {
    userId: string;
    username: string;
    sessionId: string;
    deviceId: string;
    deviceInfo?: string;
    ipAddress?: string;
    appVersion?: string;
  }): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      await client.from("user_sessions").upsert(
        {
          user_id: params.userId,
          username: params.username,
          session_id: params.sessionId,
          device_id: params.deviceId,
          device_info: params.deviceInfo || "Web Browser",
          ip_address: params.ipAddress || "127.0.0.1",
          app_version: params.appVersion || "1.0.0",
          login_at: now,
          last_seen_at: now,
          status: "ACTIVE",
          updated_at: now,
        },
        { onConflict: "session_id" }
      );
    } catch (err) {
      console.warn("[SESSION-TRACKER] Gagal mencatat login sesi:", err);
    }
  }

  /**
   * Heartbeat periodik untuk memperbarui last_seen_at tanpa query berlebih
   */
  public static async touchSession(sessionId: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from("user_sessions")
        .update({
          last_seen_at: now,
          status: "ACTIVE",
          updated_at: now,
        })
        .eq("session_id", sessionId)
        .eq("status", "ACTIVE")
        .select("id")
        .maybeSingle();

      if (error || !data) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mencatat logout secara eksplisit dan mematikan sesi
   */
  public static async recordLogout(sessionId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      await client
        .from("user_sessions")
        .update({
          status: "LOGGED_OUT",
          logout_at: now,
          updated_at: now,
        })
        .eq("session_id", sessionId);
    } catch (err) {
      console.warn("[SESSION-TRACKER] Gagal mencatat logout sesi:", err);
    }
  }

  /**
   * Membaca seluruh sesi yang terdaftar untuk akun atau seluruh panitia
   */
  public static async getSessions(username?: string): Promise<UserSessionRecord[]> {
    try {
      const client = this.getClient();
      let query = client
        .from("user_sessions")
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(50);

      if (username && username !== "SEMUA") {
        query = query.eq("username", username);
      }

      const { data } = await query;
      if (!data) return [];

      const nowEpoch = Date.now();
      const onlineThresholdMs = 3 * 60 * 1000; // Aktif dalam 3 menit terakhir = Online

      return data.map((row: Record<string, unknown>) => {
        const lastSeenEpoch = new Date(String(row.last_seen_at || row.login_at)).getTime();
        const isRecent = nowEpoch - lastSeenEpoch < onlineThresholdMs;
        const status = String(row.status || "ACTIVE") as UserSessionRecord["status"];

        return {
          id: String(row.id),
          userId: String(row.user_id),
          username: String(row.username),
          sessionId: String(row.session_id),
          deviceId: String(row.device_id),
          deviceInfo: row.device_info ? String(row.device_info) : null,
          ipAddress: row.ip_address ? String(row.ip_address) : null,
          appVersion: row.app_version ? String(row.app_version) : "1.0.0",
          loginAt: String(row.login_at),
          lastSeenAt: String(row.last_seen_at),
          logoutAt: row.logout_at ? String(row.logout_at) : null,
          status,
          isOnline: status === "ACTIVE" && isRecent,
        };
      });
    } catch (err) {
      console.warn("[SESSION-TRACKER] Gagal mengambil daftar sesi:", err);
      return [];
    }
  }

  /**
   * Mencabut sesi tertentu secara paksa (Admin / Keamanan)
   */
  public static async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from("user_sessions")
        .update({
          status: "REVOKED",
          logout_at: now,
          updated_at: now,
        })
        .eq("session_id", sessionId);

      return !error;
    } catch {
      return false;
    }
  }
}
