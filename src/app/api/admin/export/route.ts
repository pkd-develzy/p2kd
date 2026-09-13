import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { dataStore } from "@/lib/data-store";
import { verifyAdminSession } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  try {
    const session = verifyAdminSession(req);
    if (!session.authenticated || !session.user) {
      return session.response!;
    }

    await dataStore.ensureSynced();

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "DPT").toUpperCase(); // "DPT", "DPS", "TMS", "REKAP", "TPS", "ADUAN", "AUDIT", "FULL"
    let tpsFilter = searchParams.get("tps") || undefined;
    const statusFilter = searchParams.get("status") || undefined;
    const searchFilter = searchParams.get("search") || undefined;

    const user = session.user;
    const isOfficer = !user.isSuperAdmin && user.role !== "SUPER_ADMIN" && user.seksi !== "PIMPINAN";

    // Strict Data Isolation for field officers from token claims
    if (isOfficer) {
      const officerTps = user.assignedTps || (dataStore.getTpsList()[0]?.namaTps || "SEMUA");
      if (officerTps !== "SEMUA") {
        tpsFilter = officerTps;
      }

      // Disallow full village export or system audit log for field officers
      if (type === "FULL" || type === "AUDIT" || type === "TPS") {
        return NextResponse.json(
          {
            success: false,
            message: `Kerahasiaan Data Terlindungi: Petugas lapangan hanya berwenang mengekspor data pemilih untuk wilayah ${officerTps}.`,
          },
          { status: 403 }
        );
      }
    }

    const pemilih = dataStore.getPemilihList({
      tps: tpsFilter,
      status: statusFilter,
      search: searchFilter,
    });
    const tpsList = dataStore.getTpsList();
    const aduanList = dataStore.getAduanList();
    const auditLogs = dataStore.getAuditLogs();
    const stats = dataStore.getStats();
    const tahapan = dataStore.getTahapanState();

    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    let filename = `LAPORAN_PILKADES_KALISALAK_${timestamp}.xlsx`;

    // 1. DAFTAR DPT / DPS (Active Voters)
    if (type === "DPT" || type === "DPS" || type === "PEMILIH") {
      const activeVoters =
        type === "PEMILIH"
          ? pemilih
          : pemilih.filter((p) => p.statusAktif === "AKTIF");

      const dataRows = activeVoters.map((p, idx) => ({
        "No": idx + 1,
        "Nomor NIK": `'${p.nik}`, // prevent Excel auto scientific notation
        "Nomor KK": `'${p.kk || "-"}`,
        "Nama Lengkap": p.namaLengkap,
        "Jenis Kelamin": p.jenisKelamin === "L" ? "Laki-laki (L)" : "Perempuan (P)",
        "Tempat Lahir": p.tempatLahir,
        "Tanggal Lahir": p.tanggalLahir,
        "Status Perkawinan": p.statusPerkawinan === "S" ? "Kawin" : p.statusPerkawinan === "B" ? "Belum Kawin" : "Pernah Kawin",
        "Alamat": p.alamat,
        "RT": p.rt,
        "RW": p.rw,
        "Desa": p.desa,
        "Kecamatan": p.kecamatan,
        "Penetapan Tabung": p.tps.replace(/TPS/gi, "Tabung"),
        "Status Pemilih": p.statusAktif,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      worksheet["!cols"] = [
        { wch: 5 },  // No
        { wch: 20 }, // NIK
        { wch: 20 }, // KK
        { wch: 25 }, // Nama
        { wch: 16 }, // JK
        { wch: 15 }, // Tempat Lahir
        { wch: 14 }, // Tgl Lahir
        { wch: 18 }, // Status Kawin
        { wch: 30 }, // Alamat
        { wch: 6 },  // RT
        { wch: 6 },  // RW
        { wch: 14 }, // Desa
        { wch: 14 }, // Kecamatan
        { wch: 16 }, // Tabung
        { wch: 14 }, // Status
      ];

      const sheetName = type === "DPS" ? "Daftar DPS" : "Daftar DPT Final";
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      filename = `DAFTAR_${type}_FINAL_KALISALAK_${timestamp}.xlsx`;
    }

    // 2. DAFTAR TMS (Tidak Memenuhi Syarat)
    else if (type === "TMS") {
      const tmsList = pemilih.filter((p) => p.statusAktif === "TMS");
      const dataRows = tmsList.map((p, idx) => ({
        "No": idx + 1,
        "Nomor NIK": `'${p.nik}`,
        "Nomor KK": `'${p.kk || "-"}`,
        "Nama Lengkap": p.namaLengkap,
        "Jenis Kelamin": p.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
        "Alamat": p.alamat,
        "RT": p.rt,
        "RW": p.rw,
        "TPS Asal": p.tps,
        "Alasan TMS": p.alasanTms || "Meninggal Dunia",
        "Status Verifikasi": "TMS_TERVERIFIKASI",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 20 },
        { wch: 25 },
        { wch: 14 },
        { wch: 30 },
        { wch: 6 },
        { wch: 6 },
        { wch: 14 },
        { wch: 25 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Pemilih TMS");
      filename = `DAFTAR_PEMILIH_TMS_KALISALAK_${timestamp}.xlsx`;
    }

    // 3. REKAPITULASI TABUNG
    else if (type === "REKAP") {
      const dataRows = tpsList.map((t, idx) => {
        const votersInTps = pemilih.filter(
          (p) => p.statusAktif === "AKTIF" && (p.tps.toLowerCase().includes(t.nomorTps.toLowerCase()) || p.tps.toLowerCase().includes(t.namaTps.toLowerCase()))
        );
        const l = votersInTps.filter((p) => p.jenisKelamin === "L").length;
        const p = votersInTps.filter((p) => p.jenisKelamin === "P").length;
        const tmsCount = pemilih.filter(
          (v) => v.statusAktif === "TMS" && (v.tps.toLowerCase().includes(t.nomorTps.toLowerCase()) || v.tps.toLowerCase().includes(t.namaTps.toLowerCase()))
        ).length;

        return {
          "No": idx + 1,
          "Kode Tabung": t.kodeTps,
          "Nama Tabung": (t.namaTabung || t.namaTps).replace(/TPS/gi, "Tabung"),
          "Lokasi Pemungutan": t.lokasi,
          "Alamat": t.alamat,
          "Cakupan RT/RW": `RT ${t.rt} / RW ${t.rw}`,
          "Pemilih Laki-laki": l,
          "Pemilih Perempuan": p,
          "Total DPT Aktif": votersInTps.length,
          "Pemilih TMS": tmsCount,
          "Kuota Maksimal Tabung": t.kuotaMaksimal,
          "Sisa Kuota": Math.max(0, t.kuotaMaksimal - votersInTps.length),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 16 },
        { wch: 25 },
        { wch: 32 },
        { wch: 25 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 20 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekapitulasi Tabung");
      filename = `REKAPITULASI_TABUNG_KALISALAK_${timestamp}.xlsx`;
    }

    // 4. MASTER TABUNG
    else if (type === "TPS") {
      const dataRows = tpsList.map((t, idx) => ({
        "No": idx + 1,
        "Kode Tabung": t.kodeTps,
        "Nomor": t.nomorTps,
        "Nama Tabung": (t.namaTabung || t.namaTps).replace(/TPS/gi, "Tabung"),
        "Lokasi": t.lokasi,
        "Alamat": t.alamat,
        "Wilayah RT": t.rt,
        "Wilayah RW": t.rw,
        "Kuota Maksimal": t.kuotaMaksimal,
        "Status Tabung": t.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 16 },
        { wch: 10 },
        { wch: 25 },
        { wch: 32 },
        { wch: 25 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Master Data Tabung");
      filename = `MASTER_TABUNG_KALISALAK_${timestamp}.xlsx`;
    }

    // 5. ADUAN MASYARAKAT
    else if (type === "ADUAN") {
      const dataRows = aduanList.map((a, idx) => ({
        "No": idx + 1,
        "Nomor Tiket": a.nomorAduan,
        "Tanggal Masuk": a.tanggal,
        "Nama Pelapor": a.namaPelapor,
        "NIK Pelapor": `'${a.nik}`,
        "No. Kontak / WA": `'${a.kontakPelapor}`,
        "Domisili RT/RW": `RT ${a.rt} / RW ${a.rw}`,
        "Kategori Aduan": a.jenisAduan,
        "Isi Laporan / Aduan": a.isiAduan,
        "Status Verifikasi": a.status,
        "Catatan Petugas": a.catatanPetugas || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 18 },
        { wch: 14 },
        { wch: 24 },
        { wch: 20 },
        { wch: 18 },
        { wch: 16 },
        { wch: 20 },
        { wch: 45 },
        { wch: 18 },
        { wch: 35 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Aduan Warga");
      filename = `ADUAN_MASYARAKAT_KALISALAK_${timestamp}.xlsx`;
    }

    // 6. AUDIT TRAIL
    else if (type === "AUDIT") {
      const dataRows = auditLogs.map((log, idx) => ({
        "No": idx + 1,
        "Waktu Transaksi": log.waktu,
        "Username": log.user,
        "Peran / Role": log.role,
        "Jenis Aksi": log.aksi,
        "Entitas": log.entity,
        "Target Aksi": log.target,
        "Rincian Aktivitas": log.detail,
        "Alamat IP": log.ipAddress,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 18 },
        { wch: 16 },
        { wch: 20 },
        { wch: 14 },
        { wch: 30 },
        { wch: 50 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Trail Aktivitas");
      filename = `AUDIT_LOG_PILKADES_KALISALAK_${timestamp}.xlsx`;
    }

    // 7. FULL WORKBOOK (ALL-IN-ONE COMPREHENSIVE EXCEL FILE)
    else {
      // Sheet 1: Ringkasan Pleno
      const summaryRows = [
        { "Parameter": "Nama Kegiatan", "Keterangan": "Pemilihan Kepala Desa (Pilkades) Serentak 2026" },
        { "Parameter": "Desa / Kecamatan", "Keterangan": "Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal" },
        { "Parameter": "Nomor Berita Acara", "Keterangan": tahapan.nomorBeritaAcara || "BA/01/P2KD-KLS/VIII/2026" },
        { "Parameter": "Status DPT Final", "Keterangan": tahapan.isDptLocked ? "DIKUNCI / FINAL (SAH)" : "DRAFT / UJI PUBLIK" },
        { "Parameter": "Segel Digital SHA-256", "Keterangan": tahapan.lockHashSignature || "BELUM_DIKUNCI" },
        { "Parameter": "Total Pemilih Aktif (DPT)", "Keterangan": stats.totalAktif },
        { "Parameter": "Pemilih Laki-laki", "Keterangan": stats.totalLaki },
        { "Parameter": "Pemilih Perempuan", "Keterangan": stats.totalPerempuan },
        { "Parameter": "Total Pemilih TMS", "Keterangan": stats.totalTms },
        { "Parameter": "Jumlah Tabung Pemilihan", "Keterangan": tpsList.length },
        { "Parameter": "Waktu Ekspor Berkas", "Keterangan": new Date().toLocaleString("id-ID") },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 25 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan Pleno DPT");

      // Sheet 2: Rekapitulasi 13 Tabung
      const rekapRows = tpsList.map((t, idx) => {
        const votersInTps = pemilih.filter(
          (p) => p.statusAktif === "AKTIF" && (p.tps.toLowerCase().includes(t.nomorTps.toLowerCase()) || p.tps.toLowerCase().includes(t.namaTps.toLowerCase()))
        );
        const l = votersInTps.filter((p) => p.jenisKelamin === "L").length;
        const p = votersInTps.filter((p) => p.jenisKelamin === "P").length;
        return {
          "No": idx + 1,
          "Kode Tabung": t.kodeTps,
          "Nama Tabung": (t.namaTabung || t.namaTps).replace(/TPS/gi, "Tabung"),
          "Lokasi": t.lokasi,
          "Cakupan RT/RW": `RT ${t.rt} / RW ${t.rw}`,
          "Laki-laki": l,
          "Perempuan": p,
          "Total DPT": votersInTps.length,
          "Kuota Maksimal": t.kuotaMaksimal,
        };
      });
      const wsRekap = XLSX.utils.json_to_sheet(rekapRows);
      wsRekap["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsRekap, "Rekapitulasi 13 Tabung");

      // Sheet 3: DPT Final
      const dptRows = pemilih.filter((p) => p.statusAktif === "AKTIF").map((p, idx) => ({
        "No": idx + 1,
        "NIK": `'${p.nik}`,
        "No KK": `'${p.kk || "-"}`,
        "Nama Lengkap": p.namaLengkap,
        "JK": p.jenisKelamin,
        "Tempat Lahir": p.tempatLahir,
        "Tanggal Lahir": p.tanggalLahir,
        "Kawin": p.statusPerkawinan,
        "Alamat": p.alamat,
        "RT": p.rt,
        "RW": p.rw,
        "Tabung": p.tps.replace(/TPS/gi, "Tabung"),
      }));
      const wsDpt = XLSX.utils.json_to_sheet(dptRows);
      wsDpt["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 6 }, { wch: 15 }, { wch: 14 }, { wch: 8 }, { wch: 30 }, { wch: 6 }, { wch: 6 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(workbook, wsDpt, "Daftar DPT Final");

      // Sheet 4: TMS
      const tmsRows = pemilih.filter((p) => p.statusAktif === "TMS").map((p, idx) => ({
        "No": idx + 1,
        "NIK": `'${p.nik}`,
        "Nama": p.namaLengkap,
        "Tabung": p.tps.replace(/TPS/gi, "Tabung"),
        "Alasan TMS": p.alasanTms || "Meninggal",
      }));
      const wsTms = XLSX.utils.json_to_sheet(tmsRows);
      wsTms["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, wsTms, "Daftar TMS");

      // Sheet 5: Aduan
      const aduanRows = aduanList.map((a, idx) => ({
        "No": idx + 1,
        "Nomor Tiket": a.nomorAduan,
        "Nama Pelapor": a.namaPelapor,
        "Kategori": a.jenisAduan,
        "Isi Aduan": a.isiAduan,
        "Status": a.status,
      }));
      const wsAduan = XLSX.utils.json_to_sheet(aduanRows);
      wsAduan["!cols"] = [{ wch: 5 }, { wch: 18 }, { wch: 25 }, { wch: 20 }, { wch: 45 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsAduan, "Aduan Warga");

      filename = `BUKU_INDUK_PILKADES_KALISALAK_LENGKAP_${timestamp}.xlsx`;
    }

    // Generate Excel binary buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export Excel error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat berkas Excel (.xlsx)." },
      { status: 500 }
    );
  }
}
