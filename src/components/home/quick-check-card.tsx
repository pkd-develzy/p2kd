"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  CreditCard,
  Printer,
  Share2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CloudflareTurnstileShield, TurnstileShieldHandle } from "@/components/ui/cloudflare-turnstile-shield";

interface VoterResult {
  found: boolean;
  nik?: string;
  nama?: string;
  status?: string;
  tps?: string;
  lokasi?: string;
  wilayah?: string;
}

export const QuickCheckCard: React.FC = () => {
  const [nik, setNik] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoterResult | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const turnstileRef = useRef<TurnstileShieldHandle>(null);

  const toast = useToast();

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setIsVerified(Boolean(token));
  }, []);

  const handleNikChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    setNik(clean);
  };

  const handleReset = () => {
    setNik("");
    setDob("");
    setResult(null);
  };

  const handlePrintSlip = () => {
    if (!result || !result.found) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.warning("Pop-up Diblokir", "Mohon izinkan pop-up peramban untuk mencetak bukti hak pilih.");
      return;
    }

    const todayFormatted = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukti Hak Pilih - ${result.nama}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
          .card { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; color: #0f172a; }
          .header h1 { margin: 4px 0; font-size: 20px; font-weight: 900; color: #1e3a8a; }
          .header p { margin: 0; font-size: 12px; color: #64748b; }
          .status { display: inline-block; background: #059669; color: #fff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 20px; margin-top: 8px; }
          .content table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
          .content td { padding: 8px 4px; border-bottom: 1px dashed #cbd5e1; }
          .content td.label { font-weight: 600; color: #475569; width: 40%; }
          .content td.val { font-weight: bold; color: #0f172a; }
          .footer { margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          .seal { text-align: center; }
          .seal-box { border: 1px solid #059669; color: #059669; font-weight: bold; padding: 6px 12px; border-radius: 6px; font-size: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2>PANITIA PEMILIHAN KEPALA DESA (P2KD)</h2>
            <h1>DESA KALISALAK</h1>
            <p>Kecamatan Margasari, Kabupaten Tegal • Masa Bakti 2027 – 2035</p>
            <div class="status">BUKTI KETERDAFTARAN HAK PILIH SAH</div>
          </div>
          <div class="content">
            <table>
              <tr><td class="label">Nama Lengkap</td><td class="val">${result.nama}</td></tr>
              <tr><td class="label">Nomor Induk Kependudukan (NIK)</td><td class="val">${result.nik}</td></tr>
              <tr><td class="label">Status Penetapan</td><td class="val">${result.status}</td></tr>
              <tr><td class="label">Nomor TPS Terdaftar</td><td class="val" style="color: #1e3a8a; font-size: 15px;">${result.tps}</td></tr>
              <tr><td class="label">Lokasi Pemungutan Suara</td><td class="val">${result.lokasi}</td></tr>
              <tr><td class="label">Wilayah Domisili</td><td class="val">${result.wilayah}</td></tr>
              <tr><td class="label">Waktu Pengecekan</td><td class="val">${todayFormatted}</td></tr>
            </table>
          </div>
          <div class="footer">
            <div>
              <p style="margin: 0;">Dokumen ini dicetak otomatis melalui Portal Resmi P2KD Kalisalak.</p>
              <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 10px;">ID Security: SHA256-${Date.now().toString(16).toUpperCase()}</p>
            </div>
            <div class="seal">
              <div class="seal-box">VERIFIED BY DATABASE P2KD</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShareResult = async () => {
    if (!result || !result.found) return;
    const shareText = `Halo, saya telah memeriksa data hak pilih Pilkades Kalisalak 2026 atas nama ${result.nama}. Status: ${result.status}, terdaftar di ${result.tps} (${result.lokasi}). Periksa hak suara Anda di: ${window.location.origin}/cek-pemilih`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bukti Hak Pilih Pilkades Kalisalak 2026",
          text: shareText,
          url: window.location.origin + "/cek-pemilih",
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Teks Disalin", "Ringkasan data hak pilih telah disalin ke papan klip untuk dibagikan via WhatsApp.");
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nik || nik.length !== 16) {
      toast.warning(
        "Format NIK Tidak Valid",
        "NIK harus terdiri dari 16 digit angka sesuai standar KTP elektronik."
      );
      return;
    }

    if (!dob) {
      toast.warning(
        "Tanggal Lahir Diperlukan",
        "Silakan masukkan tanggal lahir untuk verifikasi pencarian hak pilih."
      );
      return;
    }

    if (!turnstileToken) {
      toast.warning(
        "Verifikasi Keamanan Wajib",
        "Silakan selesaikan centang verifikasi keamanan Cloudflare Turnstile terlebih dahulu."
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/voters/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nik, dob, turnstileToken }),
      });

      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setResult({
          found: true,
          nik: json.data.nik,
          nama: json.data.nama,
          status: json.data.status,
          tps: json.data.tps,
          lokasi: json.data.lokasiTps || "Balai Desa Kalisalak",
          wilayah: `RT ${json.data.rt || "-"} / RW ${json.data.rw || "-"}, Desa ${json.data.desa || "Kalisalak"}`,
        });
        toast.success(
          "Data Pemilih Ditemukan!",
          `Hak pilih atas nama ${json.data.nama} terdaftar di ${json.data.tps}.`
        );
      } else {
        setResult({ found: false });
        toast.error(
          "Data Belum Ditemukan",
          json.message || "Kombinasi NIK dan Tanggal Lahir belum terdaftar di DPS/DPT. Silakan ajukan aduan online."
        );
      }
    } catch {
      setResult({ found: false });
      toast.error(
        "Gagal Memeriksa",
        "Terjadi gangguan koneksi saat memeriksa data ke database."
      );
    } finally {
      setLoading(false);
      turnstileRef.current?.reset();
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-blue-200/90 bg-white shadow-xl shadow-blue-950/5 rounded-3xl overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-inner">
              <Search className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Cek Hak Pilih Mandiri
                </h2>
                <Badge variant="primary" className="bg-blue-600/80 text-white border-blue-400/40 text-[10px]">
                  LIVE DATABASE
                </Badge>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                Periksa status penetapan hak suara dan lokasi TPS Anda di Pilkades Kalisalak 2026
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Privasi Terenkripsi</span>
          </div>
        </div>
      </div>

      <CardContent className="p-6 sm:p-8 space-y-6">
        <form onSubmit={handleCheck} className="space-y-5">
          {/* Quick instructions steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <span>1. Nomor Induk Kependudukan (NIK)</span>
              </label>
              <Input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => handleNikChange(e.target.value)}
                placeholder="16 Digit NIK KTP-el (Contoh: 3328...)"
                className="py-3 px-3.5 text-sm border-slate-300 rounded-xl focus:border-blue-600 font-mono font-bold"
                required
              />
              <span className="text-[10px] text-slate-400 block pl-1">
                Ketik 16 digit angka sesuai KTP elektronik Anda
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-700" />
                <span>2. Tanggal Lahir Pemilih</span>
              </label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="py-3 px-3.5 text-sm font-medium border-slate-300 rounded-xl focus:border-blue-600"
                required
              />
              <span className="text-[10px] text-slate-400 block pl-1">
                Pilih tanggal lahir untuk verifikasi kepemilikan data
              </span>
            </div>
          </div>

          {/* Cloudflare Turnstile Bot Protection */}
          <div className="pt-1">
            <CloudflareTurnstileShield
              ref={turnstileRef}
              action="cek_nik"
              isVerified={isVerified}
              onVerify={handleTurnstileVerify}
              label="Verifikasi Keamanan Warga Lolos • Cloudflare Turnstile"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={!isVerified || loading}
              className="flex-1 py-3.5 text-sm font-black shadow-lg shadow-blue-900/15 rounded-xl disabled:opacity-50"
            >
              <Search className="w-4 h-4 mr-2" />
              <span>Periksa Data Hak Pilih Sekarang</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            {(nik || dob || result) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="py-3.5 px-4 rounded-xl border-slate-300 text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </form>

        {/* Animated Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden pt-2"
            >
              {result.found ? (
                <div className="p-6 rounded-3xl border-2 border-emerald-300 bg-linear-to-br from-emerald-50/90 via-teal-50/60 to-white space-y-4 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wider block">
                          Hak Suara Terdaftar Sah
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Data sesuai dengan Daftar Pemilih Desa Kalisalak
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" className="font-extrabold text-xs px-3 py-1 bg-emerald-600 text-white">
                      {result.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                      <span className="text-slate-500 text-[11px] font-semibold block mb-0.5">Nama Lengkap:</span>
                      <strong className="text-slate-900 text-base font-bold">{result.nama}</strong>
                    </div>

                    <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                      <span className="text-slate-500 text-[11px] font-semibold block mb-0.5">Nomor NIK (Sensor):</span>
                      <strong className="text-slate-900 font-mono text-base font-bold">{result.nik}</strong>
                    </div>

                    <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                      <span className="text-slate-500 text-[11px] font-semibold block mb-0.5">Wilayah Pemilihan (RW):</span>
                      <strong className="text-blue-900 text-base font-black flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-blue-700" />
                        {result.tps ? (result.tps.includes("RW") ? result.tps.replace(/Meja\s*(Pendaftaran\s*)?/gi, "") : `RW ${result.tps.replace(/\D/g, "").padStart(2, "0")}`) : "Wilayah RW"}
                      </strong>
                    </div>

                    <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                      <span className="text-slate-500 text-[11px] font-semibold block mb-0.5">Pusat Lokasi Pemungutan:</span>
                      <span className="font-bold text-sm text-rose-900">Desa Kalisalak</span>
                    </div>

                    <div className="sm:col-span-2 bg-white/80 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                      <span className="text-slate-500 text-[11px] font-semibold block mb-0.5">Wilayah Domisili Warga:</span>
                      <span className="text-slate-900 font-semibold text-sm">{result.wilayah}</span>
                    </div>
                  </div>

                  {/* Citizen Actions: Cetak Bukti & Bagikan via WhatsApp */}
                  <div className="pt-3 border-t border-emerald-200/80 flex flex-wrap gap-2.5">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handlePrintSlip}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs py-2 px-4 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      <span>Cetak / Simpan Bukti Hak Pilih</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShareResult}
                      className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl text-xs py-2 px-3.5"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      <span>Bagikan / Salin Data</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl border border-amber-200 bg-linear-to-br from-amber-50/90 to-orange-50/40 space-y-3 shadow-md">
                  <div className="flex items-center gap-2.5 text-amber-950 font-bold text-base">
                    <div className="p-2 rounded-xl bg-amber-200 text-amber-900">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <span>Data Belum Terdaftar di Master DPS/DPT</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed pl-1">
                    Kombinasi NIK dan Tanggal Lahir yang Anda masukkan belum tercatat pada daftar pemilih aktif. Jika Anda adalah warga Desa Kalisalak yang telah memiliki hak pilih, silakan ajukan tanggapan atau pendaftaran pemilih baru secara online.
                  </p>
                  <div className="pt-2 pl-1">
                    <Link href="/aduan">
                      <Button variant="primary" size="sm" className="bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                        <span>Buka Formulir Aduan Warga Online</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
