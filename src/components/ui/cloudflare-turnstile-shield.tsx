"use client";

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  theme?: "light" | "dark" | "auto";
  variant?: "light" | "dark" | "glass";
  label?: string;
  className?: string;
}

export const CloudflareTurnstileShield = forwardRef<TurnstileShieldHandle, TurnstileShieldProps>(
  (
    {
      onVerify,
      isVerified = false,
      action = "form_submit",
      size = "flexible",
      theme,
      variant = "light",
      label = "Verifikasi Keamanan Sistem Berhasil • Cloudflare Turnstile",
      className,
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
    const [isWidgetMounted, setIsWidgetMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const siteKey =
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY || "";

    const effectiveTheme: "light" | "dark" | "auto" =
      theme || (variant === "dark" ? "dark" : "auto");
    const effectiveSize: "normal" | "compact" = size === "compact" ? "compact" : "normal";

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

      if (!siteKey) {
        setError("Konfigurasi Cloudflare Turnstile Site Key belum disetel.");
        setLoading(false);
        return;
      }

      const renderTurnstile = () => {
        if (isCancelled || !containerRef.current || !window.turnstile || !siteKey) return;
        if (widgetIdRef.current) return;

        try {
          if (containerRef.current) {
            containerRef.current.innerHTML = "";
          }

          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme: effectiveTheme,
            size: effectiveSize,
            appearance: "always",
            execution: "render",
            callback: (token: string) => {
              if (!isCancelled && token) {
                setIsWidgetMounted(true);
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
          setIsWidgetMounted(true);
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
    }, [siteKey, action, effectiveTheme, effectiveSize, resetWidget]);

    const containerClasses = cn(
      "w-full max-w-full overflow-hidden transition-all duration-200",
      variant === "dark"
        ? "rounded-2xl border border-white/10 bg-slate-950/60 p-2 sm:p-2.5 shadow-inner backdrop-blur-sm"
        : variant === "glass"
        ? "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-2 sm:p-2.5 shadow-inner"
        : "rounded-2xl border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-xs",
      className
    );

    return (
      <div className={containerClasses}>
        {/* Cloudflare Widget Render Target */}
        <div className="flex justify-center items-center w-full max-w-full overflow-hidden min-h-16.25">
          <div
            ref={containerRef}
            className="flex justify-center items-center w-[300px] max-w-full overflow-hidden [&_iframe]:max-w-full [&_iframe]:rounded-xl transition-transform origin-center scale-95 sm:scale-100 max-[350px]:scale-[0.85]"
          />
        </div>

        {!isWidgetMounted && loading && !isVerified && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>Menyiapkan proteksi keamanan Cloudflare Turnstile...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-rose-500 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isVerified && (
          <div
            className={cn(
              "flex items-center justify-between text-[11px] font-bold pt-1.5 px-1 border-t mt-1",
              variant === "dark"
                ? "text-emerald-400 border-white/10"
                : "text-emerald-700 border-slate-100"
            )}
          >
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{label}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">Protected</span>
          </div>
        )}
      </div>
    );
  }
);

CloudflareTurnstileShield.displayName = "CloudflareTurnstileShield";
