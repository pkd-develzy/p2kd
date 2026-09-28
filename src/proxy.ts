import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/encryption";
import { dataStore } from "@/lib/data-store";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminToken = req.cookies.get("admin_token")?.value;

  // 1. If accessing login page (/admin) while already having a valid admin_token, redirect to dashboard
  if (pathname === "/admin") {
    if (adminToken) {
      const payload = verifyAuthToken(adminToken);
      const minValid = dataStore.getSessionRevocationEpoch();
      if (payload && (!minValid || (payload.iat && payload.iat >= minValid))) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }
  }

  // 2. Protect admin dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    if (!adminToken) {
      const loginUrl = new URL("/admin", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const payload = verifyAuthToken(adminToken);
    const minValid = dataStore.getSessionRevocationEpoch();
    if (!payload || (minValid > 0 && payload.iat && payload.iat < minValid)) {
      const loginUrl = new URL("/admin", req.url);
      loginUrl.searchParams.set("from", pathname);
      loginUrl.searchParams.set("revoked", "1");
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("admin_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/dashboard/:path*"],
};
