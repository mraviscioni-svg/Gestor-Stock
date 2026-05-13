import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";
import { AuthError, AuthzError } from "@/lib/errors";
import type { SessionUser, TenantSessionUser } from "@/types";

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionFromCookies();
  if (!session) {
    throw new AuthError("UNAUTHORIZED", 401);
  }
  return session;
}

/** APIs y páginas del comercio: exige tenant en token y rechaza SUPER_ADMIN de plataforma. */
export async function requireTenantSession(): Promise<TenantSessionUser> {
  const session = await requireSession();
  if (session.role === Role.SUPER_ADMIN) {
    throw new AuthzError("Usá el panel de plataforma (/admin).", 403);
  }
  if (!session.tenantId || !session.tenantSlug) {
    throw new AuthzError("Sesión sin comercio asignado.", 403);
  }
  return session as TenantSessionUser;
}

export async function requireSuperAdminSession(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== Role.SUPER_ADMIN) {
    throw new AuthzError("Solo administradores de plataforma.", 403);
  }
  return session;
}
