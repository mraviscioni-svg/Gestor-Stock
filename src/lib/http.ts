import { NextResponse } from "next/server";
import { AuthError, AuthzError, DomainError } from "@/lib/errors";
import { TenantScopeError } from "@/lib/tenant";

export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip");
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleRouteError(e: unknown) {
  if (e instanceof AuthError) {
    return jsonError(e.message, e.status);
  }
  if (e instanceof AuthzError) {
    return jsonError(e.message, e.status);
  }
  if (e instanceof TenantScopeError) {
    return jsonError("No autorizado para este tenant", 403);
  }
  if (e instanceof DomainError) {
    return jsonError(e.message, e.status, { code: e.code });
  }
  // eslint-disable-next-line no-console
  console.error(e);
  return jsonError("Error interno", 500);
}
