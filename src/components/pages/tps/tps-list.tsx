"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge, Input, Logo, Button } from "@/components/ui";
import { Search, MapPin, ExternalLink, Navigation, Landmark, Layers, CheckCircle2, Loader2 } from "lucide-react";

interface TabungItem {
  id: string;
  nomorTabung: string;
  namaTabung: string;
  pintuMasuk: string;
  wilayahRw: string;
  cakupanRt: string;
  kuotaPerkiraan: number;
}

interface ApiTpsItem {
  id: string;
  nomorTps: string;
  namaTps: string;
  namaTabung?: string;
  lokasi: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  kuotaMaksimal?: number;
}

export const TpsList: React.FC = () => {
  const [tabungList, setTabungList] = useState<TabungItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [mapsUrl, setMapsUrl] = useState("https://www.google.com/maps/search/?api=1&query=Desa+Kalisalak+Margasari+Tegal");
  const [venueName, setVenueName] = useState("Desa Kalisalak");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/tps"),
      fetch("/api/config"),
    ])
      .then(async ([resTps, resConfig]) => {
        const jsonTps = await resTps.json();
        const jsonConfig = await resConfig.json();

        if (active) {
          if (jsonConfig.success && jsonConfig.data) {
            if (jsonConfig.data.lokasiMapsUrl) setMapsUrl(jsonConfig.data.lokasiMapsUrl);
            if (jsonConfig.data.lokasiUtama) setVenueName(jsonConfig.data.lokasiUtama);
          }

          if (jsonTps.success && Array.isArray(jsonTps.data)) {
            const mapped: TabungItem[] = jsonTps.data.map((t: ApiTpsItem, index: number) => {
              const tabungNum = t.nomorTps.replace(/\D/g, "") || String(index + 1).padStart(2, "0");
              return {
                id: t.id,
                nomorTabung: tabungNum.padStart(2, "0"),
                namaTabung: t.namaTabung || t.namaTps || `Tabung Pemilihan ${tabungNum}`,
                pintuMasuk: t.alamat || (index < 2 ? "Pintu Masuk Barat (A)" : index < 4 ? "Pintu Masuk Utara (B)" : "Pintu Masuk Timur (C)"),
                wilayahRw: t.rw ? (t.rw.includes("RW") ? t.rw : `RW ${t.rw}`) : `RW ${tabungNum}`,
                cakupanRt: t.rt ? (t.rt.includes("RT") ? t.rt : `RT ${t.rt}`) : "RT 01 s/d RT 03",
                kuotaPerkiraan: t.kuotaMaksimal || 600,
              };
            });
            setTabungList(mapped);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat data dari database:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = tabungList.filter(
    (t) =>
      t.namaTabung.toLowerCase().includes(query.toLowerCase()) ||
      t.wilayahRw.toLowerCase().includes(query.toLowerCase()) ||
      t.cakupanRt.toLowerCase().includes(query.toLowerCase()) ||
      t.pintuMasuk.toLowerCase().includes(query.toLowerCase()) ||
      t.nomorTabung.includes(query)
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="mb-2">
          <Landmark className="w-3.5 h-3.5 mr-1.5 inline text-blue-700" />
          Pusat Pemungutan Suara Terpadu Pilkades 2027 (Database Live)
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Lokasi Pemungutan & Tabung Pemilihan
        </h1>
        <p className="text-sm text-slate-600 mt-2 font-medium">
          Seluruh kegiatan pemungutan suara dipusatkan di <strong>{venueName}</strong> dengan pembagian Tabung/Kotak Pemilihan untuk 13 RW dan 39 RT.
        </p>
      </div>

      {/* Main Venue Banner (Desa Kalisalak) */}
      <Card className="p-6 sm:p-8 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl overflow-hidden relative border border-blue-900/60">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-600/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Lokasi Tunggal Terpusat
              </span>
              <span className="text-xs font-semibold text-blue-200 bg-blue-900/60 px-3 py-1 rounded-full border border-blue-700/60">
                13 RW • 39 Rukun Tetangga (RT)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <MapPin className="w-7 h-7 text-rose-400 shrink-0" />
              <span>{venueName}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kecamatan Margasari, Kabupaten Tegal. Pada hari Rabu, 3 Februari 2027 (07.00 – 13.00 WIB), seluruh pemilih menyalurkan hak suaranya di {venueName} menuju <strong>Tabung Pemilihan</strong> sesuai domisili RT/RW masing-masing.
            </p>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto bg-white text-blue-950 hover:bg-slate-100 font-extrabold rounded-2xl shadow-xl text-xs py-3.5 px-6 flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4 text-rose-600" />
              <span>Buka Petunjuk Arah (Google Maps)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </a>
        </div>
      </Card>

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
        <div className="w-full">
          <Input
            icon={<Search className="w-4 h-4 text-slate-400" />}
            placeholder="Cari nomor tabung, RW, atau rukun tetangga (RT)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-2xl py-3 border-slate-300 shadow-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Memuat data tabung pemilihan dari database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <Card
              key={t.id}
              className="p-6 hover:border-blue-400 rounded-3xl shadow-xs hover:shadow-lg transition-all flex flex-col justify-between bg-white border border-slate-200 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-black text-blue-950 bg-blue-100 px-3 py-1 rounded-xl">
                    TABUNG {t.nomorTabung}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                    {t.pintuMasuk}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {t.namaTabung}
                </h3>
                
                <div className="mt-2 text-xs font-semibold text-blue-900 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>Wilayah: <strong>{t.wilayahRw}</strong></span>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  Melayani pemilih: <strong>{t.cakupanRt}</strong>.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  {venueName}
                </span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  <span>Arah Rute</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
