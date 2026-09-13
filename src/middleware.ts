import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    const adminToken = req.cookies.get("admin_token")?.value;

    if (!adminToken) {
      const loginUrl = new URL("/admin", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
