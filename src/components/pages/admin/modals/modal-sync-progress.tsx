"use client";

import React from "react";
import { ShieldCheck, Database, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { SyncProgress } from "@/lib/sync-engine";
import { Button } from "@/components/ui";

interface ModalSyncProgressProps {
  isOpen: boolean;
  progress: SyncProgress;
  onRetry?: () => void;
  onClose?: () => void;
}

export const ModalSyncProgress: React.FC<ModalSyncProgressProps> = ({
  isOpen,
  progress,
  onRetry,
  onClose,
}) => {
  if (!isOpen) return null;

  const isError = Boolean(progress.error);
  const isDone = progress.isComplete;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
              isError
                ? "bg-rose-100 text-rose-600 shadow-rose-200"
                : isDone
                ? "bg-emerald-100 text-emerald-600 shadow-emerald-200"
                : "bg-blue-100 text-blue-600 shadow-blue-200"
            }`}
          >
            {isError ? (
              <AlertCircle className="w-8 h-8" />
            ) : isDone ? (
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            ) : (
              <RefreshCw className="w-8 h-8 animate-spin" />
            )}
          </div>
        </div>

        {/* Title & Stage */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            AES-GCM 256-Bit • Encrypted Local Vault
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight pt-1">
            {isError
              ? "Sinkronisasi Terkendala"
              : isDone
              ? "Sinkronisasi Selesai"
              : "Menyiapkan Data Lokal"}
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            {progress.stage}
          </p>
        </div>

        {/* Progress Bar & Details */}
        {!isError && (
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Progress Sinkronisasi
              </span>
              <span className="text-blue-600">{progress.percent}%</span>
            </div>

            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, progress.percent)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 line-clamp-1 font-mono">
              {progress.detail || "Sedang memproses data..."}
            </p>
          </div>
        )}

        {/* Error Detail */}
        {isError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/60 text-left space-y-2">
            <p className="text-xs font-semibold text-rose-800">
              {progress.error}
            </p>
            <p className="text-[11px] text-rose-600">
              Pastikan koneksi internet stabil dan server Supabase dapat diakses.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {isError && onRetry && (
            <Button
              variant="primary"
              size="md"
              onClick={onRetry}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Coba Sinkronisasi Ulang
            </Button>
          )}

          {isDone && onClose && (
            <Button
              variant="primary"
              size="md"
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Buka Dashboard Sekarang
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
