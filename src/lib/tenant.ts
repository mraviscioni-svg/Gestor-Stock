import type { SessionUser } from "@/types";

/**
 * Resolves the active tenant for server-side operations.
 * MVP: always derived from the authenticated session.
 * Future: subdomain headers, impersonation, or explicit admin scope — never trust client-provided tenantId alone.
 */
export function getTenantIdForRequest(session: SessionUser): string {
  return session.tenantId;
}

export function assertTenantScope(
  session: SessionUser,
  tenantIdFromUntrustedSource: string | undefined | null
): void {
  if (!tenantIdFromUntrustedSource) return;
  if (tenantIdFromUntrustedSource !== session.tenantId) {
    throw new TenantScopeError();
  }
}

export class TenantScopeError extends Error {
  constructor() {
    super("TENANT_SCOPE_MISMATCH");
    this.name = "TenantScopeError";
  }
}
