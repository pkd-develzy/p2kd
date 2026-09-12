"use client";

import React, { useState } from "react";
import { ArrowRightLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui";
import { Voter, TPSItem } from "../types";
import {
  DAFTAR_RW_KALISALAK,
  DAFTAR_RT_KALISALAK,
  getAutoTabungByRtRw,
  normalizeWilayahCode,
} from "@/lib/kalisalak-wilayah";

interface ModalMutasiProps {
  isOpen: boolean;
  activeVoter: Voter | null;
  tpsList: TPSItem[];
  onClose: () => void;
  onConfirmMutasi: (tpsBaru: string, rtBaru: string, rwBaru: string) => void;
}

const ModalMutasiInner: React.FC<{
  activeVoter: Voter;
  tpsList: TPSItem[];
  onClose: () => void;
  onConfirmMutasi: (tpsBaru: string, rtBaru: string, rwBaru: string) => void;
}> = ({ activeVoter, tpsList, onClose, onConfirmMutasi }) => {
  const [rwBaru, setRwBaru] = useState(normalizeWilayahCode(activeVoter.rw || "01"));
  const rawRt = normalizeWilayahCode(activeVoter.rt || "01");
  const [rtBaru, setRtBaru] = useState(["01", "02", "03"].includes(rawRt) ? rawRt : "01");

  const computedTps = getAutoTabungByRtRw(rwBaru, rtBaru, tpsList);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
            <ArrowRightLeft className="w-5 h-5" />
            Mutasi / Pindah Domisili RT-RW
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Pindahkan pemilih <strong>{activeVoter.namaLengkap}</strong> dari{" "}
          <strong>{activeVoter.tps} (RT {activeVoter.rt} / RW {activeVoter.rw})</strong> ke domisili baru di Desa Kalisalak.
        </p>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">RW Tujuan</label>
              <select
                value={rwBaru}
                onChange={(e) => setRwBaru(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                {DAFTAR_RW_KALISALAK.map((rw) => (
                  <option key={rw.value} value={rw.value}>
                    {rw.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">RT Tujuan</label>
              <select
                value={rtBaru}
                onChange={(e) => setRtBaru(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                {DAFTAR_RT_KALISALAK.map((rt) => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Tabung TPS Tujuan</label>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-blue-600" />
                Terkunci Otomatis
              </span>
            </div>
            <div
              title="Tabung TPS tujuan otomatis dipetakan dari RT/RW baru"
              className="w-full h-10 px-3 text-xs rounded-xl border border-blue-300 bg-blue-50/80 font-black text-blue-900 flex items-center justify-between cursor-not-allowed select-none shadow-xs"
            >
              <span>{computedTps}</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-200/60 px-1.5 py-0.5 rounded shrink-0">
                Desa Kalisalak
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onConfirmMutasi(computedTps, rtBaru, rwBaru)}
            className="font-bold"
          >
            Simpan Mutasi TPS
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ModalMutasi: React.FC<ModalMutasiProps> = ({
  isOpen,
  activeVoter,
  tpsList,
  onClose,
  onConfirmMutasi,
}) => {
  if (!isOpen || !activeVoter) return null;

  return (
    <ModalMutasiInner
      key={activeVoter.id}
      activeVoter={activeVoter}
      tpsList={tpsList}
      onClose={onClose}
      onConfirmMutasi={onConfirmMutasi}
    />
  );
};
