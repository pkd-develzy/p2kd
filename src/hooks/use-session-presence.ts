"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, wipeAllSessionCaches } from "@/lib/cache-query-client";
import { useRouter } from "next/navigation";

export interface UserSessionInfo {
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

/**
 * Hook untuk memelihara status online/presence perangkat secara cerdas
 * tanpa membanjiri server dengan request yang berlebihan.
 */
export function useSessionPresence(username?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Ambil Session ID aktif dari storage
  const getSessionId = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const explicit = localStorage.getItem("p2kd_session_id");
      if (explicit) return explicit;
      const rawUser = localStorage.getItem("admin_user_data");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        return parsed.sessionId || null;
      }
    } catch {}
    return null;
  };

  // 2. Query daftar perangkat & sesi aktif
  const sessionsQuery = useQuery({
    queryKey: queryKeys.sessions(username || "all"),
    queryFn: async (): Promise<UserSessionInfo[]> => {
      const res = await fetch(`/api/admin/auth/session${username ? `?user=${username}` : ""}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 60 * 1000, // 1 menit
    refetchInterval: 90 * 1000, // Refetch setiap 90 detik di background
  });

  // 3. Heartbeat presence sender (setiap 2.5 menit saat tab aktif)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sendHeartbeat = async () => {
      const sessId = getSessionId();
      if (!sessId || document.visibilityState !== "visible") return;

      try {
        await fetch("/api/admin/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessId }),
        });
      } catch {}
    };

    // Kirim touch awal saat mount
    sendHeartbeat();

    // Heartbeat periodik 2.5 menit (150 detik)
    timerRef.current = setInterval(sendHeartbeat, 150 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 4. Mutation untuk mencabut sesi (Kick device lain)
  const revokeMutation = useMutation({
    mutationFn: async (sessionIdToRevoke: string) => {
      const res = await fetch(`/api/admin/auth/session?sessionId=${sessionIdToRevoke}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal mencabut sesi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(username || "all") });
    },
  });

  // 5. Safe Logout Method
  const logout = async () => {
    const currentSessionId = getSessionId();
    await wipeAllSessionCaches(queryClient, currentSessionId || undefined);
    router.replace("/admin");
  };

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    refetchSessions: sessionsQuery.refetch,
    revokeSession: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
    logout,
  };
}
