import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow login page, Next.js internals, static assets, and API routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/photos") ||
    pathname.startsWith("/backgrounds") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for a valid-looking member cookie
  const raw = request.cookies.get("family-member-id")?.value;
  const memberId = raw ? parseInt(raw, 10) : NaN;
  if (isNaN(memberId) || memberId <= 0) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
