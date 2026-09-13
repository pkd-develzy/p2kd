"use client";

import React, { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge, Logo, BadgeVariant } from "@/components/ui";
import { CheckCircle2, Clock, Calendar, Lock, FileText, Vote, Award, ShieldCheck, Scale, Sparkles } from "lucide-react";

const emptySubscribe = () => () => {};

interface SubKegiatan {
  nomor: string;
  nama: string;
  jadwal: string;
  startDate: string;
  endDate: string;
}

interface RawTahapanDef {
  step: string;
  kategori: string;
  nama: string;
  rentangTanggal: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  icon: React.ReactNode;
  ringkasan: string;
  subKegiatan: SubKegiatan[];
}

const rawTahapanList: RawTahapanDef[] = [
  {
    step: "01",
    kategori: "TAHAP PERSIAPAN",
    nama: "Persiapan, Sosialisasi & Pembentukan Panitia",
    rentangTanggal: "Agustus – November 2026",
    startDate: "2026-08-01",
    endDate: "2026-11-30",
    icon: <Scale className="w-5 h-5 text-blue-700" />,
    ringkasan: "Sosialisasi tingkat Kabupaten, Kecamatan, Desa, pembentukan Panitia Pilkades oleh BPD, dan persetujuan pembiayaan Pilkades.",
    subKegiatan: [
      { nomor: "1", nama: "Sosialisasi tingkat Kabupaten, Kecamatan, Desa, Babinsa/Bhabinkamtibmas, dan Tokoh Masyarakat", jadwal: "Agustus – September 2026", startDate: "2026-08-01", endDate: "2026-09-30" },
      { nomor: "2", nama: "Pemberitahuan BPD tentang akhir masa jabatan Kepala Desa", jadwal: "7 Agustus 2026 / 8 Oktober 2026", startDate: "2026-08-07", endDate: "2026-08-07" },
      { nomor: "3", nama: "Pembentukan Panitia Pilkades oleh BPD Desa Kalisalak", jadwal: "Paling lambat 24 Agustus 2026", startDate: "2026-08-01", endDate: "2026-08-24" },
      { nomor: "4", nama: "Laporan BPD kepada Bupati melalui Camat Margasari perihal terbentuknya Panitia Pilkades", jadwal: "Paling lambat 4 September 2026", startDate: "2026-08-25", endDate: "2026-09-04" },
      { nomor: "5", nama: "Penetapan Pembantu Panitia Pilkades atas persetujuan BPD", jadwal: "1 – 2 Desember 2026", startDate: "2026-12-01", endDate: "2026-12-02" },
      { nomor: "6", nama: "Persetujuan biaya Pilkades oleh Bupati Tegal", jadwal: "Paling lambat 17 November 2026", startDate: "2026-10-06", endDate: "2026-11-17" },
    ],
  },
  {
    step: "02",
    kategori: "TAHAP PENCALONAN",
    nama: "Pendaftaran & Penerimaan Berkas Bakal Calon Kades",
    rentangTanggal: "6 – 20 November 2026",
    startDate: "2026-11-06",
    endDate: "2026-11-20",
    icon: <FileText className="w-5 h-5 text-indigo-700" />,
    ringkasan: "Pengumuman resmi pendaftaran bakal calon Kepala Desa dan penerimaan berkas persyaratan administrasi.",
    subKegiatan: [
      { nomor: "1", nama: "Pengumuman pendaftaran Pilkades kepada masyarakat melalui spanduk, banner, dan media resmi", jadwal: "6 – 20 November 2026", startDate: "2026-11-06", endDate: "2026-11-20" },
      { nomor: "2", nama: "Pendaftaran dan penerimaan berkas persyaratan bakal calon Kepala Desa", jadwal: "12 – 20 November 2026", startDate: "2026-11-12", endDate: "2026-11-20" },
      { nomor: "3", nama: "Perpanjangan masa pendaftaran pertama (15 hari) bila hanya ada 1 pendaftar", jadwal: "23 November – 13 Desember 2026", startDate: "2026-11-23", endDate: "2026-12-13" },
      { nomor: "4", nama: "Perpanjangan masa pendaftaran kedua (10 hari) bila tetap hanya ada 1 pendaftar", jadwal: "14 – 28 Desember 2026", startDate: "2026-12-14", endDate: "2026-12-28" },
    ],
  },
  {
    step: "03",
    kategori: "TAHAP PENDATAAN PEMILIH",
    nama: "Pendataan Penduduk & Penetapan DPS",
    rentangTanggal: "3 – 16 Desember 2026",
    startDate: "2026-12-03",
    endDate: "2026-12-16",
    icon: <ShieldCheck className="w-5 h-5 text-teal-700" />,
    ringkasan: "Pencocokan dan penelitian (Coklit) pemilih secara door-to-door, penetapan DPS, dan pengumuman terbuka kepada warga.",
    subKegiatan: [
      { nomor: "1", nama: "Pendataan penduduk desa yang memenuhi syarat dan berhak memilih", jadwal: "3 – 11 Desember 2026", startDate: "2026-12-03", endDate: "2026-12-11" },
      { nomor: "2", nama: "Penetapan Daftar Pemilih Sementara (DPS)", jadwal: "11 Desember 2026", startDate: "2026-12-11", endDate: "2026-12-11" },
      { nomor: "3", nama: "Pengumuman DPS kepada masyarakat di Balai Desa dan posko Tabung Pemilihan", jadwal: "14 – 16 Desember 2026", startDate: "2026-12-14", endDate: "2026-12-16" },
    ],
  },
  {
    step: "04",
    kategori: "TAHAP PEMUTAKHIRAN PEMILIH",
    nama: "Validasi Masukan Warga & Daftar Pemilih Tambahan (DPTambahan)",
    rentangTanggal: "14 – 24 Desember 2026",
    startDate: "2026-12-14",
    endDate: "2026-12-24",
    icon: <Clock className="w-5 h-5 text-amber-700" />,
    ringkasan: "Validasi perbaikan data pemilih, pendaftaran pemilih baru, dan penyusunan Daftar Pemilih Tambahan.",
    subKegiatan: [
      { nomor: "1", nama: "Validasi serta pemutakhiran data pemilih dan perbaikan DPS yang dituangkan dalam DPTambahan", jadwal: "14 – 16 Desember 2026", startDate: "2026-12-14", endDate: "2026-12-16" },
      { nomor: "2", nama: "Penyusunan Daftar Pemilih Tambahan (DPTambahan)", jadwal: "21 Desember 2026", startDate: "2026-12-21", endDate: "2026-12-21" },
      { nomor: "3", nama: "Pengumuman DPTambahan kepada masyarakat", jadwal: "22 – 24 Desember 2026", startDate: "2026-12-22", endDate: "2026-12-24" },
    ],
  },
  {
    step: "05",
    kategori: "TAHAP PENETAPAN PEMILIH",
    nama: "Penetapan & Pengumuman Daftar Pemilih Tetap (DPT)",
    rentangTanggal: "28 – 31 Desember 2026",
    startDate: "2026-12-28",
    endDate: "2026-12-31",
    icon: <Lock className="w-5 h-5 text-rose-700" />,
    ringkasan: "Rapat pleno penetapan DPT resmi, penyegelan digital database, dan pengumuman daftar pemilih tetap ke publik.",
    subKegiatan: [
      { nomor: "1", nama: "Penetapan Daftar Pemilih Tetap (DPT) oleh Panitia Pilkades bersama BPD", jadwal: "28 Desember 2026", startDate: "2026-12-28", endDate: "2026-12-28" },
      { nomor: "2", nama: "Pengumuman DPT kepada seluruh masyarakat Desa Kalisalak", jadwal: "29 – 31 Desember 2026", startDate: "2026-12-29", endDate: "2026-12-31" },
    ],
  },
  {
    step: "06",
    kategori: "TAHAP PENYARINGAN CALON",
    nama: "Verifikasi Berkas & Penetapan Calon Kades Berhak Pilih",
    rentangTanggal: "29 Desember 2026 – 25 Januari 2027",
    startDate: "2026-12-29",
    endDate: "2027-01-25",
    icon: <ShieldCheck className="w-5 h-5 text-slate-700" />,
    ringkasan: "Pemeriksaan keabsahan berkas calon, seleksi tambahan bila pendaftar lebih dari 5 orang, dan penetapan calon resmi.",
    subKegiatan: [
      { nomor: "1", nama: "Verifikasi dan validasi berkas persyaratan bakal calon Kepala Desa", jadwal: "29 Desember 2026 – 19 Januari 2027", startDate: "2026-12-29", endDate: "2027-01-19" },
      { nomor: "2", nama: "Seleksi tambahan (apabila bakal calon yang memenuhi syarat lebih dari 5 orang)", jadwal: "18 Januari 2027", startDate: "2027-01-18", endDate: "2027-01-18" },
      { nomor: "3", nama: "Musyawarah Panitia dan BPD bila hanya terdapat 1 orang bakal calon", jadwal: "18 Januari 2027", startDate: "2027-01-18", endDate: "2027-01-18" },
      { nomor: "4", nama: "Penetapan bakal calon menjadi Calon Kepala Desa yang berhak mengikuti Pilkades", jadwal: "20 Januari 2027", startDate: "2027-01-20", endDate: "2027-01-20" },
      { nomor: "5", nama: "Pengumuman kepada masyarakat mengenai Calon Kades resmi", jadwal: "21 – 25 Januari 2027", startDate: "2027-01-21", endDate: "2027-01-25" },
      { nomor: "6", nama: "Penyampaian surat undangan memilih kepada pemilih oleh Panitia", jadwal: "25 Januari 2027", startDate: "2027-01-25", endDate: "2027-01-25" },
    ],
  },
  {
    step: "07",
    kategori: "TAHAP KAMPANYE",
    nama: "Undian Nomor Urut, Kampanye & Masa Tenang",
    rentangTanggal: "25 Januari – 2 Februari 2027",
    startDate: "2027-01-25",
    endDate: "2027-02-02",
    icon: <Award className="w-5 h-5 text-amber-600" />,
    ringkasan: "Rapat pleno pengundian nomor urut calon, penyampaian visi misi kampanye damai, dan masa tenang sebelum pemungutan suara.",
    subKegiatan: [
      { nomor: "1", nama: "Rapat Pleno Terbuka Undian Nomor Urut Calon Kepala Desa", jadwal: "25 Januari 2027", startDate: "2027-01-25", endDate: "2027-01-25" },
      { nomor: "2", nama: "Pelaksanaan Kampanye Dialogis & Penyampaian Visi-Misi Calon", jadwal: "26 – 28 Januari 2027", startDate: "2027-01-26", endDate: "2027-01-28" },
      { nomor: "3", nama: "Masa Tenang dan pembersihan seluruh alat peraga kampanye", jadwal: "29 Januari – 2 Februari 2027", startDate: "2027-01-29", endDate: "2027-02-02" },
    ],
  },
  {
    step: "08",
    kategori: "HARI PEMUNGUTAN SUARA",
    nama: "Pemungutan, Penghitungan Suara & Penetapan Pemenang",
    rentangTanggal: "Rabu, 3 Februari 2027",
    startDate: "2027-02-03",
    endDate: "2027-02-03",
    icon: <Vote className="w-5 h-5 text-indigo-700" />,
    ringkasan: "Pencoblosan surat suara di seluruh Tabung Pemilihan Desa Kalisalak, penghitungan suara, dan penetapan Calon Kades Terpilih.",
    subKegiatan: [
      { nomor: "1", nama: "Pemungutan suara serentak di seluruh Tabung Pemilihan Desa Kalisalak", jadwal: "Rabu, 3 Februari 2027 (07.00 - 13.00 WIB)", startDate: "2027-02-03", endDate: "2027-02-03" },
      { nomor: "2", nama: "Penghitungan dan rekapitulasi perolehan suara di tiap Tabung Pemilihan dan Pleno Desa", jadwal: "Rabu, 3 Februari 2027 (Mulai 13.30 WIB)", startDate: "2027-02-03", endDate: "2027-02-03" },
      { nomor: "3", nama: "Penetapan Calon Kepala Desa Terpilih dengan Surat Keputusan Panitia", jadwal: "Rabu, 3 Februari 2027", startDate: "2027-02-03", endDate: "2027-02-03" },
    ],
  },
  {
    step: "09",
    kategori: "TAHAP AKHIR & PELANTIKAN",
    nama: "Pelaporan, Pengesahan SK & Pelantikan Serentak",
    rentangTanggal: "Februari – April 2027",
    startDate: "2027-02-04",
    endDate: "2027-04-30",
    icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
    ringkasan: "Laporan hasil pemilihan ke BPD dan Camat, penerbitan Keputusan Bupati Tegal, serta pelantikan serentak Kepala Desa.",
    subKegiatan: [
      { nomor: "1", nama: "Laporan Panitia Pilkades kepada BPD perihal Hasil Pilkades dan Penetapan Calon Terpilih", jadwal: "Paling lambat 12 Februari 2027", startDate: "2027-02-04", endDate: "2027-02-12" },
      { nomor: "2", nama: "Laporan BPD kepada Bupati melalui Camat untuk disahkan", jadwal: "Paling lambat 22 Februari 2027", startDate: "2027-02-12", endDate: "2027-02-22" },
      { nomor: "3", nama: "Pengajuan perselisihan Pilkades kepada Bupati (bila ada)", jadwal: "Paling lambat 12 Februari 2027", startDate: "2027-02-04", endDate: "2027-02-12" },
      { nomor: "4", nama: "Keputusan perselisihan oleh Bupati Tegal", jadwal: "Paling lambat 2 April 2027", startDate: "2027-02-12", endDate: "2027-04-02" },
      { nomor: "5", nama: "Keputusan Bupati tentang Pengesahan & Pengangkatan Calon Kades Terpilih", jadwal: "Paling lambat 30 hari sejak laporan BPD", startDate: "2027-02-22", endDate: "2027-03-24" },
      { nomor: "6", nama: "Pelantikan Calon Kepala Desa Terpilih secara serentak oleh Bupati Tegal", jadwal: "Paling lambat 30 hari sejak SK Bupati", startDate: "2027-03-24", endDate: "2027-04-30" },
    ],
  },
];

export const TahapanTimeline: React.FC = () => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const getStatus = (startStr: string, endStr: string): { label: string; badge: BadgeVariant; isCurrent: boolean; isPast: boolean } => {
    if (!isMounted) {
      return { label: "MEMUAT...", badge: "outline", isCurrent: false, isPast: false };
    }

    const now = new Date();
    const start = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T23:59:59`);

    if (now > end) {
      return { label: "SELESAI", badge: "success", isCurrent: false, isPast: true };
    } else if (now >= start && now <= end) {
      return { label: "SEDANG BERJALAN", badge: "primary", isCurrent: true, isPast: false };
    } else {
      return { label: "BELUM DIMULAI", badge: "outline", isCurrent: false, isPast: false };
    }
  };

  const formattedDate = isMounted
    ? new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="mb-2">
          <Calendar className="w-3.5 h-3.5 mr-1.5 inline text-blue-700" />
          Keputusan Bupati Tegal Nomor 100.3.3.2/713 Tahun 2026
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Tahapan Resmi Pilkades Serentak Desa Kalisalak
        </h1>
        <p className="text-sm text-slate-600 mt-2 font-medium">
          Gelombang I Kabupaten Tegal Tahun 2027 • Kecamatan Margasari • Status Terhitung Otomatis Real-Time Sesuai Kalender Resmi
        </p>

        {formattedDate && (
          <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold text-blue-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Tanggal Sistem Hari Ini: {formattedDate}</span>
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="space-y-5">
        {rawTahapanList.map((t, i) => {
          const statusInfo = getStatus(t.startDate, t.endDate);

          return (
            <motion.div
              key={t.step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Card
                className={`p-6 bg-white border-2 rounded-3xl transition-all ${
                  statusInfo.isCurrent
                    ? "border-blue-500 shadow-lg shadow-blue-100/60 ring-2 ring-blue-500/20"
                    : statusInfo.isPast
                    ? "border-emerald-200/90 shadow-xs"
                    : "border-slate-200/90 hover:border-slate-300 shadow-xs opacity-90"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl border flex items-center justify-center ${
                        statusInfo.isCurrent
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : statusInfo.isPast
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {statusInfo.isPast ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : statusInfo.isCurrent ? (
                        <Clock className="w-5 h-5 text-white animate-pulse" />
                      ) : (
                        t.icon
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                            statusInfo.isCurrent
                              ? "bg-blue-600 text-white"
                              : statusInfo.isPast
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          TAHAP {t.step}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {t.kategori}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                        {t.nama}
                      </h3>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant={statusInfo.badge}
                      className={`font-black text-[11px] px-3 py-1 ${
                        statusInfo.isCurrent ? "animate-pulse shadow-sm" : ""
                      }`}
                    >
                      {statusInfo.label}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <strong>{t.rentangTanggal}</strong>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {t.ringkasan}
                </p>

                {/* Sub kegiatan list */}
                <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Rincian Sub-Kegiatan & Ketetapan Waktu:
                  </span>
                  <div className="space-y-1.5">
                    {t.subKegiatan.map((sub, idx) => {
                      const subStatus = getStatus(sub.startDate, sub.endDate);

                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 py-1.5 border-b border-slate-200/50 last:border-0"
                        >
                          <div className="flex items-start gap-2 text-slate-700">
                            <span
                              className={`w-4 h-4 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
                                subStatus.isPast
                                  ? "bg-emerald-100 text-emerald-800"
                                  : subStatus.isCurrent
                                  ? "bg-blue-600 text-white font-black"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {sub.nomor}
                            </span>
                            <span className={subStatus.isCurrent ? "font-bold text-slate-900" : ""}>
                              {sub.nama}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:text-right shrink-0 pl-6 sm:pl-2">
                            <span className="text-[11px] font-semibold text-blue-900">
                              {sub.jadwal}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                subStatus.isPast
                                  ? "bg-emerald-50 text-emerald-700"
                                  : subStatus.isCurrent
                                  ? "bg-blue-100 text-blue-800"
                                  : "text-slate-400"
                              }`}
                            >
                              {subStatus.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
