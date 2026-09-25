"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const digestId = error?.digest || "ERR-P2KD-500";

  const handleCopyDigest = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `[P2KD Kalisalak Error Log]\nDigest: ${digestId}\nPesan: ${error?.message || "Internal Server Error"}\nWaktu: ${new Date().toISOString()}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>Kendala Sistem | P2KD Desa Kalisalak</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                background: #090d16;
                color: #f1f5f9;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px 16px;
                position: relative;
                overflow-x: hidden;
              }
              .ambient-glow-1 {
                position: absolute;
                top: 10%;
                left: 20%;
                width: 320px;
                height: 320px;
                background: radial-gradient(circle, rgba(225, 29, 72, 0.15) 0%, transparent 70%);
                filter: blur(60px);
                pointer-events: none;
              }
              .ambient-glow-2 {
                position: absolute;
                bottom: 15%;
                right: 20%;
                width: 360px;
                height: 360px;
                background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
                filter: blur(70px);
                pointer-events: none;
              }
              .card {
                position: relative;
                z-index: 10;
                width: 100%;
                max-width: 520px;
                background: rgba(15, 23, 42, 0.85);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 36px 28px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                text-align: center;
              }
              .badge-gov {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 14px;
                border-radius: 9999px;
                background: rgba(225, 29, 72, 0.12);
                border: 1px solid rgba(225, 29, 72, 0.25);
                color: #fb7185;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 20px;
              }
              .badge-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #e11d48;
                box-shadow: 0 0 8px #e11d48;
                animation: pulse 2s infinite;
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.9); }
              }
              .icon-wrapper {
                width: 76px;
                height: 76px;
                border-radius: 20px;
                background: linear-gradient(135deg, rgba(225, 29, 72, 0.15), rgba(30, 64, 175, 0.15));
                border: 1px solid rgba(244, 63, 94, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px auto;
                box-shadow: 0 8px 24px -4px rgba(225, 29, 72, 0.25);
              }
              .title {
                font-size: 22px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -0.02em;
                line-height: 1.3;
                margin-bottom: 10px;
              }
              .desc {
                font-size: 14px;
                color: #94a3b8;
                line-height: 1.6;
                margin-bottom: 28px;
              }
              .btn-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 10px;
                margin-bottom: 20px;
              }
              @media (min-width: 480px) {
                .btn-grid {
                  grid-template-columns: 1fr 1fr;
                }
              }
              .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 13px 20px;
                border-radius: 14px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                border: none;
                font-family: inherit;
              }
              .btn-primary {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: #ffffff;
                box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
              }
              .btn-primary:hover {
                background: linear-gradient(135deg, #1d4ed8, #1e40af);
                transform: translateY(-1px);
                box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
              }
              .btn-secondary {
                background: rgba(255, 255, 255, 0.06);
                color: #cbd5e1;
                border: 1px solid rgba(255, 255, 255, 0.12);
              }
              .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.12);
                color: #ffffff;
                transform: translateY(-1px);
              }
              .btn-outline {
                background: transparent;
                color: #94a3b8;
                font-size: 12px;
                padding: 8px 12px;
                border: 1px dashed rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: 10px;
              }
              .btn-outline:hover {
                color: #f1f5f9;
                border-color: rgba(255, 255, 255, 0.3);
              }
              .details-box {
                margin-top: 16px;
                padding: 14px;
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                font-family: monospace;
                font-size: 11px;
                color: #cbd5e1;
                text-align: left;
                word-break: break-all;
              }
              .footer-text {
                margin-top: 24px;
                padding-top: 18px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                font-size: 11px;
                color: #64748b;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="ambient-glow-1" />
        <div className="ambient-glow-2" />

        <div className="card">
          {/* Government Badge */}
          <div className="badge-gov">
            <span className="badge-dot" />
            <span>Pilkades Kalisalak • Gangguan Sistem 500+</span>
          </div>

          {/* Central Animated Alert Icon */}
          <div className="icon-wrapper">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fb7185"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Title & Description */}
          <h1 className="title">Layanan Sedang Mengalami Kendala</h1>
          <p className="desc">
            Sistem mendeteksi adanya kendala sementara saat memproses halaman ini. Data pemilih, berkas formulir, dan
            administrasi Anda tetap aman terlindungi di basis data terisolasi.
          </p>

          {/* Primary Action Buttons */}
          <div className="btn-grid">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (typeof reset === "function") {
                  try {
                    reset();
                  } catch {
                    window.location.reload();
                  }
                } else {
                  window.location.reload();
                }
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              <span>Muat Ulang Halaman</span>
            </button>

            <Link
              href="/"
              className="btn btn-secondary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          {/* Diagnostic Info Toggle */}
          <div>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowDetail(!showDetail)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              <span>{showDetail ? "Sembunyikan Informasi Teknis" : "Lihat Detail Diagnostik"}</span>
            </button>

            {showDetail && (
              <div className="details-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8", fontWeight: 700 }}>Kode Digest Tiket:</span>
                  <button
                    type="button"
                    onClick={handleCopyDigest}
                    style={{
                      background: copied ? "#059669" : "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {copied ? "Tersalin!" : "Salin Log"}
                  </button>
                </div>
                <div style={{ color: "#38bdf8", marginBottom: "4px" }}>{digestId}</div>
                {error?.message && (
                  <div style={{ color: "#f87171", fontSize: "10px", marginTop: "4px" }}>
                    {error.message.length > 180 ? `${error.message.substring(0, 180)}...` : error.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Branding */}
          <div className="footer-text">
            <span>Panitia Pemilihan Kepala Desa Kalisalak • Kec. Margasari</span>
          </div>
        </div>
      </body>
    </html>
  );
}
