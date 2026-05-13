import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

const prefixes = ["/dashboard", "/products", "/sales", "/stock", "/settings"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/products",
    "/sales/:path*",
    "/sales",
    "/stock/:path*",
    "/stock",
    "/settings",
    "/settings/:path*",
  ],
};
