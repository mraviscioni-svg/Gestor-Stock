import { Role, TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const userRepository = {
  /** SUPER_ADMIN de plataforma (sin tenant). */
  async findPlatformAdminByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        role: Role.SUPER_ADMIN,
        tenantId: null,
      },
    });
  },

  /** Usuarios con este email que tienen comercio asignado y comercio activo. */
  async findLoginCandidatesByEmail(email: string) {
    return prisma.user.findMany({
      where: {
        email,
        tenantId: { not: null },
        tenant: { status: TenantStatus.ACTIVE },
      },
      include: { tenant: true },
    });
  },

  async findByTenantAndEmail(tenantId: string, email: string) {
    return prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
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
    email: string;
    passwordHash: string;
    name: string | null;
    role: Role;
    active?: boolean;
  }) {
    return prisma.user.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        active: data.active ?? true,
      },
      select: {
        id: true,
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
