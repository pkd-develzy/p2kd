"use client";

import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Button, Badge } from "@/components/ui";
import { TPSItem } from "@/components/pages/admin/types";
import { voterFormSchema, VoterFormValues } from "../schemas/voter.schema";
import {
  DAFTAR_RW_KALISALAK,
  DAFTAR_RT_KALISALAK,
  getAutoTabungByRtRw,
  normalizeWilayahCode,
} from "@/lib/kalisalak-wilayah";
import { usePemilihDetailQuery } from "@/queries/use-pemilih-query";
import { formatNamaGelar } from "@/lib/nama-gelar";
import {
  UserPlus,
  Edit2,
  X,
  Lock,
  MapPin,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface ModalVoterFormRHFProps {
  isOpen: boolean;
  isEdit: boolean;
  selectedId?: string | null;
  initialValues?: Partial<VoterFormValues>;
  tpsList: TPSItem[];
  isFieldOfficer?: boolean;
  officerAssignedTps?: string;
  onClose: () => void;
  onSubmit: (values: VoterFormValues) => Promise<void> | void;
}

export const ModalVoterFormRHF: React.FC<ModalVoterFormRHFProps> = ({
  isOpen,
  isEdit,
  selectedId,
  initialValues,
  tpsList,
  isFieldOfficer = false,
  officerAssignedTps,
  onClose,
  onSubmit,
}) => {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Determine officer's locked RW if field officer
  const officerRw = useMemo(() => {
    if (!isFieldOfficer || !officerAssignedTps) return null;
    const digits = officerAssignedTps.replace(/\D/g, "");
    return digits ? digits.padStart(2, "0") : null;
  }, [isFieldOfficer, officerAssignedTps]);

  // Query TanStack Query with queryKey: ['pemilih-detail', selectedId]
  const {
    data: voterDetail,
    isLoading: isFetchingDetail,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = usePemilihDetailQuery(selectedId, isOpen && isEdit && Boolean(selectedId));

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VoterFormValues>({
    resolver: zodResolver(voterFormSchema),
    defaultValues: {
      nik: "",
      kk: "",
      namaLengkap: "",
      tempatLahir: "Batang",
      tanggalLahir: "",
      jenisKelamin: "L",
      statusPerkawinan: "S",
      alamat: "Kalisalak",
      rt: "01",
      rw: officerRw || "01",
      tps: getAutoTabungByRtRw(officerRw || "01", "01", tpsList),
      statusAktif: "AKTIF",
      tahap: "DPS",
      alasanTms: "",
    },
  });

  const selectedRw = useWatch({ control, name: "rw" });
  const selectedRt = useWatch({ control, name: "rt" });

  // 1. Lock document body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // 2. EDIT MODE: Synchronize form with specific selected record from server query
  useEffect(() => {
    if (isOpen && isEdit && voterDetail && voterDetail.id === selectedId) {
      const rw = officerRw || normalizeWilayahCode(voterDetail.rw || "01");
      const rt = normalizeWilayahCode(voterDetail.rt || "01");
      const autoTps = getAutoTabungByRtRw(rw, rt, tpsList);

      reset({
        nik: voterDetail.nik || "",
        kk: voterDetail.kk || "",
        namaLengkap: formatNamaGelar(voterDetail.namaLengkap || ""),
        tempatLahir: voterDetail.tempatLahir || "Batang",
        tanggalLahir: voterDetail.tanggalLahir || "",
        jenisKelamin: (voterDetail.jenisKelamin as "L" | "P") || "L",
        statusPerkawinan: (voterDetail.statusPerkawinan as "S" | "B" | "P") || "S",
        alamat: voterDetail.alamat || "Kalisalak",
        rt,
        rw,
        tps: voterDetail.tps || autoTps,
        statusAktif: voterDetail.statusAktif === "TMS" ? "TMS" : "AKTIF",
        tahap: (voterDetail.tahap as "DPS" | "DPT") || "DPS",
        alasanTms: voterDetail.alasanTms || "",
      });
    }
  }, [isOpen, isEdit, voterDetail, selectedId, reset, tpsList, officerRw]);

  // 3. CREATE MODE: Reset to default values with officer's assigned RW
  useEffect(() => {
    if (isOpen && !isEdit) {
      const rw = officerRw || normalizeWilayahCode(initialValues?.rw || "01");
      const rt = normalizeWilayahCode(initialValues?.rt || "01");
      const autoTps = getAutoTabungByRtRw(rw, rt, tpsList);

      reset({
        nik: initialValues?.nik || "",
        kk: initialValues?.kk || "",
        namaLengkap: formatNamaGelar(initialValues?.namaLengkap || ""),
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
  }, [isOpen, isEdit, initialValues, reset, tpsList, officerRw]);

  // Sync TPS automatically when RW / RT changes
  const handleRwChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (officerRw) return; // Prevent changing if locked to officer
    const newRw = e.target.value;
    setValue("rw", newRw, { shouldValidate: true });
    const autoTps = getAutoTabungByRtRw(newRw, selectedRt, tpsList);
    setValue("tps", autoTps, { shouldValidate: true });
  };

  const handleRtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRt = e.target.value;
    setValue("rt", newRt, { shouldValidate: true });
    const activeRw = officerRw || selectedRw || "01";
    const autoTps = getAutoTabungByRtRw(activeRw, newRt, tpsList);
    setValue("tps", autoTps, { shouldValidate: true });
  };

  const handleFormSubmit = async (values: VoterFormValues) => {
    // Strictly enforce officer's assigned RW & uppercase name
    const finalRw = officerRw || normalizeWilayahCode(values.rw);
    const finalRt = normalizeWilayahCode(values.rt);
    const finalTps = getAutoTabungByRtRw(finalRw, finalRt, tpsList);

    const finalizedPayload: VoterFormValues = {
      ...values,
      namaLengkap: formatNamaGelar(values.namaLengkap),
      rw: finalRw,
      rt: finalRt,
      tps: finalTps,
    };

    await onSubmit(finalizedPayload);
  };

  if (!isOpen || !mounted) return null;

  const isLoadingRecord = isEdit && isFetchingDetail && !voterDetail;
  const autoTpsName = getAutoTabungByRtRw(officerRw || selectedRw || "01", selectedRt || "01", tpsList);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-voter-form-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overscroll-none animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Main Modal Card Dialog */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200/90 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
          {/* 1. STICKY TOP HEADER */}
          <div className="shrink-0 p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
                {isEdit ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3
                  id="modal-voter-form-title"
                  className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug"
                >
                  {isEdit ? "Koreksi Data Pemilih" : "Tambah Pemilih Baru Secara Manual"}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  {officerRw ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Petugas Lapangan RW {officerRw}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-bold">Wilayah Terverifikasi</span>
                    </>
                  ) : (
                    <span>Panitia Pemilihan Kepala Desa Kalisalak 2026-2027</span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Form (Esc)"
              aria-label="Tutup Form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. SCROLLABLE BODY (The Only Scroll Area) */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 p-4 sm:p-6 space-y-4 text-xs">
            {/* Loading skeleton state */}
            {isLoadingRecord ? (
              <div className="py-16 px-4 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-9 h-9 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Mengambil Data Pemilih...</p>
                  <p className="text-[11px] text-slate-400">
                    Memastikan data akurat langsung dari server database utama.
                  </p>
                </div>
              </div>
            ) : isEdit && isDetailError ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Gagal Mengambil Detail Pemilih</h4>
                <p className="text-[11px] text-slate-500">
                  {(detailError as Error)?.message || "Terjadi kesalahan jaringan."}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Tutup
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => void refetchDetail()}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Coba Lagi
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Field 1: NIK */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="332801..."
                    className="font-mono text-sm tracking-wider font-semibold"
                    {...register("nik")}
                  />
                  {errors.nik && <p className="text-[11px] text-rose-500 font-medium mt-0.5">{errors.nik.message}</p>}
                </div>

                {/* Field 2: No KK */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nomor Kartu Keluarga (No. KK – Opsional)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="332801..."
                    className="font-mono text-sm tracking-wider"
                    {...register("kk")}
                  />
                  {errors.kk && <p className="text-[11px] text-rose-500 font-medium mt-0.5">{errors.kk.message}</p>}
                </div>

                {/* Field 3: Nama Lengkap */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Nama Lengkap (Sesuai KTP-el) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: AHMAD FAUZI"
                    className="font-bold uppercase tracking-wide text-slate-900"
                    {...register("namaLengkap")}
                    onBlur={() => {
                      const current = getValues("namaLengkap");
                      if (current) {
                        setValue("namaLengkap", formatNamaGelar(current), { shouldValidate: true });
                      }
                    }}
                  />
                  {errors.namaLengkap && (
                    <p className="text-[11px] text-rose-500 font-medium mt-0.5">{errors.namaLengkap.message}</p>
                  )}
                </div>

                {/* Field 4: Tempat Lahir & Tanggal Lahir (2 Kolom) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Tempat Lahir <span className="text-rose-500">*</span>
                    </label>
                    <Input type="text" placeholder="Contoh: Tegal / Batang" {...register("tempatLahir")} />
                    {errors.tempatLahir && (
                      <p className="text-[11px] text-rose-500 font-medium mt-0.5">{errors.tempatLahir.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Tanggal Lahir <span className="text-rose-500">*</span>
                    </label>
                    <Input type="date" className="cursor-pointer font-medium" {...register("tanggalLahir")} />
                    {errors.tanggalLahir && (
                      <p className="text-[11px] text-rose-500 font-medium mt-0.5">{errors.tanggalLahir.message}</p>
                    )}
                  </div>
                </div>

                {/* Field 5: Jenis Kelamin & Status Perkawinan (2 Kolom) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Jenis Kelamin</label>
                    <select
                      {...register("jenisKelamin")}
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none cursor-pointer"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Status Perkawinan</label>
                    <select
                      {...register("statusPerkawinan")}
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none cursor-pointer"
                    >
                      <option value="S">Sudah Kawin (S)</option>
                      <option value="B">Belum Kawin (B)</option>
                      <option value="P">Pernah Kawin / Cerai (P)</option>
                    </select>
                  </div>
                </div>

                {/* Field 6: RW Domisili (LOCKED FOR FIELD OFFICERS) & RT Domisili */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* RW FIELD */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">
                        RW Domisili Kalisalak <span className="text-rose-500">*</span>
                      </label>
                      {officerRw && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <Lock className="w-3 h-3 text-amber-700" />
                          Terkunci Petugas
                        </span>
                      )}
                    </div>

                    {officerRw ? (
                      /* Read-Only Locked Field for Field Officer */
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={`RW ${officerRw}`}
                          className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-slate-100 font-black text-slate-900 cursor-not-allowed select-none"
                        />
                        <input type="hidden" {...register("rw")} value={officerRw} />
                      </div>
                    ) : (
                      /* Editable Dropdown for Admin / Superadmin */
                      <select
                        value={selectedRw}
                        onChange={handleRwChange}
                        className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none cursor-pointer"
                      >
                        {DAFTAR_RW_KALISALAK.map((rw) => (
                          <option key={rw.value} value={rw.value}>
                            {rw.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* RT FIELD */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      RT Domisili <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedRt}
                      onChange={handleRtChange}
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none cursor-pointer"
                    >
                      {DAFTAR_RT_KALISALAK.map((rt) => (
                        <option key={rt.value} value={rt.value}>
                          {rt.label} (RW {officerRw || selectedRw || "01"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Field 7: Alamat Domisili */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Alamat Lengkap / Dukuh</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Jl. K. Abdul Latief, Kalisalak"
                    {...register("alamat")}
                  />
                  {errors.alamat && (
                    <p className="text-[11px] text-rose-500 font-medium mt-0.5">{errors.alamat.message}</p>
                  )}
                </div>

                {/* Auto-allocated TPS Info Card */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">Alokasi Tabung / TPS</span>
                      <span className="text-[10.5px] text-slate-500">Otomatis dipetakan dari RW {officerRw || selectedRw}</span>
                    </div>
                  </div>
                  <Badge variant="primary" className="font-black text-xs px-2.5 py-1">
                    {autoTpsName}
                  </Badge>
                </div>

                <input type="hidden" {...register("tps")} />
              </>
            )}
          </div>

          {/* 3. STICKY DOCKED FOOTER (Always Visible, Solid Background, Safe Area Aware) */}
          <div className="shrink-0 p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5 z-10 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 border-slate-200"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || isLoadingRecord}
              className="rounded-xl px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                  <span>Menyimpan Data...</span>
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Simpan Data Pemilih"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
