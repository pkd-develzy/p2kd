"use client";

import React, { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge, Input, Logo, Button } from "@/components/ui";
import { Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CloudflareTurnstileShield, TurnstileShieldHandle } from "@/components/ui/cloudflare-turnstile-shield";
import { DAFTAR_RW_KALISALAK, DAFTAR_RT_KALISALAK } from "@/lib/kalisalak-wilayah";

export const AduanForm: React.FC = () => {
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [kontak, setKontak] = useState("");
  const [rt, setRt] = useState("01");
  const [rw, setRw] = useState("01");
  const [jenis, setJenis] = useState("BELUM_TERDAFTAR");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedNo, setSubmittedNo] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const turnstileRef = useRef<TurnstileShieldHandle>(null);

  const toast = useToast();

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setIsVerified(Boolean(token));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nik || nik.length !== 16) {
      toast.warning("NIK Tidak Lengkap", "NIK harus terdiri dari 16 digit angka KTP-el.");
      return;
    }

    if (!pesan.trim()) {
      toast.warning("Uraian Diperlukan", "Mohon jelaskan rincian permohonan atau aduan Anda.");
      return;
    }

    if (!turnstileToken) {
      toast.warning(
        "Verifikasi Keamanan Wajib",
        "Silakan selesaikan centang verifikasi keamanan Cloudflare Turnstile sebelum mengirimkan aduan."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/aduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          nik,
          kontak,
          rt,
          rw,
          jenis,
          pesan,
          turnstileToken,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setSubmittedNo(json.data.ticketNo);
        toast.success(
          "Aduan Berhasil Diterima",
          `Nomor registrasi tiket: ${json.data.ticketNo}. Panitia P2KD Kalisalak akan segera memverifikasi.`
        );
      } else {
        toast.error("Pengiriman Gagal", json.message || "Gagal mengirimkan laporan aduan. Silakan periksa kembali formulir Anda.");
      }
    } catch {
      toast.error("Kesalahan Jaringan", "Tidak dapat terhubung ke server database. Silakan coba beberapa saat lagi.");
    } finally {
      setLoading(false);
      turnstileRef.current?.reset();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="mb-2">Layanan Warga Desa Kalisalak</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Form Aduan & Perbaikan Data Pilkades
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal
        </p>
      </div>

      <Card className="p-6">
        {submittedNo ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Aduan Anda Telah Diterima</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Laporan Anda telah tercatat dengan nomor registrasi <strong className="text-blue-900 font-mono text-sm bg-blue-50 px-2 py-1 rounded">{submittedNo}</strong>. Panitia P2KD Desa Kalisalak akan memverifikasi berkas Anda.
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Butuh konfirmasi cepat atau bantuan teknis? Hubungi Layanan Aduan & Bantuan Resmi P2KD via WhatsApp di{" "}
              <a
                href={`https://wa.me/6285879584257?text=${encodeURIComponent(`Halo Panitia P2KD Kalisalak, saya ingin konfirmasi aduan nomor registrasi: ${submittedNo}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-bold hover:underline"
              >
                0858-7958-4257
              </a>.
            </p>
            <div className="pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmittedNo(null);
                  setNama("");
                  setNik("");
                  setKontak("");
                  setPesan("");
                  setIsVerified(false);
                  setTurnstileToken("");
                }}
              >
                Kirim Aduan Lainnya
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap Pemilih / Pelapor
              </label>
              <Input
                type="text"
                placeholder="Sesuai KTP-el"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor NIK KTP-el (16 Digit)
                </label>
                <Input
                  type="text"
                  maxLength={16}
                  placeholder="3328xxxxxxxxxxxx"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp / HP
                </label>
                <Input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  RW Domisili Kalisalak
                </label>
                <select
                  value={rw}
                  onChange={(e) => setRw(e.target.value)}
                  className="flex w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  {DAFTAR_RW_KALISALAK.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  RT Domisili Kalisalak
                </label>
                <select
                  value={rt}
                  onChange={(e) => setRt(e.target.value)}
                  className="flex w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  {DAFTAR_RT_KALISALAK.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jenis Permohonan / Aduan
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className="flex w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="BELUM_TERDAFTAR">Belum Terdaftar di DPS Pilkades (Pemilih Baru)</option>
                <option value="KOREKSI_DATA">Koreksi Penulisan Nama / NIK / Tanggal Lahir / RT-RW</option>
                <option value="MUTASI_TPS">Permohonan Pindah Lokasi Tabung di Kalisalak</option>
                <option value="LAPOR_TMS">Lapor Pemilih TMS (Meninggal Dunia / Pindah Keluar / TNI-Polri)</option>
                <option value="LAINNYA">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Rincian & Keterangan Laporan
              </label>
              <textarea
                rows={4}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                placeholder="Tuliskan alasan permohonan atau data yang perlu diperbaiki oleh panitia..."
                className="flex w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                required
              />
            </div>

            {/* Cloudflare Turnstile Bot Protection */}
            <div className="pt-1">
              <CloudflareTurnstileShield
                ref={turnstileRef}
                action="aduan_warga"
                isVerified={isVerified}
                onVerify={handleTurnstileVerify}
                label="Verifikasi Keamanan Aduan Lolos • Cloudflare Turnstile"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                disabled={!isVerified || loading}
                className="w-full py-3 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                Kirim Laporan ke Panitia P2KD Kalisalak
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
