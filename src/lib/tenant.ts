import type { SessionUser, TenantSessionUser } from "@/types";

/**
 * Tenant activo para operaciones de API (solo tras `requireTenantSession`).
 */
export function getTenantIdForRequest(session: TenantSessionUser): string {
  return session.tenantId;
}

export function assertTenantScope(
  session: SessionUser,
  tenantIdFromUntrustedSource: string | undefined | null
): void {
  if (!tenantIdFromUntrustedSource || !session.tenantId) return;
  if (tenantIdFromUntrustedSource !== session.tenantId) {
    throw new TenantScopeError();
  }
}

/** Valida que el slug de la URL coincide con la sesión (defensa en profundidad). */
export function assertSlugMatchesSession(session: TenantSessionUser, urlSlug: string): void {
  const normalized = urlSlug.trim().toLowerCase();
  if (normalized !== session.tenantSlug) {
    throw new TenantScopeError();
  }
}

export class TenantScopeError extends Error {
  constructor() {
    super("TENANT_SCOPE_MISMATCH");
    this.name = "TenantScopeError";
  }
}
