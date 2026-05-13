import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

/** Compatibilidad: URLs antiguas /t/[slug]/... → mismas rutas sin slug (tenant viene de la sesión). */
function pathWithoutTenantSlug(pathname: string): string | null {
  const m = pathname.match(/^\/t\/[^/]+(\/.*|$)/);
  if (!m) return null;
  const rest = m[1] ?? "";
  if (rest === "" || rest === "/") return "/dashboard";
  return rest;
}

function isTenantAppPath(pathname: string): boolean {
  const prefixes = ["/dashboard", "/products", "/sales", "/stock", "/settings", "/manager"];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const canonical = pathWithoutTenantSlug(pathname);
  if (canonical !== null) {
    const url = req.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.redirect(url);
  }

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
      const dest = session.tenantId ? "/dashboard" : "/login";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (isTenantAppPath(pathname)) {
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
    if (!session.tenantId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
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
