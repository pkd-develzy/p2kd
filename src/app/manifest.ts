import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "P2KD Desa Kalisalak - Portal Petugas & Sekretariat",
    short_name: "P2KD Petugas",
    description: "Aplikasi Operasional P2KD Desa Kalisalak, Coklit Lapangan & DPT Pilkades 2027",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#1e3a8a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
