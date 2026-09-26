"use client";

import React from "react";
import { Button } from "@/components/ui";
import { Lock, MapPin, Building, Home, CheckCircle2 } from "lucide-react";
import { DAFTAR_RW_KALISALAK } from "@/lib/kalisalak-wilayah";
import { TPSItem } from "../types";

interface ModalTpsFormProps {
  isOpen: boolean;
  activeTps: TPSItem | null;
  setActiveTps: React.Dispatch<React.SetStateAction<TPSItem | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LOKASI_TERKUNCI = "Lapangan Desa Kalisalak";
const ALAMAT_TERKUNCI = "Desa Kalisalak, Kec. Margasari, Kab. Tegal";
const RT_TERKUNCI = "RT 01, RT 02, RT 03";

function formatRwCode(val: string | number | undefined | null): string {
  if (!val) return "01";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "01";
  const num = parseInt(digits, 10);
  return num < 10 ? `0${num}` : `${num}`;
}

export const ModalTpsForm: React.FC<ModalTpsFormProps> = ({
  isOpen,
  activeTps,
  setActiveTps,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !activeTps) return null;

  const currentRwCode = formatRwCode(activeTps.rw || activeTps.nomorTps);

  const handleSelectRw = (rwCode: string) => {
    const formatted = formatRwCode(rwCode);
    const rwStr = `RW ${formatted}`;
    const defaultTabung = `Wilayah ${rwStr}`;

    setActiveTps({
      ...activeTps,
      rw: formatted,
      nomorTps: formatted,
      kodeTps: `TABUNG-${formatted}`,
      namaTps: defaultTabung,
      namaTabung: `Tabung ${rwStr}`,
      lokasi: LOKASI_TERKUNCI,
      alamat: ALAMAT_TERKUNCI,
      rt: RT_TERKUNCI,
      kuotaMaksimal: activeTps.kuotaMaksimal || 850,
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = formatRwCode(activeTps.rw || activeTps.nomorTps);
    const rwStr = `RW ${formatted}`;

    setActiveTps({
      ...activeTps,
      rw: formatted,
      nomorTps: formatted,
      kodeTps: `TABUNG-${formatted}`,
      namaTps: `Wilayah ${rwStr}`,
      namaTabung: `Tabung ${rwStr}`,
      lokasi: LOKASI_TERKUNCI,
      alamat: ALAMAT_TERKUNCI,
      rt: RT_TERKUNCI,
      kuotaMaksimal: activeTps.kuotaMaksimal || 850,
    });

    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {activeTps.id
                ? `Pengaturan Master Wilayah RW ${currentRwCode}`
                : "Tambah Wilayah Tabung Baru"}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Konfigurasi Tabung Pemilihan Terpadu Pilkades
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* 1. Nama Tabung Pemilihan (SATU-SATUNYA DROPDOWN) */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800 text-xs">
              Nama Tabung Pemilihan:
            </label>
            <select
              value={currentRwCode}
              onChange={(e) => handleSelectRw(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-blue-500 bg-blue-50/30 font-bold text-blue-950 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none text-xs transition-all shadow-xs cursor-pointer"
            >
              {DAFTAR_RW_KALISALAK.map((rw) => (
                <option key={rw.value} value={rw.value}>
                  Wilayah RW {rw.value} (Tabung TPS {rw.defaultTps})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 italic">
              *Pilih RW di atas, data lokasi dan wilayah di bawah otomatis terkunci presisi.
            </p>
          </div>

          {/* 2. Lokasi Pemungutan Suara (TERKUNCI OTOMATIS) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700 text-xs">
                Lokasi Pemungutan Suara:
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <Lock className="w-3 h-3 text-slate-400" /> Terkunci Otomatis
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={LOKASI_TERKUNCI}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/90 font-bold text-slate-800 text-xs cursor-not-allowed select-none outline-none"
              />
              <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Alamat / Keterangan Lokasi (TERKUNCI OTOMATIS) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700 text-xs">
                Alamat / Keterangan Lokasi:
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <Lock className="w-3 h-3 text-slate-400" /> Terkunci Otomatis
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={ALAMAT_TERKUNCI}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/90 font-medium text-slate-700 text-xs cursor-not-allowed select-none outline-none"
              />
              <Building className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4. Wilayah RT & RW Binaan (DUA-DUANYA TERKUNCI OTOMATIS MENGIKUTI) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Wilayah RT Binaan (Terkunci: harus 1,2,3) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 text-xs">
                  Wilayah RT Binaan:
                </label>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={RT_TERKUNCI}
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 bg-slate-100/90 font-bold text-slate-800 text-xs cursor-not-allowed select-none outline-none"
                />
                <Home className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> RT 1, 2, 3 Selesai
              </span>
            </div>

            {/* Wilayah RW Binaan (Terkunci: Otomatis Mengikuti Dropdown) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 text-xs">
                  Wilayah RW Binaan:
                </label>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={`RW ${currentRwCode}`}
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 bg-slate-100/90 font-black text-blue-900 text-xs cursor-not-allowed select-none outline-none"
                />
                <Building className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Otomatis RW {currentRwCode}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="font-bold rounded-xl shadow-md text-xs bg-blue-600 hover:bg-blue-500"
            >
              Simpan Pengaturan Tabung
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
