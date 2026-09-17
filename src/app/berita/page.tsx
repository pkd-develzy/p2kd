"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Newspaper,
  Search,
  Calendar,
  User,
  Eye,
  Sparkles,
  Flame,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Card, Badge } from "@/components/ui";
import { MasterBerita } from "@/lib/data-store";

export default function BeritaIndexPage() {
  const [articles, setArticles] = useState<MasterBerita[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");

  useEffect(() => {
    let isMounted = true;
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/berita?limit=50");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setArticles(json.data.articles || []);
        }
      } catch (err) {
        console.error("Gagal memuat berita:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchArticles();
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

  const filtered = articles.filter((a) => {
    const matchSearch =
      searchTerm === "" ||
      a.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.ringkasan && a.ringkasan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.konten.toLowerCase().includes(searchTerm.toLowerCase());

    const matchKat = selectedKategori === "ALL" || a.kategori === selectedKategori;
    return matchSearch && matchKat;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 space-y-8 w-full">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-700 flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-900">Pusat Berita &amp; Liputan Media</span>
        </div>

        {/* Page Hero Header */}
        <div className="rounded-3xl bg-linear-to-r from-blue-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-10 shadow-xl border border-blue-800/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.35),transparent_70%)] pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MEDIA CENTER P2KD KALISALAK 2027</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Pusat Informasi &amp; Berita Warga
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed font-normal">
              Akses keterbukaan informasi publik seputar proses demokrasi pemilihan kepala desa, berita acara rapat pleno, infografis tahapan, dan pengumuman resmi panitia.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kata kunci berita atau topik..."
              className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { key: "ALL", label: "Semua" },
              { key: "RAPAT_BA", label: "Rapat & Pleno" },
              { key: "TAHAPAN", label: "Tahapan" },
              { key: "SOSIALISASI", label: "Sosialisasi" },
              { key: "DOKUMENTASI", label: "Dokumentasi" },
            ].map((k) => (
              <button
                key={k.key}
                onClick={() => setSelectedKategori(k.key)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedKategori === k.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="p-20 text-center text-slate-500 text-xs flex items-center justify-center gap-2 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Memuat arsip berita...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
            <Newspaper className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tidak Ditemukan Berita</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
              Tidak ada artikel yang cocok dengan pencarian &ldquo;{searchTerm}&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((art) => (
              <Link key={art.id} href={`/berita/${art.slug}`}>
                <Card className="h-full bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between group cursor-pointer">
                  <div className="space-y-4">
                    {/* Thumbnail */}
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-900">
                      <Image
                        src={art.gambarUrl || "/images/p2kd-musyawarah-kalisalak.png"}
                        alt={art.judul}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {getKategoriBadge(art.kategori)}
                        {art.isHeadline && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md">
                            <Flame className="w-3 h-3 fill-slate-950" />
                            <span>HEADLINE</span>
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] text-white font-mono flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{art.viewsCount || 0}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                        {art.judul}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-normal">
                        {art.ringkasan || art.konten.slice(0, 140)}...
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium truncate max-w-32.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{art.penulisNama || "Sekretariat P2KD"}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
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
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
