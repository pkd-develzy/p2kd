"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  ShieldCheck,
  ChevronDown,
  Info,
  Calendar,
  FileCheck,
  Database,
  MapPin,
  Megaphone,
  MessageSquarePlus,
  HelpCircle,
  FileText,
  Shield,
  Award,
  Newspaper,
  UserCheck,
} from "lucide-react";
import { Button, Logo } from "@/components/ui";

interface DropdownItem {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

interface MenuCategory {
  title: string;
  items: DropdownItem[];
}

const menuCategories: Record<string, MenuCategory> = {
  informasi: {
    title: "Informasi & Tahapan",
    items: [
      {
        href: "/berita",
        label: "Berita & Kabar Desa",
        desc: "Liputan kegiatan, sosialisasi, & rilis pers",
        icon: <Newspaper className="w-4 h-4 text-blue-700" />,
      },
      {
        href: "/informasi",
        label: "Tentang P2KD Kalisalak",
        desc: "Struktur organisasi, panitia, & visi misi",
        icon: <Info className="w-4 h-4 text-blue-700" />,
      },
      {
        href: "/tahapan",
        label: "Jadwal & Tahapan Pilkades",
        desc: "Timeline tahapan dari persiapan hingga hari-H",
        icon: <Calendar className="w-4 h-4 text-blue-700" />,
      },
      {
        href: "/pengumuman",
        label: "Dokumen & Pengumuman",
        desc: "Unduh SK, berita acara, dan dokumen resmi",
        icon: <Megaphone className="w-4 h-4 text-amber-700" />,
      },
      {
        href: "/bimtekmateri",
        label: "Materi Bimtek & Panduan",
        desc: "Modul pelatihan saksi, KPPS, dan bimtek",
        icon: <Award className="w-4 h-4 text-indigo-700" />,
      },
      {
        href: "/faq",
        label: "Tanya Jawab (FAQ)",
        desc: "Jawaban pertanyaan seputar Pilkades",
        icon: <HelpCircle className="w-4 h-4 text-purple-700" />,
      },
    ],
  },
  dataPemilih: {
    title: "Data Pemilih & Wilayah",
    items: [
      {
        href: "/cek-pemilih",
        label: "Cek Hak Pilih (NIK)",
        desc: "Pencarian NIK cepat, akurat, dan terlindungi",
        icon: <Search className="w-4 h-4 text-blue-700" />,
      },
      {
        href: "/dps",
        label: "Daftar Pemilih Sementara (DPS)",
        desc: "Data pemilih hasil pemutakhiran awal",
        icon: <Database className="w-4 h-4 text-teal-700" />,
      },
      {
        href: "/dpt",
        label: "Daftar Pemilih Tetap (DPT)",
        desc: "Status pleno & penguncian data final",
        icon: <FileCheck className="w-4 h-4 text-purple-700" />,
      },
      {
        href: "/tps",
        label: "Lokasi Lapangan & Tabung Suara",
        desc: "Pusat pemungutan di Lapangan Desa & nomor tabung",
        icon: <MapPin className="w-4 h-4 text-rose-700" />,
      },
    ],
  },
  layanan: {
    title: "Layanan & Regulasi",
    items: [
      {
        href: "/daftarpantarlih",
        label: "Pendaftaran Petugas DPT",
        desc: "Rekrutmen & Uji Integritas Pantarlih/Coklit",
        icon: <UserCheck className="w-4 h-4 text-blue-700" />,
      },
      {
        href: "/aduan",
        label: "Form Aduan & Perbaikan",
        desc: "Koreksi data, pendaftaran baru, & TMS",
        icon: <MessageSquarePlus className="w-4 h-4 text-emerald-700" />,
      },
      {
        href: "/ketentuan",
        label: "Ketentuan Pilkades",
        desc: "Syarat pemilih dan regulasi hukum",
        icon: <FileText className="w-4 h-4 text-slate-700" />,
      },
      {
        href: "/privasi",
        label: "Kebijakan Privasi (UU PDP)",
        desc: "Perlindungan data dan keamanan server terpadu",
        icon: <Shield className="w-4 h-4 text-blue-700" />,
      },
    ],
  },
};

const DEFAULT_RUNNING_TEXT =
  "Pemberitahuan Resmi P2KD: Seluruh rangkaian pemungutan dan penghitungan suara Pilkades Desa Kalisalak diselenggarakan pada hari Rabu, 3 Februari 2027. Mohon membawa KTP-el dan Undangan Memilih.";

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [runningText, setRunningText] = useState<string>(DEFAULT_RUNNING_TEXT);
  const [isRunningActive, setIsRunningActive] = useState(true);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config");
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.runningText) setRunningText(json.data.runningText);
          setIsRunningActive(Boolean(json.data.isRunningTextActive));
        }
      } catch {
        // quiet fallback
      }
    };
    fetchConfig();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full shadow-xs" ref={dropdownRef}>
      {/* 1. Official Government Top Header */}
      <div className="w-full bg-slate-900 text-slate-300 text-[11px] py-2 px-4 border-b border-slate-800 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold tracking-wide">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-white">REPUBLIK INDONESIA</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-300 font-normal hidden sm:inline">
              Pemerintah Desa Kalisalak, Kec. Margasari, Kab. Tegal
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              <ShieldCheck className="w-3 h-3" />
              Portal Resmi P2KD
            </span>
            <span className="text-slate-700">|</span>
            <span>Pilkades Serentak Gelombang I 2027</span>
          </div>
        </div>
      </div>

      {/* 1.5. Dynamic Running Announcement Banner (Seamless Continuous Marquee) */}
      {isRunningActive && runningText && (
        <div className="w-full bg-linear-to-r from-blue-950 via-indigo-950 to-blue-950 text-blue-100 text-[11px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-4 border-b border-blue-800/80 shadow-inner overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
            <span className="bg-amber-400 text-slate-950 font-black px-2 sm:px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1 sm:gap-1.5 z-10 shadow-xs">
              <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-950" />
              <span className="hidden xs:inline sm:inline">PENGUMUMAN RESMI</span>
              <span className="xs:hidden sm:hidden">INFO</span>
            </span>
            <div className="flex-1 overflow-hidden relative mask-[linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)]">
              <div className="animate-marquee-seamless font-medium text-amber-200 text-[11px] sm:text-xs tracking-wide cursor-pointer hover:text-white">
                <span className="inline-flex items-center gap-2 pr-8 sm:pr-12 shrink-0">
                  📢 {runningText} • Silakan hubungi Panitia P2KD Desa Kalisalak untuk konfirmasi data atau bantuan layanan •
                </span>
                <span className="inline-flex items-center gap-2 pr-8 sm:pr-12 shrink-0">
                  📢 {runningText} • Silakan hubungi Panitia P2KD Desa Kalisalak untuk konfirmasi data atau bantuan layanan •
                </span>
                <span className="inline-flex items-center gap-2 pr-8 sm:pr-12 shrink-0">
                  📢 {runningText} • Silakan hubungi Panitia P2KD Desa Kalisalak untuk konfirmasi data atau bantuan layanan •
                </span>
                <span className="inline-flex items-center gap-2 pr-8 sm:pr-12 shrink-0">
                  📢 {runningText} • Silakan hubungi Panitia P2KD Desa Kalisalak untuk konfirmasi data atau bantuan layanan •
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Institutional Navbar */}
      <div className="w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <Logo size="sm" showText title="PANITIA PILKADES" subtitle="DESA KALISALAK" />
          </Link>

          {/* Desktop Navigation Groups with Professional Dropdowns */}
          <nav className="hidden lg:flex items-center gap-1 font-medium text-xs text-slate-700">
            {/* Direct Link: Beranda */}
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname === "/"
                  ? "bg-slate-100 text-blue-900 font-bold"
                  : "hover:bg-slate-50 hover:text-blue-700"
              }`}
            >
              Beranda
            </Link>

            {/* Dropdown: Informasi & Tahapan */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === "informasi" ? null : "informasi")
                }
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  activeDropdown === "informasi" ||
                  ["/informasi", "/tahapan", "/pengumuman", "/faq"].includes(pathname)
                    ? "bg-blue-50 text-blue-900 font-bold"
                    : "hover:bg-slate-50 hover:text-blue-700"
                }`}
              >
                <span>Informasi & Tahapan</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === "informasi" ? "rotate-180 text-blue-700" : "text-slate-400"
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === "informasi" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1.5 w-72 p-2 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 z-50 space-y-1"
                  >
                    {menuCategories.informasi.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dropdown: Data Pemilih */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === "data" ? null : "data")
                }
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  activeDropdown === "data" ||
                  ["/cek-pemilih", "/dps", "/dpt", "/tps"].includes(pathname)
                    ? "bg-blue-50 text-blue-900 font-bold"
                    : "hover:bg-slate-50 hover:text-blue-700"
                }`}
              >
                <span>Data Pemilih</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === "data" ? "rotate-180 text-blue-700" : "text-slate-400"
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === "data" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1.5 w-76 p-2 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 z-50 space-y-1"
                  >
                    {menuCategories.data.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dropdown: Layanan & Regulasi */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === "layanan" ? null : "layanan")
                }
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  activeDropdown === "layanan" ||
                  ["/aduan", "/ketentuan", "/privasi"].includes(pathname)
                    ? "bg-blue-50 text-blue-900 font-bold"
                    : "hover:bg-slate-50 hover:text-blue-700"
                }`}
              >
                <span>Layanan Warga</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === "layanan" ? "rotate-180 text-blue-700" : "text-slate-400"
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === "layanan" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1.5 w-72 p-2 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 z-50 space-y-1"
                  >
                    {menuCategories.layanan.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/cek-pemilih" className="hidden sm:inline-flex">
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold shadow-md shadow-blue-900/20 px-4"
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                <span>Cek Hak Pilih</span>
              </Button>
            </Link>

            {/* Mobile hamburger toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-6 space-y-6 shadow-2xl animate-in slide-in-from-top-3 duration-200 max-h-[85vh] overflow-y-auto">
          {/* Quick Search Button */}
          <Link href="/cek-pemilih">
            <Button variant="primary" size="lg" className="w-full justify-center font-bold mb-4">
              <Search className="w-4 h-4 mr-2" />
              Cek Hak Pilih NIK Online
            </Button>
          </Link>

          {/* Group 1 */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Informasi & Tahapan
            </div>
            <div className="grid grid-cols-1 gap-1">
              {menuCategories.informasi.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">{item.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Group 2 */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Data Pemilih
            </div>
            <div className="grid grid-cols-1 gap-1">
              {menuCategories.data.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">{item.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Group 3 */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Layanan & Regulasi
            </div>
            <div className="grid grid-cols-1 gap-1">
              {menuCategories.layanan.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">{item.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
