import { requireSession, requireTenantSession } from "@/lib/auth/server";
import type { SessionUser, TenantSessionUser } from "@/types";

/**
 * Punto único para obtener la sesión autenticada en server code.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  return requireSession();
}

export async function getCurrentTenantUser(): Promise<TenantSessionUser> {
  return requireTenantSession();
}
