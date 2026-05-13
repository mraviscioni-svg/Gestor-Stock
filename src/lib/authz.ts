import { Role } from "@prisma/client";
import { AuthzError } from "@/lib/errors";
import type { SessionUser } from "@/types";

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

const POS_ROLES: Role[] = [Role.CASHIER, Role.ADMIN, Role.OWNER, Role.SUPER_ADMIN];

export function canUsePos(role: Role): boolean {
  return POS_ROLES.includes(role);
}

const LIVE_MANAGER_ROLES: Role[] = [Role.ADMIN, Role.OWNER, Role.VIEWER, Role.SUPER_ADMIN];

export function canViewLiveManager(role: Role): boolean {
  return LIVE_MANAGER_ROLES.includes(role);
}

export function canViewAllSalesInTenant(role: Role): boolean {
  return [Role.ADMIN, Role.OWNER, Role.VIEWER, Role.SUPER_ADMIN].includes(role);
}

export function canManageOthersSales(role: Role): boolean {
  return role === Role.OWNER || role === Role.ADMIN || role === Role.SUPER_ADMIN;
}
