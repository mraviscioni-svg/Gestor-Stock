import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { assertActorCanAssignRole, requireTenantManager } from "@/lib/authz";
import { DomainError } from "@/lib/errors";
import { tenantRepository } from "@/repositories/tenant.repository";
import { userRepository } from "@/repositories/user.repository";
import { AUDIT_ACTIONS, auditService } from "@/services/audit.service";
import type { TenantSessionUser } from "@/types";

function toRole(r: "OWNER" | "ADMIN" | "CASHIER" | "VIEWER"): Role {
  return Role[r];
}

function serializeUser(u: {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export const userAdminService = {
  async list(tenantId: string) {
    const rows = await userRepository.listByTenant(tenantId);
    return rows.map((u) => serializeUser(u));
  },

  async create(
    session: TenantSessionUser,
    input: {
      username: string;
      email?: string | null;
      password: string;
      name?: string | null;
      role: "OWNER" | "ADMIN" | "CASHIER" | "VIEWER";
    }
  ) {
    requireTenantManager(session);
    const role = toRole(input.role);
    assertActorCanAssignRole(session.role, role);
    const tenant = await tenantRepository.findById(session.tenantId);
    if (tenant?.maxUsers != null) {
      const n = await tenantRepository.countUsers(session.tenantId);
      if (n >= tenant.maxUsers) {
        throw new DomainError("Límite de usuarios del plan alcanzado", "PLAN_LIMIT_USERS");
      }
    }
    const username = input.username;
    const existing = await userRepository.findByTenantAndUsername(session.tenantId, username);
    if (existing) {
      throw new DomainError("Ese usuario ya está registrado en el comercio", "USERNAME_TAKEN");
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const name =
      input.name === undefined || input.name === null ? null : input.name.trim() || null;
    const email =
      input.email === undefined || input.email === null || input.email === ""
        ? null
        : input.email.trim().toLowerCase();
    const created = await userRepository.create({
      tenantId: session.tenantId,
      username,
      email,
      passwordHash,
      name,
      role,
      active: true,
    });
    await auditService.log({
      actorUserId: session.userId,
      actorTenantId: session.tenantId,
      action: AUDIT_ACTIONS.USER_CREATED,
      entityType: "User",
      entityId: created.id,
      metadata: { username: created.username, role: created.role },
    });
    return serializeUser(created);
  },

  async update(
    session: TenantSessionUser,
    userId: string,
    input: {
      name?: string | null;
      role?: "OWNER" | "ADMIN" | "CASHIER" | "VIEWER";
      active?: boolean;
    }
  ) {
    requireTenantManager(session);
    const target = await userRepository.findByIdInTenant(session.tenantId, userId);
    if (!target) {
      throw new DomainError("Usuario no encontrado", "NOT_FOUND", 404);
    }

    if (input.role !== undefined) {
      const newRole = toRole(input.role);
      assertActorCanAssignRole(session.role, newRole);
      if (target.role === Role.OWNER && newRole !== Role.OWNER) {
        const owners = await userRepository.countActiveOwnersInTenant(session.tenantId);
        if (owners <= 1) {
          throw new DomainError("Tiene que haber al menos un dueño activo", "LAST_OWNER");
        }
      }
    }

    if (input.active === false) {
      if (target.id === session.userId) {
        throw new DomainError("No podés desactivarte a vos mismo", "SELF_DEACTIVATE");
      }
      if (target.role === Role.OWNER && target.active) {
        const owners = await userRepository.countActiveOwnersInTenant(session.tenantId);
        if (owners <= 1) {
          throw new DomainError("No podés desactivar al único dueño activo", "LAST_OWNER");
        }
      }
    }

    const name =
      input.name === undefined
        ? undefined
        : input.name === null
          ? null
          : input.name.trim() || null;
    const role = input.role === undefined ? undefined : toRole(input.role);
    const active = input.active;

    const prevRole = target.role;
    const updated = await userRepository.updateInTenant(session.tenantId, userId, {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(active !== undefined && { active }),
    });
    if (!updated) {
      throw new DomainError("Usuario no encontrado", "NOT_FOUND", 404);
    }
    if (role !== undefined && role !== prevRole) {
      await auditService.log({
        actorUserId: session.userId,
        actorTenantId: session.tenantId,
        action: AUDIT_ACTIONS.ROLE_CHANGED,
        entityType: "User",
        entityId: userId,
        metadata: { from: prevRole, to: role },
      });
    }
    return serializeUser(updated);
  },
};
