"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Newspaper,
  Calendar,
  User,
  ArrowRight,
  Flame,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { MasterBerita } from "@/lib/data-store";

interface NewsSectionProps {
  initialHeadline?: MasterBerita | null;
  initialArticles?: MasterBerita[];
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  initialHeadline = null,
  initialArticles = [],
}) => {
  const [headline, setHeadline] = useState<MasterBerita | null>(() => {
    if (initialHeadline) return initialHeadline;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("p2kd_headline_cache");
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [articles, setArticles] = useState<MasterBerita[]>(() => {
    if (initialArticles && initialArticles.length > 0) return initialArticles;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("p2kd_articles_cache");
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");

  useEffect(() => {
    let isMounted = true;
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/berita?limit=6");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          if (json.data.headline) {
            setHeadline(json.data.headline);
            try {
              localStorage.setItem("p2kd_headline_cache", JSON.stringify(json.data.headline));
            } catch {
              // ignore
            }
          }
          if (Array.isArray(json.data.articles)) {
            setArticles(json.data.articles);
            try {
              localStorage.setItem("p2kd_articles_cache", JSON.stringify(json.data.articles));
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn("Gagal memuat berita publik:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNews();
    return () => {
      isMounted = false;
    };
  }, []);

  const getKategoriBadge = (kat: string) => {
    switch (kat) {
      case "TAHAPAN":
        return <Badge variant="primary">Tahapan Pilkades</Badge>;
      case "RAPAT_BA":
        return <Badge variant="success">Rapat &amp; Pleno</Badge>;
      case "SOSIALISASI":
        return <Badge variant="warning">Sosialisasi</Badge>;
      case "DOKUMENTASI":
        return <Badge variant="default">Dokumentasi</Badge>;
      default:
        return <Badge>{kat}</Badge>;
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (selectedKategori === "ALL") return true;
    return a.kategori === selectedKategori;
  });

  const displayHeadline = headline || articles[0] || null;
  const gridArticles = displayHeadline
    ? filteredArticles.filter((a) => a.id !== displayHeadline.id).slice(0, 3)
    : filteredArticles.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-1.5 border border-blue-200/60">
            <Newspaper className="w-3.5 h-3.5" />
            <span>PORTAL BERITA &amp; MEDIA PUBLIK DESA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kabar Terkini &amp; Dokumentasi Pilkades
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Informasi resmi, risalah rapat pleno, tahapan pendaftaran, dan sosialisasi warga Kalisalak.
          </p>
        </div>

        <Link
          href="/berita"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline shrink-0"
        >
          <span>Lihat Semua Berita &amp; Rilis Pers</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "Semua Liputan" },
          { key: "RAPAT_BA", label: "Rapat & Pleno" },
          { key: "TAHAPAN", label: "Tahapan Pilkades" },
          { key: "SOSIALISASI", label: "Sosialisasi Warga" },
          { key: "DOKUMENTASI", label: "Dokumentasi Lapangan" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedKategori(item.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedKategori === item.key
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Memuat warta &amp; berita terkini...</span>
        </div>
      ) : displayHeadline ? (
        <div className="space-y-6">
          {/* Featured Headline Spotlight */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link href={`/berita/${displayHeadline.slug}`}>
              <Card className="overflow-hidden bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xl transition-all duration-300 group cursor-pointer">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Big Image Banner */}
                  <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-auto bg-slate-900 overflow-hidden min-h-55">
                    <Image
                      src={displayHeadline.gambarUrl || "https://res.cloudinary.com/xwgfvkld/image/upload/v1790082178/p2kd_berita/p2kd-musyawarah-kalisalak.png"}
                      alt={displayHeadline.judul}
                      fill
                      unoptimized
                      priority
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/20 to-transparent lg:hidden" />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg">
                        <Flame className="w-3.5 h-3.5 fill-slate-950" />
                        <span>BERITA UTAMA</span>
                      </span>
                      {getKategoriBadge(displayHeadline.kategori)}
                    </div>
                  </div>

                  {/* Headline Editorial Body */}
                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="hidden lg:flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-400/30 font-black text-[11px] flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>BERITA UTAMA</span>
                        </span>
                        {getKategoriBadge(displayHeadline.kategori)}
                      </div>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                        {displayHeadline.judul}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-normal">
                        {displayHeadline.ringkasan || displayHeadline.konten.slice(0, 160)}...
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {displayHeadline.penulisNama ? displayHeadline.penulisNama[0] : "P"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-xs truncate max-w-35">
                            {displayHeadline.penulisNama || "Sekretariat P2KD"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {displayHeadline.penulisJabatan || "Seksi Publikasi & Dokumentasi"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(displayHeadline.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-blue-700 font-bold group-hover:translate-x-0.5 transition-transform">
                          <span>Baca Berita</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>

          {/* 3-Column Editorial Grid for Other Stories */}
          {gridArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridArticles.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  <Link href={`/berita/${art.slug}`}>
                    <Card className="h-full bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all duration-200 p-4 flex flex-col justify-between group cursor-pointer">
                      <div className="space-y-3">
                        {/* Thumbnail */}
                        <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-900">
                          <Image
                            src={art.gambarUrl || "https://res.cloudinary.com/xwgfvkld/image/upload/v1790082178/p2kd_berita/p2kd-musyawarah-kalisalak.png"}
                            alt={art.judul}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3">
                            {getKategoriBadge(art.kategori)}
                          </div>
                        </div>

                        {/* Title & Excerpt */}
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                            {art.judul}
                          </h4>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-normal">
                            {art.ringkasan || art.konten.slice(0, 100)}...
                          </p>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium truncate max-w-32.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{art.penulisNama || "Sekretariat"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(art.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </span>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
