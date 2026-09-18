/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Award,
  BookOpen,
  Phone,
  ArrowRight,
  Loader2,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, Logo, Button } from "@/components/ui";

interface PanitiaMember {
  id: string;
  namaLengkap: string;
  jabatan: string;
  seksi: string;
  seksiLabel: string;
  fotoUrl?: string | null;
}

const SEKSI_GROUPS = [
  {
    key: "PIMPINAN",
    title: "Pimpinan & Sekretariat P2KD",
    desc: "Unsur pimpinan penanggung jawab umum, manajerial tahapan, administrasi persuratan, dan perbendaharaan keuangan Pilkades.",
    badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    headerBg: "from-amber-950 via-slate-900 to-indigo-950",
  },
  {
    key: "SEKSI_PEMILIH",
    title: "Seksi 1: Pendaftaran & Pemutakhiran Pemilih",
    desc: "Bertanggung jawab atas pemutakhiran data DPS, rekrutmen/bimbingan teknis Pantarlih, penyusunan DPSHP, hingga penetapan DPT final.",
    badgeColor: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    headerBg: "from-blue-950 via-slate-900 to-indigo-950",
  },
  {
    key: "SEKSI_PENJARINGAN",
    title: "Seksi 2: Penjaringan Bakal Calon Kepala Desa",
    desc: "Bertanggung jawab atas pengumuman pendaftaran, penerimaan berkas pendaftaran balon Kades, dan verifikasi awal kelengkapan administrasi.",
    badgeColor: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    headerBg: "from-purple-950 via-slate-900 to-indigo-950",
  },
  {
    key: "SEKSI_PENYARINGAN",
    title: "Seksi 3: Penyaringan & Uji Kelayakan Calon",
    desc: "Bertanggung jawab atas verifikasi keabsahan ijazah/dokumen, klarifikasi instansi, ujian tertulis/wawancara (jika > 5 calon), dan penetapan calon berhak dipilih.",
    badgeColor: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
    headerBg: "from-indigo-950 via-slate-900 to-blue-950",
  },
  {
    key: "SEKSI_PUNGUT_HITUNG",
    title: "Seksi 4: Pemungutan & Penghitungan Suara",
    desc: "Bertanggung jawab atas teknis TPS Lapangan, penyiapan surat suara & bilik suara, bimbingan teknis KPPS/Petugas Meja, hingga rekapitulasi pleno.",
    badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    headerBg: "from-emerald-950 via-slate-900 to-indigo-950",
  },
  {
    key: "SEKSI_LOGISTIK_PUBLIKASI",
    title: "Seksi 5: Logistik, Publikasi & Humas",
    desc: "Bertanggung jawab atas pengadaan perlengkapan Pilkades, penyebaran informasi publik, transparansi berita desa, dan posko layanan warga.",
    badgeColor: "bg-rose-500/10 text-rose-700 border-rose-500/20",
    headerBg: "from-rose-950 via-slate-900 to-indigo-950",
  },
];

export const StrukturContent: React.FC = () => {
  const [panitiaList, setPanitiaList] = useState<PanitiaMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/panitia")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data)) {
          setPanitiaList(json.data);
        }
      })
      .catch((err) => console.warn("Load panitia failed:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getInitials = (name: string) => {
    return (
      name
        .replace(/S\.Pd\.SD|S\.Pd|S\.Kom|S\.Ak|H\.|Hj\./gi, "")
        .trim()
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "PK"
    );
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="mb-2">
          <Users className="w-3.5 h-3.5 mr-1.5 inline text-blue-700" />
          Struktur Organisasi & Personil Resmi
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Panitia Pemilihan Kepala Desa (P2KD)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium leading-relaxed">
          Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal • Ditetapkan Berdasarkan Surat Keputusan BPD Kalisalak untuk Masa Pemilihan 2027 – 2035
        </p>
      </div>

      {/* Hero Overview Card */}
      <Card className="p-6 sm:p-8 bg-linear-to-br from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider text-amber-300 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Integritas, Transparansi & Netralitas
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              Pelaksana Resmi Pilkades Serentak Desa Kalisalak
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              P2KD Kalisalak bertugas merencanakan, mengorganisasikan, menyelenggarakan, dan mengawasi seluruh tahapan pemilihan kepala desa secara jujur, adil, transparan, dan akuntabel sesuai peraturan perundang-undangan.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            <Link href="/informasi" className="w-full">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center bg-white text-blue-950 hover:bg-slate-100 font-bold rounded-xl py-2.5 text-xs shadow-md"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
                <span>Lihat Regulasi & PP 16/2026</span>
              </Button>
            </Link>

            <a
              href="https://wa.me/6285879584257?text=Halo%20Panitia%20P2KD%20Kalisalak%2C%20saya%20ingin%20berkonsultasi%20mengenai%20tahapan%20Pilkades"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center border-slate-700 bg-white/5 text-white hover:bg-white/10 font-bold rounded-xl py-2.5 text-xs backdrop-blur-xs"
              >
                <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span>Kontak Sekretariat P2KD</span>
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Dynamic Member Roster by Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Memuat susunan struktur panitia dari database...</span>
        </div>
      ) : (
        <div className="space-y-10">
          {SEKSI_GROUPS.map((group, gIdx) => {
            const members = panitiaList.filter((m) => m.seksi === group.key);

            return (
              <div key={group.key} className="space-y-4">
                {/* Section Group Header */}
                <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-block mb-1.5 ${group.badgeColor}`}
                    >
                      Struktur Unit #{gIdx + 1}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {group.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
                      {group.desc}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl shrink-0 self-start sm:self-auto">
                    {members.length > 0 ? `${members.length} Personil` : "Dalam Penetapan"}
                  </span>
                </div>

                {/* Member Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {members.map((m, mIdx) => (
                    <motion.div
                      key={m.id || mIdx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: mIdx * 0.05 }}
                    >
                      <Card className="h-full border border-slate-200/90 hover:border-blue-400 bg-white rounded-2xl shadow-xs hover:shadow-lg transition-all p-5 flex flex-col items-center text-center justify-between group">
                        <div className="w-full flex flex-col items-center space-y-3">
                          {/* Photo Avatar on Top */}
                          <div className="relative">
                            <div className="w-22 h-22 rounded-2xl p-0.5 bg-linear-to-tr from-amber-400 via-blue-500 to-indigo-500 shadow-md">
                              <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                                {m.fotoUrl ? (
                                  <img
                                    src={m.fotoUrl}
                                    alt={m.namaLengkap}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-900 to-slate-900 text-amber-300 font-black text-2xl">
                                    {getInitials(m.namaLengkap)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 text-white border-2 border-white shadow-xs">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Member Info */}
                          <div className="space-y-1 w-full">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-2">
                              {m.namaLengkap}
                            </h3>
                            <p className="text-xs font-bold text-blue-700 flex items-center justify-center gap-1">
                              <Award className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{m.jabatan}</span>
                            </p>
                          </div>
                        </div>

                        {/* Verified Footer Badge */}
                        <div className="w-full pt-3 mt-3 border-t border-slate-100 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                            <FileCheck2 className="w-3 h-3 text-emerald-600" />
                            <span>SK Resmi P2KD</span>
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Support CTA */}
      <Card className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-3">
        <h3 className="text-base sm:text-lg font-black text-slate-900">
          Ingin Berkonsultasi atau Membutuhkan Informasi Tambahan?
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Panitia P2KD Desa Kalisalak siap melayani warga setiap hari kerja di Sekretariat Balai Desa Kalisalak atau melalui kanal pengaduan online resmi.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/aduan">
            <Button variant="primary" size="sm" className="text-xs font-bold rounded-xl shadow-xs">
              <span>Buka Posko Pengaduan</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link href="/faq">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
              <span>Pusat Bantuan (FAQ)</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
