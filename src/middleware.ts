import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminToken = req.cookies.get("admin_token")?.value;

  // 1. If accessing login page (/admin) while already having a valid admin_token, redirect to dashboard
  if (pathname === "/admin") {
    if (adminToken) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // 2. Protect admin dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    if (!adminToken) {
      const loginUrl = new URL("/admin", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/dashboard/:path*"],
};
