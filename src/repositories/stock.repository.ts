import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type StockMovementWithProduct = Prisma.StockMovementGetPayload<{
  include: { product: true };
}>;

export function mapStockMovementToDTO(m: StockMovementWithProduct) {
  return {
    id: m.id,
    productId: m.productId,
    productName: m.product.name,
    quantity: m.quantity,
    reason: m.reason,
    note: m.note,
    createdAt: m.createdAt.toISOString(),
  };
}

export const stockRepository = {
  async listMovements(tenantId: string, take = 100) {
    return prisma.stockMovement.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take,
      include: { product: true },
    });
  },

  async createMovement(data: Prisma.StockMovementCreateInput) {
    return prisma.stockMovement.create({
      data,
      include: { product: true },
    });
  },
};
