import { Role } from "@prisma/client";
import { AuthzError } from "@/lib/errors";
import type { SessionUser, TenantSessionUser } from "@/types";

const TENANT_MANAGE_ROLES: Role[] = [Role.OWNER, Role.ADMIN];

export function canManageTenant(role: Role): boolean {
  return TENANT_MANAGE_ROLES.includes(role);
}

export function requireTenantManager(session: SessionUser): void {
  if (!canManageTenant(session.role)) {
    throw new AuthzError("No tenés permiso para administrar el comercio", 403);
  }
}

export function assertActorCanAssignRole(actorRole: Role, targetRole: Role): void {
  if (actorRole === Role.OWNER) return;
  if (actorRole === Role.ADMIN && targetRole !== Role.OWNER) return;
  throw new AuthzError("Solo el dueño puede asignar el rol de dueño", 403);
}

const POS_ROLES: Role[] = [Role.CASHIER, Role.ADMIN, Role.OWNER];

export function canUsePos(role: Role): boolean {
  return POS_ROLES.includes(role);
}

const LIVE_MANAGER_ROLES: Role[] = [Role.ADMIN, Role.OWNER, Role.VIEWER];

export function canViewLiveManager(role: Role): boolean {
  return LIVE_MANAGER_ROLES.includes(role);
}

const VIEW_ALL_SALES_ROLES: Role[] = [Role.ADMIN, Role.OWNER, Role.VIEWER];

export function canViewAllSalesInTenant(role: Role): boolean {
  return VIEW_ALL_SALES_ROLES.includes(role);
}

export function canManageOthersSales(role: Role): boolean {
  return role === Role.OWNER || role === Role.ADMIN;
}

export function requireRole(session: SessionUser, ...roles: Role[]): void {
  if (!roles.includes(session.role)) {
    throw new AuthzError("No autorizado", 403);
  }
}

export function requireSuperAdmin(session: SessionUser): void {
  if (session.role !== Role.SUPER_ADMIN) {
    throw new AuthzError("Solo administradores de plataforma.", 403);
  }
}

export function requireTenant(session: TenantSessionUser): void {
  if (!session.tenantId) {
    throw new AuthzError("Contexto de comercio requerido.", 403);
  }
}
