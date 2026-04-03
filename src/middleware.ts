import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (pathname.startsWith("/login")) {
    if (token && (await verifySessionToken(token))) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!token || !(await verifySessionToken(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|csv|pdf|woff2?|ttf|webmanifest)$/i.test(
      pathname
    )
  ) {
    return NextResponse.next();
  }

  if (!token || !(await verifySessionToken(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr).*)"],
};
