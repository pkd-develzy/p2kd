"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge, Logo } from "@/components/ui";
import { Lock, FileCheck2, AlertCircle } from "lucide-react";

export const DptOverview: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="warning" className="mb-2">Tahap Menuju Pleno P2KD</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Daftar Pemilih Tetap (DPT) Pilkades Kalisalak
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal
        </p>
      </div>

      <Card className="p-6 border-blue-200 bg-blue-50/30">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Runtutan Tahapan Pemutakhiran Data Pemilih</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Pemutakhiran data pemilih Pilkades Kalisalak 2027 berjalan melalui runtutan bertahap: <strong>Calon DPS → DPS → DPSHP → DPSHP Akhir → DPT Final</strong>. Seluruh proses divalidasi secara transparan sebelum pengesahan pada Sidang Pleno resmi P2KD Kalisalak.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="primary">Tahapan: Calon DPS • DPS • DPSHP • DPSHP Akhir • DPT</Badge>
              <Badge variant="success">Proteksi Database Server: Aktif</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Penguncian DPT (Lock System)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Setelah sidang pleno penetapan DPT oleh P2KD Kalisalak, seluruh data pemilih akan dikunci di database server terenkripsi dengan segel hash digital resmi dan tidak dapat diubah oleh pihak manapun demi menjamin netralitas dan transparansi.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Daftar Pemilih Tambahan (DPTb)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Warga Kalisalak yang memenuhi syarat namun baru mengurus dokumen kependudukan dapat menggunakan hak pilihnya melalui mekanisme Daftar Pemilih Tambahan dengan menunjukkan KTP-el asli di Pendaftaran RW sesuai domisili pada hari H pencoblosan.
          </p>
        </Card>
      </div>
    </div>
  );
};
