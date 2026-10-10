import { NextResponse } from "next/server";
import {
  getRealtimeAppBuildInfo,
  detectClientAppVersion,
  evaluateAppVersionStatus,
} from "@/lib/app-version";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const paramVersion = url.searchParams.get("v") || url.searchParams.get("version");
    const headerVersion = req.headers.get("x-app-version");
    const userAgent = req.headers.get("user-agent") || "";

    // Ambil identitas rilis REALTIME dari GitHub Releases
    const buildInfo = await getRealtimeAppBuildInfo();

    const detected = detectClientAppVersion(userAgent, headerVersion || paramVersion);
    const versionStatus = evaluateAppVersionStatus(detected.version, buildInfo);

    return NextResponse.json(
      {
        success: true,
        buildIdentity: buildInfo,
        client: {
          detectedVersion: detected.version,
          isNativeApk: detected.isNativeApk,
        },
        updateStatus: versionStatus,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memeriksa versi aplikasi." },
      { status: 500 }
    );
  }
}
