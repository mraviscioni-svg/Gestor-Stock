import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

function slugFromTenantPath(pathname: string): string | null {
  const m = pathname.match(/^\/t\/([^/]+)/);
  return m?.[1] ?? null;
}

function isLegacyAppPath(pathname: string): boolean {
  const prefixes = ["/dashboard", "/products", "/sales", "/stock", "/settings", "/manager"];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== Role.SUPER_ADMIN) {
      const dest = session.tenantSlug ? `/t/${session.tenantSlug}/dashboard` : "/login";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  const pathSlug = slugFromTenantPath(pathname);
  if (pathSlug) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role === Role.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (!session.tenantSlug || session.tenantSlug !== pathSlug) {
      return NextResponse.redirect(new URL(`/t/${session.tenantSlug}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  if (isLegacyAppPath(pathname)) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role === Role.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (!session.tenantSlug) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL(`/t/${session.tenantSlug}${pathname}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/t/:path*",
    "/admin",
    "/admin/:path*",
    "/dashboard/:path*",
    "/dashboard",
    "/products/:path*",
    "/products",
    "/sales/:path*",
    "/sales",
    "/stock/:path*",
    "/stock",
    "/settings",
    "/settings/:path*",
    "/manager",
    "/manager/:path*",
  ],
};
