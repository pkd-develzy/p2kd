"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge, Logo } from "@/components/ui";
import { HelpCircle, ChevronDown, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqData = [
  {
    q: "Bagaimana jika nama saya belum terdaftar di Daftar Pemilih Sementara (DPS)?",
    a: "Anda dapat mengajukan permohonan pendaftaran baru melalui menu 'Aduan & Perbaikan' pada portal ini atau datang langsung ke Sekretariat Panitia Pemilihan Kepala Desa (P2KD) di Kantor Balai Desa Kalisalak dengan membawa KTP-el dan Kartu Keluarga.",
  },
  {
    q: "Berapa lama masa jabatan Kepala Desa terpilih pada Pilkades ini?",
    a: "Berdasarkan Pasal 50 Peraturan Pemerintah Nomor 16 Tahun 2026 dan Undang-Undang Nomor 3 Tahun 2024 tentang Desa, Kepala Desa memegang masa jabatan selama 8 (delapan) tahun terhitung sejak tanggal pelantikan (Masa Bakti 2027–2035) dan dapat menjabat paling banyak 2 (dua) kali masa jabatan.",
  },
  {
    q: "Berapa jumlah calon Kepala Desa yang berhak mengikuti Pilkades?",
    a: "Sesuai Pasal 39 ayat (3) huruf c PP No. 16 Tahun 2026, jumlah calon Kepala Desa yang ditetapkan untuk mengikuti pemilihan adalah paling sedikit 2 (dua) orang dan paling banyak 5 (lima) orang. Apabila pendaftar yang memenuhi syarat lebih dari 5 orang, akan diadakan seleksi tambahan.",
  },
  {
    q: "Bagaimana jika hanya terdapat 1 (satu) calon Kepala Desa yang mendaftar?",
    a: "Berdasarkan Pasal 44 dan Pasal 46 PP No. 16 Tahun 2026, jika hanya ada 1 calon, panitia memperpanjang pendaftaran 15 hari lalu 10 hari. Jika tetap 1 calon dan disepakati musyawarah BPD, pemilihan dilanjutkan dengan menggunakan surat suara 2 kolom: 1 kolom foto calon dan 1 kolom kosong tidak bergambar (Kotak Kosong).",
  },
  {
    q: "Kapan hari pemungutan suara (pencoblosan) Pilkades Kalisalak dilaksanakan?",
    a: "Berdasarkan Keputusan Bupati Tegal Nomor 100.3.3.2/713 Tahun 2026, hari pemungutan dan penghitungan suara Pilkades Serentak Gelombang I dilaksanakan serentak pada hari Rabu, 3 Februari 2027 mulai pukul 07.00 s/d 13.00 WIB di masing-masing TPS.",
  },
  {
    q: "Apakah data NIK saya aman saat mengecek di portal publik?",
    a: "Sangat aman. Sistem kami menerapkan perlindungan keamanan server dan database tingkat lanjut serta tidak pernah mengekspos NIK lengkap ke internet. Respon hasil pencarian hanya menampilkan nama dan alokasi TPS dengan proteksi server aman.",
  },
  {
    q: "Kapan batas akhir perbaikan data sebelum DPT dikunci?",
    a: "Masa perbaikan, tanggapan masyarakat, dan penyusunan Daftar Pemilih Tambahan (DPTambahan) berlangsung hingga 24 Desember 2026. Pleno Penetapan Daftar Pemilih Tetap (DPT) dilaksanakan pada 28 Desember 2026.",
  },
  {
    q: "Apakah pemilih pemula yang baru berusia 17 tahun pada hari H pemungutan suara berhak memilih?",
    a: "Ya, setiap warga negara yang telah genap berusia 17 tahun pada atau sebelum hari pemungutan suara (3 Februari 2027) atau sudah/pernah kawin berhak didaftarkan sebagai pemilih.",
  },
];

export const FaqAccordion: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="mb-2">Pusat Bantuan</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Pertanyaan yang Sering Diajukan (FAQ)
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Jawaban resmi atas pertanyaan seputar pendaftaran, hak pilih, dan tata cara pemilihan berdasarkan PP No. 16 Tahun 2026.
        </p>
      </div>

      <div className="space-y-3">
        {faqData.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <Card key={idx} className="p-0 overflow-hidden border-slate-200">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{item.q}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180 text-blue-700" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Helpdesk Contact Card */}
      <Card className="mt-8 p-6 bg-linear-to-r from-blue-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-blue-900/50 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              Masih Ada Pertanyaan yang Belum Terjawab?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Silakan hubungi Layanan Bantuan & Helpdesk Resmi Panitia P2KD Desa Kalisalak di nomor kontak/WhatsApp:{" "}
              <strong className="text-emerald-300 font-mono">0858-7958-4257</strong>.
            </p>
          </div>
          <a
            href="https://wa.me/6285879584257?text=Halo%20Panitia%20P2KD%20Kalisalak%2C%20saya%20ingin%20bertanya%20seputar%20informasi%20Pilkades"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Chat WhatsApp P2KD</span>
          </a>
        </div>
      </Card>
    </div>
  );
};
