"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Share2,
  Download,
  FileText,
  Clock,
  Check,
  Newspaper,
  Flame,
  Loader2,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Card, Badge, Button } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { MasterBerita } from "@/lib/data-store";

export default function SingleBeritaPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const toast = useToast();

  const [article, setArticle] = useState<MasterBerita | null>(null);
  const [related, setRelated] = useState<MasterBerita[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/berita/${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setArticle(json.data.article);
          setRelated(json.data.related || []);
        }
      } catch (err) {
        console.error("Gagal memuat artikel:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchArticle();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Tautan Disalin", "Link berita telah disalin ke clipboard.");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWa = () => {
    if (!article || typeof window === "undefined") return;
    const text = `*${article.judul}*\n\nBaca rilis pers dan pengumuman resmi P2KD Desa Kalisalak selengkapnya:\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const getKategoriBadge = (kat: string) => {
    switch (kat) {
      case "TAHAPAN":
        return <Badge variant="primary">Tahapan Pilkades</Badge>;
      case "RAPAT_BA":
        return <Badge variant="success">Rapat &amp; Berita Acara</Badge>;
      case "SOSIALISASI":
        return <Badge variant="warning">Sosialisasi Warga</Badge>;
      case "DOKUMENTASI":
        return <Badge variant="default">Dokumentasi Lapangan</Badge>;
      default:
        return <Badge>{kat}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-12">
          <div className="flex items-center gap-3 text-slate-500 font-medium text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Memuat artikel liputan resmi...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-black text-slate-800">Artikel Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 font-normal">
            Berita yang Anda tuju mungkin telah diperbarui atau dipindahkan oleh sekretariat.
          </p>
          <Link href="/berita">
            <Button variant="primary" size="sm" className="mt-2">
              Kembali ke Arsip Berita
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const wordCount = article.konten.split(/\s+/).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-8 w-full">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <Link href="/berita" className="hover:text-blue-700 flex items-center gap-1.5 font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>Semua Berita &amp; Rilis Pers</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-400">
            ID: {article.slug}
          </span>
        </div>

        {/* Article Editorial Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {getKategoriBadge(article.kategori)}
            {article.isHeadline && (
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                <span>HEADLINE UTAMA</span>
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono ml-auto">
              <Clock className="w-3.5 h-3.5" />
              <span>{readTimeMinutes} menit baca</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {article.judul}
          </h1>

          {/* Author & Publication Meta Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {article.penulisNama ? article.penulisNama[0] : "P"}
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                  {article.penulisNama || "Sekretariat P2KD Desa Kalisalak"}
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {article.penulisJabatan || "Seksi Publikasi & Dokumentasi"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(article.createdAt).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{article.viewsCount || 0} hits</span>
              </span>
            </div>
          </div>
        </div>

        {/* Hero Featured Image */}
        <div className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xl relative aspect-video max-h-120">
          <Image
            src={article.gambarUrl || "/images/p2kd-musyawarah-kalisalak.png"}
            alt={article.judul}
            fill
            unoptimized
            priority
            className="object-cover"
          />
        </div>

        {/* Lead Excerpt */}
        {article.ringkasan && (
          <div className="p-5 rounded-2xl bg-blue-50/80 border-l-4 border-blue-600 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic">
            &ldquo;{article.ringkasan}&rdquo;
          </div>
        )}

        {/* Main Editorial Article Content */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4">
            {article.konten.split("\n\n").map((paragraph, idx) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;

              // Check if paragraph is quote or bold heading
              if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                return (
                  <blockquote
                    key={idx}
                    className="p-4 my-4 bg-slate-50 rounded-xl border-l-4 border-amber-500 font-serif italic text-slate-700 text-sm"
                  >
                    {trimmed}
                  </blockquote>
                );
              }

              return (
                <p key={idx} className="leading-relaxed font-normal">
                  {trimmed}
                </p>
              );
            })}
          </div>

          {/* Download Official PDF Box (If attached) */}
          {article.lampiranPdfUrl && (
            <div className="mt-8 p-5 rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-emerald-900 tracking-wide block">
                    DOKUMEN LAMPIRAN RESMI (PDF)
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    {article.lampiranPdfNama || "Salinan Berita Acara / Pengumuman Terlampir"}
                  </span>
                </div>
              </div>

              <a
                href={article.lampiranPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen PDF</span>
              </a>
            </div>
          )}

          {/* Social Share Bar */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Bagikan Informasi Ini:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWa}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? "Tautan Tersalin" : "Salin Link"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related Stories */}
        {related.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-blue-700" />
                <span>Berita Terkait Lainnya</span>
              </h3>
              <Link href="/berita" className="text-xs font-bold text-blue-700 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link key={rel.id} href={`/berita/${rel.slug}`}>
                  <Card className="h-full p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer">
                    <div className="space-y-2.5">
                      <div className="relative h-32 rounded-xl overflow-hidden bg-slate-900">
                        <Image
                          src={rel.gambarUrl || "/images/p2kd-musyawarah-kalisalak.png"}
                          alt={rel.judul}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700">
                        {rel.judul}
                      </h4>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="truncate">{rel.penulisNama || "Sekretariat"}</span>
                      <span>
                        {new Date(rel.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
