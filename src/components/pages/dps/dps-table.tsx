"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge, Input, Logo, PaginationControl } from "@/components/ui";
import { Search, MapPin, Loader2 } from "lucide-react";

interface DpsRow {
  id: string | number;
  rw: string;
  dusun: string;
  tps: string;
  lokasi: string;
  jmlPemilih: number;
  laki: number;
  perempuan: number;
}

interface ApiTpsStat {
  nomorTps: string;
  namaTps: string;
  lokasi: string;
  total: number;
  laki: number;
  perempuan: number;
}

const DEFAULT_DPS_ROWS: DpsRow[] = [
  { id: 1, rw: "RW 01", dusun: "Desa Kalisalak", tps: "TPS 01", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 596, laki: 279, perempuan: 317 },
  { id: 2, rw: "RW 02", dusun: "Desa Kalisalak", tps: "TPS 02", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 495, laki: 243, perempuan: 252 },
  { id: 3, rw: "RW 03", dusun: "Desa Kalisalak", tps: "TPS 03", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 565, laki: 283, perempuan: 282 },
  { id: 4, rw: "RW 04", dusun: "Desa Kalisalak", tps: "TPS 04", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 647, laki: 329, perempuan: 318 },
  { id: 5, rw: "RW 05", dusun: "Desa Kalisalak", tps: "TPS 05", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 708, laki: 362, perempuan: 346 },
  { id: 6, rw: "RW 06", dusun: "Desa Kalisalak", tps: "TPS 06", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 488, laki: 242, perempuan: 246 },
  { id: 7, rw: "RW 07", dusun: "Desa Kalisalak", tps: "TPS 07", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 510, laki: 255, perempuan: 255 },
  { id: 8, rw: "RW 08", dusun: "Desa Kalisalak", tps: "TPS 08", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 520, laki: 268, perempuan: 252 },
  { id: 9, rw: "RW 09", dusun: "Desa Kalisalak", tps: "TPS 09", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 617, laki: 315, perempuan: 302 },
  { id: 10, rw: "RW 10", dusun: "Desa Kalisalak", tps: "TPS 10", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 639, laki: 325, perempuan: 314 },
  { id: 11, rw: "RW 11", dusun: "Desa Kalisalak", tps: "TPS 11", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 729, laki: 376, perempuan: 353 },
  { id: 12, rw: "RW 12", dusun: "Desa Kalisalak", tps: "TPS 12", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 527, laki: 267, perempuan: 260 },
  { id: 13, rw: "RW 13", dusun: "Desa Kalisalak", tps: "TPS 13", lokasi: "Lapangan Desa Kalisalak", jmlPemilih: 746, laki: 389, perempuan: 357 },
];

export const DpsTable: React.FC = () => {
  const [dpsList, setDpsList] = useState<DpsRow[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("p2kd_public_dps_cache");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_DPS_ROWS;
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    let isMounted = true;
    const fetchDpsData = async () => {
      try {
        const res = await fetch("/api/stats");
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data?.tpsStats) && json.data.tpsStats.length > 0) {
          const rows: DpsRow[] = json.data.tpsStats.map((t: ApiTpsStat, idx: number) => {
            const rawRw = t.namaTps?.includes("RW") ? t.namaTps : (t.nomorTps || "");
            const num = parseInt(rawRw.replace(/\D/g, ""), 10) || (idx + 1);
            const rwFormatted = `RW ${String(num).padStart(2, "0")}`;
            return {
              id: idx + 1,
              rw: rwFormatted,
              dusun: "Desa Kalisalak",
              tps: `TPS ${String(num).padStart(2, "0")}`,
              lokasi: t.lokasi || `Wilayah ${rwFormatted}`,
              jmlPemilih: Number(t.total) || 0,
              laki: Number(t.laki) || 0,
              perempuan: Number(t.perempuan) || 0,
            };
          });

          // Sort strictly in ascending order by RW number (RW 01, RW 02, ... RW 13)
          rows.sort((a, b) => {
            const numA = parseInt(a.rw.replace(/\D/g, ""), 10) || 0;
            const numB = parseInt(b.rw.replace(/\D/g, ""), 10) || 0;
            return numA - numB;
          });

          setDpsList(rows);
          try {
            localStorage.setItem("p2kd_public_dps_cache", JSON.stringify(rows));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data DPS:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDpsData();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchDpsData();
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);


  const filtered = dpsList.filter(
    (item) =>
      item.rw.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dusun.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tps.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIdx = (currentPage - 1) * pageSize;
  const pagedList = filtered.slice(startIdx, startIdx + pageSize);

  const totalDps = dpsList.reduce((acc, curr) => acc + curr.jmlPemilih, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="mb-2">Rekapitulasi Resmi P2KD</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Daftar Pemilih Sementara (DPS) Pilkades Kalisalak
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal • Total DPS: <strong>{totalDps.toLocaleString("id-ID")} Pemilih</strong>
        </p>
      </div>

      {/* Filter and Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full sm:max-w-md">
            <Input
              icon={<Search className="w-4 h-4 text-slate-400" />}
              placeholder="Cari Tabung atau RW..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-2xl py-2.5 border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {loading ? (
            <div className="py-12 flex items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memuat data DPS resmi...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-800 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Wilayah RW</th>
                  <th className="py-3.5 px-4">Cakupan Wilayah</th>
                  <th className="py-3.5 px-4">Pusat Lokasi Pemilihan</th>
                  <th className="py-3.5 px-4 text-right">Laki-Laki</th>
                  <th className="py-3.5 px-4 text-right">Perempuan</th>
                  <th className="py-3.5 px-4 text-right font-black">Total Pemilih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-900">{row.rw}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {row.rw} (RT 01, 02, 03)
                    </td>
                    <td className="py-3 px-4 flex items-center gap-1.5 font-medium text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Desa Kalisalak</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{row.laki.toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{row.perempuan.toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-800">
                      {row.jmlPemilih.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="mt-4">
            <PaginationControl
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
