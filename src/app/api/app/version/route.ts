import { NextResponse } from "next/server";
import {
  APP_BUILD_INFO,
  detectClientAppVersion,
  evaluateAppVersionStatus,
} from "@/lib/app-version";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const paramVersion = url.searchParams.get("v") || url.searchParams.get("version");
    const headerVersion = req.headers.get("x-app-version");
    const userAgent = req.headers.get("user-agent") || "";

    const detected = detectClientAppVersion(userAgent, headerVersion || paramVersion);
    const versionStatus = evaluateAppVersionStatus(detected.version);

    return NextResponse.json(
      {
        success: true,
        buildIdentity: APP_BUILD_INFO,
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
