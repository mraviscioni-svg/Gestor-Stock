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
