"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Check, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge, PaginationControl } from "@/components/ui";
import { Aduan } from "../types";

interface TabAduanWargaProps {
  aduanList: Aduan[];
  selectedAduanFilter: string;
  setSelectedAduanFilter: (filter: string) => void;
  onApproveAduan: (a: Aduan) => void;
  onRejectAduan: (a: Aduan) => void;
}

export const TabAduanWarga: React.FC<TabAduanWargaProps> = ({
  aduanList,
  selectedAduanFilter,
  setSelectedAduanFilter,
  onApproveAduan,
  onRejectAduan,
}) => {
  const handleOpenWhatsApp = (a: Aduan) => {
    let cleanPhone = a.kontakPelapor.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    const statusText =
      a.status === "DISETUJUI"
        ? "DISETUJUI dan telah dimutakhirkan ke Master DPS/DPT."
        : a.status === "DITOLAK"
        ? "DITOLAK dengan alasan verifikasi berkas belum memenuhi syarat."
        : "SEDANG DALAM PROSES VERIFIKASI oleh Petugas P2KD.";

    const message = `Halo Bpk/Ibu *${a.namaPelapor}*,\n\nKami dari *Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak*, ingin menginformasikan tindak lanjut atas permohonan/aduan Anda:\n\n📌 *Nomor Tiket:* ${a.nomorAduan}\n📌 *Jenis Permohonan:* ${a.jenisAduan}\n📌 *Status:* ${statusText}\n${a.catatanPetugas ? `📌 *Catatan Petugas:* ${a.catatanPetugas}\n` : ""}\nTerima kasih atas partisipasi aktif Anda dalam menyukseskan Pilkades Desa Kalisalak 2026.\n\n_Sekretariat P2KD Kalisalak_`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const waitingCount = aduanList.filter((a) => a.status === "MENUNGGU").length;
  const approvedCount = aduanList.filter((a) => a.status === "DISETUJUI").length;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const startIdx = (currentPage - 1) * pageSize;
  const pagedAduan = aduanList.slice(startIdx, startIdx + pageSize);

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full"
              >
                Pusat Aduan & Tanggapan DPS
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                • {waitingCount} Menunggu Verifikasi • {approvedCount} Disetujui
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              Layanan Tanggapan & Aduan Masyarakat
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Verifikasi permohonan koreksi NIK, pemilih baru, mutasi Tabung, maupun laporan pemilih Tidak Memenuhi Syarat (TMS) langsung dari warga.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a href="/api/admin/export?type=ADUAN" download title="Unduh Daftar Aduan Warga (.xlsx)">
              <button
                type="button"
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Ekspor Excel Aduan</span>
              </button>
            </a>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Filter Status Aduan:</span>
            <select
              value={selectedAduanFilter}
              onChange={(e) => setSelectedAduanFilter(e.target.value)}
              className="h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700"
            >
              <option value="SEMUA">Semua Aduan ({aduanList.length})</option>
              <option value="MENUNGGU">Menunggu Verifikasi</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 hidden md:inline">
            Petugas dapat membalas aduan dan mengirim notifikasi WhatsApp otomatis ke pelapor.
          </span>
        </div>
      </Card>

      <div className="space-y-3">
        {aduanList.length === 0 ? (
          <Card className="p-8 text-center bg-white border-slate-200 text-slate-400 text-xs">
            Belum ada aduan masyarakat yang masuk pada filter ini.
          </Card>
        ) : (
          pagedAduan.map((a) => (
            <Card
              key={a.id}
              className="p-4 bg-white border-slate-200 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {a.nomorAduan}
                    </span>
                    {a.status === "MENUNGGU" && (
                      <Badge variant="warning" className="text-[10px]">
                        MENUNGGU VERIFIKASI
                      </Badge>
                    )}
                    {a.status === "DISETUJUI" && (
                      <Badge variant="success" className="text-[10px]">
                        DISETUJUI
                      </Badge>
                    )}
                    {a.status === "DITOLAK" && (
                      <Badge variant="danger" className="text-[10px]">
                        DITOLAK
                      </Badge>
                    )}
                    <span className="text-[11px] text-slate-400">{a.tanggal}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">
                    {a.namaPelapor} (NIK: {a.nikMasked})
                  </h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {a.isiAduan}
                  </p>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
                    <span>
                      Kontak: <strong className="text-slate-800">{a.kontakPelapor}</strong>
                    </span>
                    <span>•</span>
                    <span>Domisili: RT {a.rt} / RW {a.rw}</span>
                    <span>•</span>
                    <span>Jenis: <strong className="text-blue-700">{a.jenisAduan}</strong></span>
                  </div>
                  {a.catatanPetugas && (
                    <div className="text-[11px] text-emerald-700 font-medium mt-1 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      Catatan Petugas: {a.catatanPetugas}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0 pt-2 sm:pt-0">
                  {/* WhatsApp Hubungi Warga */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenWhatsApp(a)}
                    className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>WhatsApp Warga</span>
                  </Button>

                  {a.status === "MENUNGGU" && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onApproveAduan(a)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 font-bold"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Setujui
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onRejectAduan(a)}
                        className="text-xs"
                      >
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
        {aduanList.length > 0 && (
          <div className="mt-3">
            <PaginationControl
              currentPage={currentPage}
              totalItems={aduanList.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
