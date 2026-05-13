import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { TenantScopeError } from "@/lib/tenant";
import { DomainError } from "@/lib/errors";

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleRouteError(e: unknown) {
  if (e instanceof AuthError) {
    return jsonError(e.message, e.status);
  }
  if (e instanceof TenantScopeError) {
    return jsonError("No autorizado para este tenant", 403);
  }
  if (e instanceof DomainError) {
    return jsonError(e.message, 400, { code: e.code });
  }
  // eslint-disable-next-line no-console
  console.error(e);
  return jsonError("Error interno", 500);
}
