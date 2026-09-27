import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Konversi timestamp atau format string waktu ke format resmi WIB (Waktu Indonesia Barat / Asia/Jakarta)
 */
export function formatWIB(rawDate: string | number | Date | undefined): string {
  if (!rawDate) return "-";

  const rawStr = String(rawDate).trim();
  if (rawStr.endsWith("WIB")) {
    return rawStr;
  }

  // Parse string id-ID UTC dari server: "27/9/2026, 23.15.13" atau "27/09/2026 23:15:13"
  const match = rawStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[,\s]+(\d{1,2})[.:](\d{1,2})[.:](\d{1,2})/);
  if (match) {
    const [, day, month, year, hour, minute, second] = match;
    const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
    if (!isNaN(utcDate.getTime())) {
      return utcDate.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).replace(/\./g, ":") + " WIB";
    }
  }

  // Parse ISO string atau epoch timestamp
  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    return d.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(/\./g, ":") + " WIB";
  }

  return rawStr + " WIB";
}
