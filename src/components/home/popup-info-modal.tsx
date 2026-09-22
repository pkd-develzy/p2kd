/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { PopupSlideItem } from "@/lib/data-store";

interface PopupInfoModalProps {
  isPopupActive?: boolean;
  popupSlides?: PopupSlideItem[];
  popupAutoSlide?: boolean;
  popupInterval?: number;
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PopupInfoModal: React.FC<PopupInfoModalProps> = ({
  isPopupActive = true,
  popupSlides = [],
  popupAutoSlide = true,
  popupInterval = 3,
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100%

  // Filter valid slides with image URLs and check if slide is within active period (berakhir sesuai jadwal)
  const activeSlides = (popupSlides || []).filter((slide) => {
    if (!slide || typeof slide.imageUrl !== "string" || slide.imageUrl.trim() === "") {
      return false;
    }
    const now = new Date();
    // Tanggal mulai
    if (slide.startDate) {
      const start = new Date(slide.startDate);
      if (!isNaN(start.getTime()) && now < start) {
        return false;
      }
    }
    // Tanggal berakhir (otomatis hilang setelah jadwal selesai)
    if (slide.endDate) {
      let endString = slide.endDate;
      if (/^\d{4}-\d{2}-\d{2}$/.test(endString)) {
        endString = `${endString}T23:59:59`;
      }
      const end = new Date(endString);
      if (!isNaN(end.getTime()) && now > end) {
        return false;
      }
    }
    return true;
  });

  const totalSlides = activeSlides.length;
  // Durasi transisi tepat 3 detik sesuai instruksi
  const durationMs = Math.max(2, popupInterval || 3) * 1000;

  // Slide navigation
  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  }, []);

  // Close handler
  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  // Selalu membuka pamflet setiap kali website dibuka atau di-reload
  useEffect(() => {
    if (forceOpen) {
      const timer = setTimeout(() => setIsOpen(true), 0);
      return () => clearTimeout(timer);
    }

    if (!isPopupActive || totalSlides === 0) {
      return;
    }

    const timer = setTimeout(() => setIsOpen(true), 0);
    return () => clearTimeout(timer);
  }, [forceOpen, isPopupActive, totalSlides]);

  // Keyboard navigation: Escape to close, Arrow keys to slide
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, handleClose]);

  // Real-time Gestures: Drag & Swipe with Live Visual Translation
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const currentDeltaRef = useRef<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (totalSlides <= 1) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    currentDeltaRef.current = 0;
    setDragOffset(0);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientX - startXRef.current;
    currentDeltaRef.current = delta;
    setDragOffset(delta);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const delta = currentDeltaRef.current;
    const swipeThreshold = 40; // 40px drag to slide

    if (delta < -swipeThreshold) {
      nextSlide();
    } else if (delta > swipeThreshold) {
      prevSlide();
    }

    setDragOffset(0);
    currentDeltaRef.current = 0;
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragOffset(0);
    currentDeltaRef.current = 0;
  };

  // 3 Detik Loading Bar mengisi dari kanan ke kiri untuk pergantian slide (Paused saat sedang di-drag pengguna)
  useEffect(() => {
    if (!isOpen || !popupAutoSlide || totalSlides <= 1 || isDragging) return;

    const stepMs = 30; // ~33fps
    const increment = (stepMs / durationMs) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [isOpen, popupAutoSlide, totalSlides, durationMs, isDragging, nextSlide]);

  if (!isOpen || totalSlides === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pengumuman Resmi P2KD"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in select-none"
      onClick={handleClose}
    >
      {/* Container Bersih: Pas atas-bawah layar friendly, tanpa scrollbar */}
      <div
        className="relative max-h-[84vh] max-w-[94vw] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup ('X') Bundar Putih di sudut kiri atas persis sesuai referensi */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup Pengumuman"
          className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-50 p-2 sm:p-2.5 rounded-full bg-white/95 text-slate-800 hover:bg-white hover:text-red-600 shadow-xl border border-slate-200/80 transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
        </button>

        {/* Panah Geser Kiri (Muncul jika ada lebih dari 1 pamflet) */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Pamflet Sebelumnya"
            className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-2xl border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Panah Geser Kanan (Muncul jika ada lebih dari 1 pamflet) */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Pamflet Berikutnya"
            className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-2xl border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Slider Carousel: Mendukung Drag Mouse & Touch Gesture Dengan Perpindahan Visual Nyata */}
        <div
          ref={sliderRef}
          className="overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl bg-transparent w-[88vw] sm:w-125 md:w-135 max-w-[92vw] cursor-grab active:cursor-grabbing touch-pan-y select-none"
          style={{ touchAction: "pan-y" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div
            className="flex items-center w-full"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              transition: isDragging ? "none" : "transform 400ms cubic-bezier(0.2, 0.9, 0.3, 1)",
            }}
          >
            {activeSlides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                className="w-full shrink-0 flex items-center justify-center"
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.judul || `Pamflet P2KD ${idx + 1}`}
                  className="max-h-[78vh] sm:max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-2xl sm:rounded-3xl block shadow-2xl pointer-events-none select-none"
                  loading="eager"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indikator Loading Bar Mengisi 3 Detik Dari Kanan ke Kiri Warna Biru Dongker */}
      {totalSlides > 1 && (
        <div
          className="mt-3 sm:mt-3.5 flex items-center gap-2.5 sm:gap-3.5 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200/80 shadow-2xl select-none cursor-pointer transition-transform hover:scale-[1.03] active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          title="Klik untuk langsung mengganti pamflet"
        >
          {/* Icon Loading Berputar Halus */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Loader2 className="w-4 h-4 text-[#0A192F] animate-spin" />
            <span className="text-[11px] sm:text-xs font-bold text-[#0A192F] font-mono tracking-tight">
              {currentIndex + 1}/{totalSlides}
            </span>
          </div>

          {/* Progress bar container: Mengisi 3 detik DARI KANAN KE KIRI */}
          {/* flex justify-end membuat bar terisi dari sisi kanan menuju ke kiri */}
          <div className="relative w-28 sm:w-44 h-2.5 sm:h-3 bg-slate-200/90 rounded-full border border-slate-300/80 overflow-hidden flex justify-end shadow-inner">
            <div
              className="h-full bg-[#0A192F] rounded-full transition-all duration-75"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
              }}
            />
          </div>

          {/* Dots interaktif untuk langsung klik nomor pamflet */}
          <div className="flex items-center gap-1.5 shrink-0 pl-0.5">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Buka pamflet ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? "w-4 h-2 bg-[#0A192F] shadow-xs"
                    : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
