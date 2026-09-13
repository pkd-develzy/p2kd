import React from "react";
import Link from "next/link";
import { Shield, FileText, Search, MapPin, Phone, Clock, ShieldCheck, Database, Calendar, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pt-14 pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800 text-xs">
          {/* Col 1 & 2: Identitas Resmi & Kontak */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 w-fit backdrop-blur-xs shadow-sm">
              <Logo
                size="sm"
                showText
                theme="dark"
                subtitle="Panitia Pemilihan Kepala Desa"
                titleClassName="text-white font-black"
                subtitleClassName="text-blue-300 font-bold"
              />
            </div>
            
            <p className="text-slate-200 leading-relaxed text-xs max-w-sm pt-1 font-normal">
              Portal resmi pendaftaran pemilih dan publikasi data Pilkades Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal. Menjamin transparansi dan hak pilih warga terdaftar secara sah.
            </p>

            <div className="space-y-3 pt-2 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-bold">Sekretariat P2KD:</strong> Gedung Balai Desa Kalisalak, Jl. Raya Margasari – Kalisalak No. 01, Kec. Margasari, Kab. Tegal 52463
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold block mb-0.5">Jam Layanan:</strong>
                  <div className="text-slate-200 text-xs space-y-0.5">
                    <p>• Senin – Kamis (08:00 – 13:00 WIB)</p>
                    <p>• Jum&apos;at (08.00 – 11.00 WIB)</p>
                    <p>• Sabtu – Minggu (Libur)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong className="text-white font-bold">Layanan Informasi Warga:</strong> (0283) 345-6789 / 0812-3456-7890</span>
              </div>
            </div>
          </div>

          {/* Col 3: Informasi & Tahapan */}
          <div className="space-y-3">
            <h5 className="font-black text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1.5 border-b border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Informasi & Tahapan
            </h5>
            <ul className="space-y-2.5 text-slate-200 font-medium pt-1">
              <li>
                <Link href="/informasi" className="hover:text-blue-300 transition-colors block py-0.5">
                  Tentang Pilkades Kalisalak
                </Link>
              </li>
              <li>
                <Link href="/calon" className="hover:text-blue-300 transition-colors block py-0.5 font-bold text-blue-300">
                  Profil Calon Kades
                </Link>
              </li>
              <li>
                <Link href="/tahapan" className="hover:text-blue-300 transition-colors block py-0.5">
                  Jadwal & Agenda P2KD
                </Link>
              </li>
              <li>
                <Link href="/pengumuman" className="hover:text-blue-300 transition-colors block py-0.5">
                  Pengumuman & Berita Acara
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-blue-300 transition-colors block py-0.5">
                  Tanya Jawab Hak Pilih (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Data Pemilih */}
          <div className="space-y-3">
            <h5 className="font-black text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1.5 border-b border-slate-800">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Data & Layanan TPS
            </h5>
            <ul className="space-y-2.5 text-slate-200 font-medium pt-1">
              <li>
                <Link href="/cek-pemilih" className="text-blue-300 font-bold hover:text-white transition-colors flex items-center gap-1.5 py-0.5">
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cek Hak Pilih Mandiri</span>
                </Link>
              </li>
              <li>
                <Link href="/dps" className="hover:text-blue-300 transition-colors block py-0.5">
                  Rekapitulasi DPS per TPS
                </Link>
              </li>
              <li>
                <Link href="/dpt" className="hover:text-blue-300 transition-colors block py-0.5">
                  Penetapan DPT Final
                </Link>
              </li>
              <li>
                <Link href="/tps" className="hover:text-blue-300 transition-colors block py-0.5">
                  Daftar Lokasi TPS di RW
                </Link>
              </li>
              <li>
                <Link href="/aduan" className="text-emerald-300 font-bold hover:text-white transition-colors block py-0.5">
                  Formulir Aduan & Koreksi
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Regulasi & Akses Petugas */}
          <div className="space-y-3">
            <h5 className="font-black text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1.5 border-b border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Regulasi & Petugas
            </h5>
            <ul className="space-y-2.5 text-slate-200 font-medium pt-1">
              <li>
                <Link href="/ketentuan" className="hover:text-blue-300 transition-colors flex items-center gap-1.5 py-0.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ketentuan Syarat Pemilih</span>
                </Link>
              </li>
              <li>
                <Link href="/privasi" className="hover:text-blue-300 transition-colors flex items-center gap-1.5 py-0.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kebijakan Privasi Data</span>
                </Link>
              </li>
              <li className="pt-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-1.5 w-full px-3.5 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-700 text-white font-bold border border-blue-600 transition-all text-[11px] shadow-md hover:shadow-lg"
                >
                  <span>Portal Login Panitia P2KD</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div>
            © 2026 Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak • Kec. Margasari, Kab. Tegal.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <Link href="/ketentuan" className="hover:text-white transition-colors font-medium">
              Ketentuan
            </Link>
            <span className="text-slate-600">•</span>
            <Link href="/privasi" className="hover:text-white transition-colors font-medium">
              Kebijakan Privasi
            </Link>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Enkripsi Database Aktif
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
