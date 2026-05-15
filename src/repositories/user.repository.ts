import { Role, TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const userRepository = {
  /** SUPER_ADMIN de plataforma (sin tenant). */
  async findPlatformAdminByUsername(username: string) {
    return prisma.user.findFirst({
      where: {
        username,
        role: Role.SUPER_ADMIN,
        tenantId: null,
      },
    });
  },

  /** Usuarios con este username que tienen comercio asignado y comercio activo. */
  async findLoginCandidatesByUsername(username: string) {
    return prisma.user.findMany({
      where: {
        username,
        tenantId: { not: null },
        tenant: { status: TenantStatus.ACTIVE },
      },
      include: { tenant: true },
    });
  },

  async findByTenantAndUsername(tenantId: string, username: string) {
    return prisma.user.findUnique({
      where: { tenantId_username: { tenantId, username } },
    });
  },

  async findByTenantAndEmail(tenantId: string, email: string) {
    return prisma.user.findFirst({
      where: { tenantId, email },
    });
  },

  async findByIdInTenant(tenantId: string, id: string) {
    return prisma.user.findFirst({
      where: { id, tenantId },
    });
  },

  async listByTenant(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async countActiveOwnersInTenant(tenantId: string) {
    return prisma.user.count({
      where: { tenantId, role: Role.OWNER, active: true },
    });
  },

  async create(data: {
    tenantId: string;
    username: string;
    email?: string | null;
    passwordHash: string;
    name: string | null;
    role: Role;
    active?: boolean;
  }) {
    return prisma.user.create({
      data: {
        tenantId: data.tenantId,
        username: data.username,
        email: data.email ?? null,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        active: data.active ?? true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async setPasswordHashInTenant(tenantId: string, id: string, passwordHash: string) {
    const row = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!row) return null;
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateInTenant(
    tenantId: string,
    id: string,
    data: { name?: string | null; role?: Role; active?: boolean }
  ) {
    const row = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!row) return null;
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.active !== undefined && { active: data.active }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
