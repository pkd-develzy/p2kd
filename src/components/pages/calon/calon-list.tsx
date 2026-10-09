/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Award, CheckCircle2, GraduationCap, Briefcase, Calendar, Sparkles, Loader2, Flag, ArrowRight, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, Logo, Button } from "@/components/ui";
import { formatNamaSaja, formatGelarDepan, formatGelarBelakang } from "@/lib/nama-gelar";

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

export const CalonList: React.FC = () => {
  const [calonList, setCalonList] = useState<KandidatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalon = async () => {
      try {
        const res = await fetch("/api/calon");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCalonList(json.data);
        } else {
          setCalonList([]);
        }
      } catch (err) {
        console.error("Gagal mengambil data calon:", err);
        setCalonList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCalon();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="mb-2">
          <Award className="w-3.5 h-3.5 mr-1.5 inline text-blue-700" />
          Kandidat Resmi Pilkades 2027 – 2035
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Profil Calon Kepala Desa Kalisalak
        </h1>
        <p className="text-sm text-slate-600 mt-2 font-medium">
          Kecamatan Margasari, Kabupaten Tegal • Data Terhubung Langsung ke Sistem Informasi P2KD
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Memuat profil calon Kepala Desa dari database...</span>
        </div>
      ) : calonList.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center max-w-2xl mx-auto bg-white border-2 border-dashed border-slate-300 rounded-3xl shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Tahapan Penetapan Calon Belum Dibuka di Database
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Daftar resmi, nomor urut, visi, misi, dan program unggulan calon Kepala Desa Kalisalak akan tampil otomatis di halaman ini setelah ditetapkan dan diinput oleh Panitia P2KD.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tahapan">
              <Button variant="primary" size="sm" className="text-xs font-bold rounded-xl">
                <span>Lihat Jadwal & Tahapan</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
            <Link href="/cek-pemilih">
              <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                <span>Cek Hak Pilih Diri</span>
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {calonList.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full border-2 border-slate-200/90 hover:border-blue-400 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Top Candidate Banner with Number */}
                  <div
                    className="p-6 text-white text-center relative overflow-hidden"
                    style={{ backgroundColor: c.warnaTema || "#1e3a8a" }}
                  >
                    <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border border-white/30">
                      CALON RESMI
                    </div>

                    <div className="w-24 h-24 mx-auto my-3 rounded-full bg-white/15 border-4 border-white/40 flex items-center justify-center shadow-lg overflow-hidden relative">
                      {c.fotoUrl ? (
                        <img
                          src={c.fotoUrl}
                          alt={c.namaLengkap}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                    </div>

                    <div className="inline-block bg-white text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow-md mb-2">
                      NOMOR URUT 0{c.nomorUrut}
                    </div>

                    <h3 className="text-xl font-black tracking-tight text-white leading-snug">
                      {c.gelarDepan ? `${formatGelarDepan(c.gelarDepan)} ` : ""}
                      {formatNamaSaja(c.namaLengkap)}
                      {c.gelarBelakang ? `, ${formatGelarBelakang(c.gelarBelakang)}` : ""}
                    </h3>

                    {c.tagline && (
                      <p className="text-xs text-white/90 italic mt-1 font-medium px-2">
                        &ldquo;{c.tagline}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Candidate Bio Details */}
                  <div className="p-6 space-y-5 text-xs text-slate-700">
                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>TTL: <strong>{c.tempatTanggalLahir}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Pendidikan: <strong>{c.pendidikanTerakhir}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pekerjaan: <strong>{c.pekerjaan}</strong></span>
                      </div>
                    </div>

                    {/* Visi */}
                    {c.visi && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                          <Flag className="w-3.5 h-3.5 text-blue-700" />
                          <span>Visi Utama</span>
                        </div>
                        <p className="text-xs text-slate-800 bg-blue-50/60 p-3 rounded-xl border border-blue-100/80 leading-relaxed font-medium">
                          {c.visi}
                        </p>
                      </div>
                    )}

                    {/* Misi */}
                    {c.misi && c.misi.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Misi Kerja</span>
                        </div>
                        <ul className="space-y-1.5 pl-1">
                          {c.misi.map((m, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Program Unggulan */}
                    {c.programUnggulan && c.programUnggulan.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Program Prioritas</span>
                        </div>
                        <div className="space-y-1">
                          {c.programUnggulan.map((prog, pidx) => (
                            <div
                              key={pidx}
                              className="bg-amber-50/70 border border-amber-200/60 p-2 rounded-xl text-[11px] font-semibold text-amber-950 flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                              <span>{prog}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/80 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Berkas Terverifikasi Sah oleh P2KD
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
