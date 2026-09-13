"use client";

import React from "react";
import { Input, Button } from "@/components/ui";
import { TPSItem } from "../types";

interface ModalTpsFormProps {
  isOpen: boolean;
  activeTps: TPSItem | null;
  setActiveTps: React.Dispatch<React.SetStateAction<TPSItem | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ModalTpsForm: React.FC<ModalTpsFormProps> = ({
  isOpen,
  activeTps,
  setActiveTps,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !activeTps) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            {activeTps.id ? `Pengaturan Master ${(activeTps.namaTabung || activeTps.namaTps).replace(/TPS/gi, "Tabung")}` : "Tambah Tabung Baru"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Tabung Pemilihan</label>
            <Input
              value={activeTps.namaTps}
              onChange={(e) => setActiveTps({ ...activeTps, namaTps: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lokasi Pemungutan Suara</label>
            <Input
              value={activeTps.lokasi}
              onChange={(e) => setActiveTps({ ...activeTps, lokasi: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat / Keterangan Lokasi</label>
            <Input
              value={activeTps.alamat}
              onChange={(e) => setActiveTps({ ...activeTps, alamat: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wilayah RT Binaan</label>
              <Input
                value={activeTps.rt}
                onChange={(e) => setActiveTps({ ...activeTps, rt: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wilayah RW Binaan</label>
              <Input
                value={activeTps.rw}
                onChange={(e) => setActiveTps({ ...activeTps, rw: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Simpan Pengaturan Tabung
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
