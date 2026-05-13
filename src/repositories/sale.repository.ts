import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SaleWithItems = Prisma.SaleGetPayload<{
  include: { items: { include: { product: true } } };
}>;

function num(d: Prisma.Decimal): number {
  return Number(d);
}

export function mapSaleToDTO(sale: SaleWithItems) {
  return {
    id: sale.id,
    tenantId: sale.tenantId,
    total: num(sale.total),
    paymentMethod: sale.paymentMethod,
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

export const saleRepository = {
  async listRecent(tenantId: string, take = 50) {
    return prisma.sale.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  },
};
