"use client";

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          appearance?: "always" | "execute" | "interaction-only";
          execution?: "render" | "execute";
          callback?: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export interface TurnstileShieldHandle {
  reset: () => void;
}

interface TurnstileShieldProps {
  onVerify: (token: string) => void;
  isVerified?: boolean;
  action?: string;
  size?: "normal" | "compact" | "flexible";
  label?: string;
}

const DEFAULT_SITE_KEY = "0x4AAAAAAEx_igNuBYRNZzT3";

export const CloudflareTurnstileShield = forwardRef<TurnstileShieldHandle, TurnstileShieldProps>(
  (
    {
      onVerify,
      isVerified = false,
      action = "form_submit",
      size = "normal",
      label = "Verifikasi Keamanan Sistem Berhasil • Cloudflare Turnstile",
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onVerifyRef = useRef(onVerify);

    useEffect(() => {
      onVerifyRef.current = onVerify;
    }, [onVerify]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const siteKey =
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY || DEFAULT_SITE_KEY;

    const resetWidget = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
          onVerifyRef.current("");
          setLoading(true);
          setError(null);
        } catch (e) {
          console.warn("Turnstile reset warning:", e);
        }
      }
    }, []);

    useImperativeHandle(ref, () => ({
      reset: resetWidget,
    }));

    useEffect(() => {
      let isCancelled = false;

      const renderTurnstile = () => {
        if (isCancelled || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) return;

        try {
          if (containerRef.current) {
            containerRef.current.innerHTML = "";
          }

          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme: "light",
            size,
            appearance: "always",
            execution: "render",
            callback: (token: string) => {
              if (!isCancelled && token) {
                setLoading(false);
                setError(null);
                onVerifyRef.current(token);
              }
            },
            "error-callback": (code?: string) => {
              if (!isCancelled) {
                setLoading(false);
                setError(
                  code ? `Verifikasi keamanan Turnstile gagal (${code}).` : "Verifikasi keamanan gagal. Silakan muat ulang halaman."
                );
              }
            },
            "expired-callback": () => {
              if (!isCancelled) {
                onVerifyRef.current("");
                resetWidget();
              }
            },
          });
          setLoading(false);
        } catch (err) {
          console.error("Turnstile render error:", err);
          if (!isCancelled) {
            setLoading(false);
          }
        }
      };

      if (window.turnstile) {
        renderTurnstile();
      } else {
        const scriptId = "cf-turnstile-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          script.onload = () => {
            renderTurnstile();
          };
          script.onerror = () => {
            if (!isCancelled) {
              setLoading(false);
              setError("Gagal memuat skrip keamanan Cloudflare Turnstile.");
            }
          };
          document.head.appendChild(script);
        } else {
          const interval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(interval);
              renderTurnstile();
            }
          }, 100);
          return () => clearInterval(interval);
        }
      }

      return () => {
        isCancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore cleanup errors during fast refresh
          }
          widgetIdRef.current = null;
        }
      };
    }, [siteKey, action, size, resetWidget]);

    return (
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs">
        {/* Cloudflare Widget Render Target */}
        <div ref={containerRef} className="flex justify-center min-h-16.25" />

        {loading && !isVerified && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Menyiapkan proteksi keamanan Cloudflare Turnstile...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-rose-600 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isVerified && (
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 pt-1.5 px-1 border-t border-slate-100 mt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {label}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Protected by Turnstile</span>
          </div>
        )}
      </div>
    );
  }
);

CloudflareTurnstileShield.displayName = "CloudflareTurnstileShield";
