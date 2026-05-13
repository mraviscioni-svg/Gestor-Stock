import bcrypt from "bcryptjs";
import { Role, TenantStatus } from "@prisma/client";
import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { tenantRepository } from "@/repositories/tenant.repository";
import { userRepository } from "@/repositories/user.repository";
import { auditService, AUDIT_ACTIONS } from "@/services/audit.service";
import type { SessionUser } from "@/types";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export const platformAdminService = {
  async getStats() {
    const [tenantsActive, tenantsTotal, usersTotal, salesTotal, tenants] = await Promise.all([
      prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      prisma.tenant.count(),
      prisma.user.count({ where: { tenantId: { not: null } } }),
      prisma.sale.count(),
      prisma.tenant.findMany({
        take: 8,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          _count: { select: { sales: true, users: true } },
        },
      }),
    ]);

    const salesByTenant = await prisma.sale.groupBy({
      by: ["tenantId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    });
    const tenantIds = salesByTenant.map((s) => s.tenantId);
    const tenantRows = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, slug: true },
    });
    const tmap = new Map(tenantRows.map((t) => [t.id, t]));

    const onlineWindow = new Date(Date.now() - 5 * 60 * 1000);
    const tenantsOnline = await prisma.userActivity.groupBy({
      by: ["tenantId"],
      where: { lastSeenAt: { gte: onlineWindow } },
      _count: { userId: true },
    });

    return {
      tenantsActive,
      tenantsTotal,
      usersTotal,
      salesTotal,
      tenantsOnlineCount: tenantsOnline.length,
      recentTenants: tenants,
      topSalesTenants: salesByTenant.map((row) => ({
        tenantId: row.tenantId,
        salesCount: row._count.id,
        tenant: tmap.get(row.tenantId) ?? null,
      })),
      tenantsOnline: tenantsOnline.map((row) => ({
        tenantId: row.tenantId,
        activeUsers: row._count.userId,
      })),
    };
  },

  async listTenants(page: number, pageSize: number) {
    const skip = Math.max(0, page - 1) * pageSize;
    const [total, rows] = await Promise.all([
      tenantRepository.countAll(),
      tenantRepository.listForAdmin(skip, pageSize),
    ]);
    return {
      total,
      page,
      pageSize,
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        email: t.email,
        status: t.status,
        currentPlan: t.currentPlan,
        subscriptionStatus: t.subscriptionStatus,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        counts: {
          users: t._count.users,
          sales: t._count.sales,
          products: t._count.products,
        },
      })),
    };
  },

  async getTenant(id: string) {
    const t = await prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true, sales: true, products: true } } },
    });
    if (!t) throw new DomainError("Tenant no encontrado", "NOT_FOUND", 404);
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      email: t.email,
      phone: t.phone,
      logoUrl: t.logoUrl,
      subdomain: t.subdomain,
      status: t.status,
      currentPlan: t.currentPlan,
      subscriptionStatus: t.subscriptionStatus,
      maxUsers: t.maxUsers,
      maxProducts: t.maxProducts,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      counts: {
        users: t._count.users,
        sales: t._count.sales,
        products: t._count.products,
      },
    };
  },

  async createTenant(
    actor: SessionUser,
    input: {
      name: string;
      slug?: string;
      email?: string | null;
      phone?: string | null;
      status?: TenantStatus;
    },
    ip?: string | null
  ) {
    const name = input.name.trim();
    if (!name) throw new DomainError("Nombre requerido", "INVALID_NAME");
    const slug = input.slug?.trim() ? slugify(input.slug) : slugify(name);
    if (!slug) throw new DomainError("Slug inválido", "INVALID_SLUG");

    const exists = await tenantRepository.findBySlug(slug);
    if (exists) throw new DomainError("Ese slug ya está en uso", "SLUG_TAKEN");

    const tenant = await tenantRepository.create({
      name,
      slug,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      status: input.status ?? TenantStatus.ACTIVE,
    });

    await auditService.log({
      actorUserId: actor.userId,
      actorTenantId: null,
      action: AUDIT_ACTIONS.TENANT_CREATED,
      entityType: "Tenant",
      entityId: tenant.id,
      metadata: { slug: tenant.slug, name: tenant.name },
      ip: ip ?? null,
    });

    return this.getTenant(tenant.id);
  },

  async patchTenant(
    actor: SessionUser,
    id: string,
    patch: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      logoUrl?: string | null;
      subdomain?: string | null;
      status?: TenantStatus;
      currentPlan?: string;
      maxUsers?: number | null;
      maxProducts?: number | null;
    },
    ip?: string | null
  ) {
    const data: Parameters<typeof tenantRepository.updateAdmin>[1] = {};
    if (patch.name !== undefined) data.name = patch.name.trim();
    if (patch.email !== undefined) data.email = patch.email?.trim() || null;
    if (patch.phone !== undefined) data.phone = patch.phone?.trim() || null;
    if (patch.logoUrl !== undefined) data.logoUrl = patch.logoUrl?.trim() || null;
    if (patch.subdomain !== undefined) {
      const s = patch.subdomain?.trim() || null;
      data.subdomain = s ? slugify(s) : null;
    }
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.currentPlan !== undefined) data.currentPlan = patch.currentPlan.trim();
    if (patch.maxUsers !== undefined) data.maxUsers = patch.maxUsers;
    if (patch.maxProducts !== undefined) data.maxProducts = patch.maxProducts;

    try {
      await tenantRepository.updateAdmin(id, data);
    } catch (e) {
      if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
        throw new DomainError("Subdominio o slug duplicado", "DUPLICATE", 409);
      }
      throw e;
    }

    await auditService.log({
      actorUserId: actor.userId,
      actorTenantId: null,
      action: AUDIT_ACTIONS.TENANT_UPDATED,
      entityType: "Tenant",
      entityId: id,
      metadata: patch,
      ip: ip ?? null,
    });

    return this.getTenant(id);
  },

  async listUsers(tenantId: string) {
    await this.getTenant(tenantId);
    return userRepository.listByTenant(tenantId);
  },

  async createUser(
    actor: SessionUser,
    tenantId: string,
    input: { email: string; password: string; name?: string | null; role: Role },
    ip?: string | null
  ) {
    await this.getTenant(tenantId);
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new DomainError("Tenant no encontrado", "NOT_FOUND", 404);
    if (tenant.maxUsers != null) {
      const n = await tenantRepository.countUsers(tenantId);
      if (n >= tenant.maxUsers) {
        throw new DomainError("Límite de usuarios del plan alcanzado", "PLAN_LIMIT_USERS");
      }
    }
    if (input.role === Role.SUPER_ADMIN) {
      throw new DomainError("Rol inválido en comercio", "INVALID_ROLE");
    }
    const email = input.email.trim().toLowerCase();
    const existing = await userRepository.findByTenantAndEmail(tenantId, email);
    if (existing) throw new DomainError("Ese email ya está registrado", "EMAIL_TAKEN");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const name = input.name === undefined || input.name === null ? null : input.name.trim() || null;
    const created = await userRepository.create({
      tenantId,
      email,
      passwordHash,
      name,
      role: input.role,
      active: true,
    });

    await auditService.log({
      actorUserId: actor.userId,
      actorTenantId: null,
      action: AUDIT_ACTIONS.USER_CREATED,
      entityType: "User",
      entityId: created.id,
      metadata: { tenantId, email: created.email, role: created.role },
      ip: ip ?? null,
    });

    return created;
  },

  async patchUser(
    actor: SessionUser,
    tenantId: string,
    userId: string,
    patch: { name?: string | null; role?: Role; active?: boolean; password?: string },
    ip?: string | null
  ) {
    await this.getTenant(tenantId);
    const target = await userRepository.findByIdInTenant(tenantId, userId);
    if (!target) throw new DomainError("Usuario no encontrado", "NOT_FOUND", 404);
    if (target.role === Role.SUPER_ADMIN) {
      throw new DomainError("Operación no permitida", "INVALID_ROLE", 400);
    }
    if (patch.role === Role.SUPER_ADMIN) {
      throw new DomainError("Operación no permitida", "INVALID_ROLE", 400);
    }

    if (patch.role !== undefined) {
      const newRole = patch.role;
      if (target.role === Role.OWNER && newRole !== Role.OWNER) {
        const owners = await userRepository.countActiveOwnersInTenant(tenantId);
        if (owners <= 1) {
          throw new DomainError("Tiene que haber al menos un dueño activo", "LAST_OWNER");
        }
      }
    }
    if (patch.active === false && target.role === Role.OWNER && target.active) {
      const owners = await userRepository.countActiveOwnersInTenant(tenantId);
      if (owners <= 1) {
        throw new DomainError("No podés desactivar al único dueño activo", "LAST_OWNER");
      }
    }

    if (patch.password) {
      const passwordHash = await bcrypt.hash(patch.password, 12);
      await userRepository.setPasswordHashInTenant(tenantId, userId, passwordHash);
    }

    if (patch.name !== undefined || patch.role !== undefined || patch.active !== undefined) {
      const prevRole = target.role;
      await userRepository.updateInTenant(tenantId, userId, {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.role !== undefined && { role: patch.role }),
        ...(patch.active !== undefined && { active: patch.active }),
      });
      if (patch.role !== undefined && patch.role !== prevRole) {
        await auditService.log({
          actorUserId: actor.userId,
          actorTenantId: null,
          action: AUDIT_ACTIONS.ROLE_CHANGED,
          entityType: "User",
          entityId: userId,
          metadata: { tenantId, from: prevRole, to: patch.role },
          ip: ip ?? null,
        });
      }
    }

    await auditService.log({
      actorUserId: actor.userId,
      actorTenantId: null,
      action: AUDIT_ACTIONS.USER_UPDATED,
      entityType: "User",
      entityId: userId,
      metadata: { tenantId, fields: Object.keys(patch) },
      ip: ip ?? null,
    });

    const list = await userRepository.listByTenant(tenantId);
    return list.find((u) => u.id === userId) ?? null;
  },
};
