import { TenantStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const tenantRepository = {
  async findById(id: string) {
    return prisma.tenant.findUnique({ where: { id } });
  },

  async findBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } });
  },

  async updateName(id: string, name: string) {
    return prisma.tenant.update({
      where: { id },
      data: { name },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        logoUrl: true,
        status: true,
        currentPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async countUsers(tenantId: string) {
    return prisma.user.count({ where: { tenantId } });
  },

  async countProducts(tenantId: string) {
    return prisma.product.count({ where: { tenantId } });
  },

  async countSales(tenantId: string) {
    return prisma.sale.count({ where: { tenantId } });
  },

  async listForAdmin(skip: number, take: number) {
    return prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        _count: { select: { users: true, sales: true, products: true } },
      },
    });
  },

  async countAll() {
    return prisma.tenant.count();
  },

  async create(data: Prisma.TenantCreateInput) {
    return prisma.tenant.create({ data });
  },

  async updateAdmin(
    id: string,
    data: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      logoUrl?: string | null;
      subdomain?: string | null;
      status?: TenantStatus;
      currentPlan?: string;
      maxUsers?: number | null;
      maxProducts?: number | null;
    }
  ) {
    return prisma.tenant.update({
      where: { id },
      data,
      include: { _count: { select: { users: true, sales: true, products: true } } },
    });
  },
};
