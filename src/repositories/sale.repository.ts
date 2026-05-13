import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SaleWithItems = Prisma.SaleGetPayload<{
  include: {
    items: { include: { product: true } };
    user: { select: { id: true; name: true; email: true } };
  };
}>;

function num(d: Prisma.Decimal): number {
  return Number(d);
}

export function mapSaleToDTO(sale: SaleWithItems) {
  return {
    id: sale.id,
    tenantId: sale.tenantId,
    userId: sale.userId,
    userName: sale.user?.name ?? sale.user?.email ?? null,
    total: num(sale.total),
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus,
    saleStatus: sale.saleStatus,
    closedAt: sale.closedAt?.toISOString() ?? null,
    createdAt: sale.createdAt.toISOString(),
    items: sale.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: num(i.unitPrice),
      lineTotal: num(i.lineTotal),
    })),
  };
}

const saleInclude = {
  items: { include: { product: true } },
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.SaleInclude;

export const saleRepository = {
  async findByIdInTenant(tenantId: string, saleId: string) {
    return prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: { items: { include: { product: true } } },
    });
  },

  async listRecent(tenantId: string, take = 50, userId?: string | null) {
    return prisma.sale.findMany({
      where: {
        tenantId,
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      include: saleInclude,
    });
  },

  async listOpen(tenantId: string, userId?: string | null) {
    return prisma.sale.findMany({
      where: {
        tenantId,
        saleStatus: "OPEN",
        paymentStatus: "PENDING",
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: saleInclude,
    });
  },

  async listMyToday(tenantId: string, userId: string, start: Date) {
    return prisma.sale.findMany({
      where: { tenantId, userId, createdAt: { gte: start } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: saleInclude,
    });
  },
};
