/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Award,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Calendar,
  Sparkles,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Vote,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface KandidatItem {
  id: string;
  nomorUrut: number;
  namaLengkap: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  tempatTanggalLahir: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  tagline: string;
  visi: string;
  misi: string[];
  programUnggulan: string[];
  fotoUrl: string;
  warnaTema: string;
  statusVerifikasi: string;
}

export const HomeCalonSection: React.FC = () => {
  const [calonList, setCalonList] = useState<KandidatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/calon")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setCalonList(json.data);
          } else {
            setCalonList([]);
          }
        }
      })
      .catch((err) => {
        console.warn("Gagal memuat data calon:", err);
        if (isMounted) setCalonList([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-500/20 mb-2">
              <Vote className="w-3.5 h-3.5 text-amber-600" />
              <span>Kandidat Pilkades Desa Kalisalak 2027 – 2035</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Profil Calon & Pendaftar Kepala Desa
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-normal">
              Kenali visi, misi, rekam jejak, dan program unggulan para calon pemimpin Desa Kalisalak untuk menentukan masa depan desa kita secara bijak dan cerdas.
            </p>
          </div>

          <Link href="/calon" className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto font-bold text-xs rounded-xl border-slate-300 hover:border-blue-600 hover:text-blue-700 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>Halaman Lengkap Calon</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <span className="text-xs font-semibold text-slate-500">
              Menghubungkan data calon Kepala Desa dari sistem P2KD...
            </span>
          </div>
        ) : calonList.length === 0 ? (
          /* Empty / Tahapan Belum Ditetapkan State */
          <Card className="p-6 sm:p-10 text-center bg-linear-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl border border-blue-900/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 inline-block">
                  Tahapan Penjaringan & Penyaringan Balon Kades
                </span>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Daftar Calon Resmi Sedang Dalam Tahapan Berkas & Verifikasi
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Seksi 2 (Penjaringan Balon) & Seksi 3 (Penyaringan Balon) P2KD Kalisalak sedang memproses penetapan calon resmi. Nomor urut, foto, visi-misi, serta program prioritas akan ditampilkan secara transparan di sini.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href="/tahapan">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md"
                  >
                    <span>Lihat Jadwal Tahapan</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/syarat-daftar-kades">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/15"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    <span>Syarat Pendaftaran</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          /* Grid of Official Candidates */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calonList.map((c, i) => (
              <motion.div
                key={c.id || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full border border-slate-200/90 hover:border-blue-400 bg-white rounded-3xl shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group">
                  <div>
                    {/* Header Card / Candidate Banner with Number */}
                    <div
                      className="p-5 text-white text-center relative overflow-hidden"
                      style={{ backgroundColor: c.warnaTema || "#1e3a8a" }}
                    >
                      <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border border-white/30">
                        CALON RESMI
                      </div>

                      <div className="w-22 h-22 mx-auto my-2 rounded-2xl bg-white/15 border-3 border-white/40 flex items-center justify-center shadow-md overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                        {c.fotoUrl ? (
                          <img
                            src={c.fotoUrl}
                            alt={c.namaLengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-white" />
                        )}
                      </div>

                      <div className="inline-block bg-white text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-sm mb-1.5">
                        NOMOR URUT 0{c.nomorUrut}
                      </div>

                      <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug line-clamp-2">
                        {c.gelarDepan ? `${c.gelarDepan} ` : ""}
                        {c.namaLengkap}
                        {c.gelarBelakang ? `, ${c.gelarBelakang}` : ""}
                      </h3>

                      {c.tagline && (
                        <p className="text-[11px] text-white/90 italic mt-1 font-medium px-2 line-clamp-1">
                          &ldquo;{c.tagline}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Candidate Bio & Highlights */}
                    <div className="p-5 space-y-4 text-xs text-slate-700">
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">TTL: <strong>{c.tempatTanggalLahir}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">Pendidikan: <strong>{c.pendidikanTerakhir}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Pekerjaan: <strong>{c.pekerjaan}</strong></span>
                        </div>
                      </div>

                      {/* Visi Singkat */}
                      {c.visi && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                            Visi Utama:
                          </span>
                          <p className="text-[11px] text-slate-800 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/70 leading-relaxed font-medium line-clamp-3">
                            {c.visi}
                          </p>
                        </div>
                      )}

                      {/* Program Prioritas */}
                      {c.programUnggulan && c.programUnggulan.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Program Unggulan:
                          </span>
                          <div className="space-y-1">
                            {c.programUnggulan.slice(0, 2).map((prog, pidx) => (
                              <div
                                key={pidx}
                                className="bg-amber-50/60 border border-amber-200/50 p-1.5 px-2.5 rounded-lg text-[10px] font-semibold text-amber-950 flex items-center gap-1.5 truncate"
                              >
                                <span className="w-1 h-1 rounded-full bg-amber-600 shrink-0" />
                                <span className="truncate">{prog}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Terverifikasi Sah P2KD</span>
                    </span>

                    <Link href="/calon" className="shrink-0">
                      <span className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 hover:underline cursor-pointer">
                        <span>Detail</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
