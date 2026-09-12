"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, PenTool, CheckCircle2, AlertCircle } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (signatureBase64: string | null) => void;
  className?: string;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  className = "",
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  // Setup canvas size with DPI scaling for high resolution on Retina/OLED mobile displays
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a"; // Deep navy ink
      ctx.lineWidth = 2.5;
    }
  }, [height]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas]);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capture pointer to ensure smooth drawing even if finger slides slightly outside
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPointerPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    if (!hasDrawn) {
      setHasDrawn(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture release failed
    }

    setStrokeCount((prev) => prev + 1);

    // Export transparent PNG
    const dataUrl = canvas.toDataURL("image/png");
    onSignatureChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
    setStrokeCount(0);
    onSignatureChange(null);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        ref={containerRef}
        className="relative w-full rounded-xl border-2 border-dashed border-slate-300 bg-white shadow-inner overflow-hidden transition-all duration-200 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
        style={{ touchAction: "none" }}
      >
        {/* Canvas for digital finger/stylus drawing */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="cursor-crosshair w-full block"
          style={{ touchAction: "none" }}
        />

        {/* Baseline guideline */}
        <div className="absolute bottom-6 left-6 right-6 pointer-events-none border-b border-dashed border-slate-300 flex items-center justify-between pb-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-blue-500" />
            Tanda Tangan di sini (Gunakan Jari / Stylus)
          </span>
          <span className="text-[10px] text-slate-500">Kalisalak 2026</span>
        </div>

        {/* Status indicator badge */}
        <div className="absolute top-2.5 right-2.5 pointer-events-none">
          {hasDrawn && strokeCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Tanda Tangan Terekam
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              Wajib Ditandatangani
            </span>
          )}
        </div>
      </div>

      {/* Action bar below canvas */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <span>Sentuh layar & buat tanda tangan Anda dengan jelas.</span>
        </div>

        <button
          type="button"
          onClick={handleClear}
          disabled={!hasDrawn && strokeCount === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Eraser className="w-3.5 h-3.5" />
          Hapus / Ulangi
        </button>
      </div>
    </div>
  );
};
