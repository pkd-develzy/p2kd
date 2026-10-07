"use client";

import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Button } from "@/components/ui";
import { TPSItem } from "@/components/pages/admin/types";
import { voterFormSchema, VoterFormValues } from "../schemas/voter.schema";
import {
  DAFTAR_RW_KALISALAK,
  DAFTAR_RT_KALISALAK,
  getAutoTabungByRtRw,
  normalizeWilayahCode,
} from "@/lib/kalisalak-wilayah";

interface ModalVoterFormRHFProps {
  isOpen: boolean;
  isEdit: boolean;
  initialValues?: Partial<VoterFormValues>;
  tpsList: TPSItem[];
  onClose: () => void;
  onSubmit: (values: VoterFormValues) => Promise<void> | void;
}

export const ModalVoterFormRHF: React.FC<ModalVoterFormRHFProps> = ({
  isOpen,
  isEdit,
  initialValues,
  tpsList,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VoterFormValues>({
    resolver: zodResolver(voterFormSchema),
    defaultValues: {
      nik: "",
      kk: "",
      namaLengkap: "",
      tempatLahir: "",
      tanggalLahir: "",
      jenisKelamin: "L",
      statusPerkawinan: "S",
      alamat: "Kalisalak",
      rt: "01",
      rw: "01",
      tps: "Tabung Pemilihan 01",
      statusAktif: "AKTIF",
      tahap: "DPS",
      alasanTms: "",
    },
  });

  const selectedRw = useWatch({ control, name: "rw" });
  const selectedRt = useWatch({ control, name: "rt" });

  // Reset form when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      const rw = normalizeWilayahCode(initialValues?.rw || "01");
      const rt = normalizeWilayahCode(initialValues?.rt || "01");
      const autoTps = getAutoTabungByRtRw(rw, rt, tpsList);

      reset({
        nik: initialValues?.nik || "",
        kk: initialValues?.kk || "",
        namaLengkap: initialValues?.namaLengkap || "",
        tempatLahir: initialValues?.tempatLahir || "Batang",
        tanggalLahir: initialValues?.tanggalLahir || "",
        jenisKelamin: initialValues?.jenisKelamin || "L",
        statusPerkawinan: initialValues?.statusPerkawinan || "S",
        alamat: initialValues?.alamat || "Kalisalak",
        rt,
        rw,
        tps: initialValues?.tps || autoTps,
        statusAktif: initialValues?.statusAktif || "AKTIF",
        tahap: initialValues?.tahap || "DPS",
        alasanTms: initialValues?.alasanTms || "",
      });
    }
  }, [isOpen, initialValues, reset, tpsList]);

  // Sync TPS automatically when RW / RT changes
  const handleRwChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRw = e.target.value;
    setValue("rw", newRw, { shouldValidate: true });
    const autoTps = getAutoTabungByRtRw(newRw, selectedRt, tpsList);
    setValue("tps", autoTps, { shouldValidate: true });
  };

  const handleRtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRt = e.target.value;
    setValue("rt", newRt, { shouldValidate: true });
    const autoTps = getAutoTabungByRtRw(selectedRw, newRt, tpsList);
    setValue("tps", autoTps, { shouldValidate: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            {isEdit ? "Koreksi Data Pemilih" : "Tambah Pemilih Baru Secara Manual"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nomor Induk Kependudukan (NIK 16 Digit) *
            </label>
            <Input
              type="text"
              maxLength={16}
              placeholder="332801..."
              {...register("nik")}
            />
            {errors.nik && <p className="text-[11px] text-rose-500 mt-1">{errors.nik.message}</p>}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nomor Kartu Keluarga (No. KK - Opsional)
            </label>
            <Input
              type="text"
              maxLength={16}
              placeholder="332801..."
              {...register("kk")}
            />
            {errors.kk && <p className="text-[11px] text-rose-500 mt-1">{errors.kk.message}</p>}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap (Sesuai KTP-el) *
            </label>
            <Input
              type="text"
              placeholder="Contoh: AHMAD FAUZI"
              {...register("namaLengkap")}
            />
            {errors.namaLengkap && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.namaLengkap.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tempat Lahir *</label>
              <Input type="text" {...register("tempatLahir")} />
              {errors.tempatLahir && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.tempatLahir.message}</p>
              )}
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir *</label>
              <Input type="date" {...register("tanggalLahir")} />
              {errors.tanggalLahir && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.tanggalLahir.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                {...register("jenisKelamin")}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Perkawinan</label>
              <select
                {...register("statusPerkawinan")}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="S">Sudah Kawin (S)</option>
                <option value="B">Belum Kawin (B)</option>
                <option value="P">Pernah Kawin / Cerai (P)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">RW Domisili Kalisalak</label>
              <select
                value={selectedRw}
                onChange={handleRwChange}
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
              <label className="block font-bold text-slate-700 mb-1">RT Domisili</label>
              <select
                value={selectedRt}
                onChange={handleRtChange}
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

          <input type="hidden" {...register("tps")} />

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
