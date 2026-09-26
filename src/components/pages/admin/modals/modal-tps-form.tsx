"use client";

import React from "react";
import { Input, Button } from "@/components/ui";
import { DAFTAR_RW_KALISALAK } from "@/lib/kalisalak-wilayah";
import { TPSItem } from "../types";

interface ModalTpsFormProps {
  isOpen: boolean;
  activeTps: TPSItem | null;
  setActiveTps: React.Dispatch<React.SetStateAction<TPSItem | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

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
    const defaultLokasi =
      !activeTps.lokasi || activeTps.lokasi.includes("Zona RW") || activeTps.lokasi.includes("Balai Pertemuan RW")
        ? `Zona ${rwStr}`
        : activeTps.lokasi;
    const defaultAlamat =
      !activeTps.alamat || activeTps.alamat.includes("Wilayah RW")
        ? `Wilayah ${rwStr}, Desa Kalisalak`
        : activeTps.alamat;

    setActiveTps({
      ...activeTps,
      rw: formatted,
      nomorTps: formatted,
      kodeTps: `TABUNG-${formatted}`,
      namaTps: defaultTabung,
      namaTabung: `Tabung ${rwStr}`,
      lokasi: defaultLokasi,
      alamat: defaultAlamat,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {activeTps.id
              ? `Pengaturan Master ${(activeTps.namaTabung || activeTps.namaTps).replace(/TPS/gi, "Tabung")}`
              : "Tambah Wilayah Tabung Baru"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          {/* 1. Nama Tabung Pemilihan (Dropdown) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Tabung Pemilihan:
            </label>
            <select
              value={currentRwCode}
              onChange={(e) => handleSelectRw(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs transition-all"
            >
              {DAFTAR_RW_KALISALAK.map((rw) => (
                <option key={rw.value} value={rw.value}>
                  Wilayah {rw.label} (Tabung TPS {rw.defaultTps})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Lokasi Pemungutan Suara */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Lokasi Pemungutan Suara:</label>
            <Input
              value={activeTps.lokasi}
              onChange={(e) => setActiveTps({ ...activeTps, lokasi: e.target.value })}
              placeholder="Contoh: Zona RW 01 / Balai Pertemuan RW"
              required
            />
          </div>

          {/* 3. Alamat / Keterangan Lokasi */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat / Keterangan Lokasi:</label>
            <Input
              value={activeTps.alamat}
              onChange={(e) => setActiveTps({ ...activeTps, alamat: e.target.value })}
              placeholder="Contoh: Desa Kalisalak, Kec. Margasari, Kab. Tegal"
              required
            />
          </div>

          {/* 4. Wilayah RT & RW Binaan (Dropdown) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wilayah RT Binaan:</label>
              <select
                value={activeTps.rt || "RT 01, RT 02, RT 03"}
                onChange={(e) => setActiveTps({ ...activeTps, rt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs transition-all"
              >
                <option value="RT 01, RT 02, RT 03">RT 01, RT 02, RT 03</option>
                <option value="RT 01, RT 02">RT 01, RT 02</option>
                <option value="RT 01">RT 01</option>
                <option value="RT 02">RT 02</option>
                <option value="RT 03">RT 03</option>
                <option value="RT 01, RT 02, RT 03, RT 04">RT 01, RT 02, RT 03, RT 04</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wilayah RW Binaan:</label>
              <select
                value={currentRwCode}
                onChange={(e) => handleSelectRw(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs transition-all"
              >
                {DAFTAR_RW_KALISALAK.map((rw) => (
                  <option key={rw.value} value={rw.value}>
                    {rw.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold rounded-xl shadow-md">
              Simpan Pengaturan Tabung
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
