import { Prisma, StockMovementReason } from "@prisma/client";
import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { mapSaleToDTO } from "@/repositories/sale.repository";

export const saleService = {
  async createSale(
    tenantId: string,
    userId: string | undefined,
    input: {
      paymentMethod: import("@prisma/client").PaymentMethod;
      items: { productId: string; quantity: number }[];
    }
  ) {
    const sale = await prisma.$transaction(async (tx) => {
      let total = new Prisma.Decimal(0);
      const lineData: {
        productId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }[] = [];

      for (const line of input.items) {
        const product = await tx.product.findFirst({
          where: { id: line.productId, tenantId, active: true },
        });
        if (!product) {
          throw new DomainError(`Producto inválido: ${line.productId}`, "INVALID_PRODUCT");
        }
        if (product.stock < line.quantity) {
          throw new DomainError(`Stock insuficiente para ${product.name}`, "INSUFFICIENT_STOCK");
        }
        const unitPrice = product.salePrice;
        const lineTotal = new Prisma.Decimal(unitPrice).mul(line.quantity);
        total = total.add(lineTotal);
        lineData.push({
          productId: product.id,
          quantity: line.quantity,
          unitPrice: new Prisma.Decimal(unitPrice),
          lineTotal,
        });
      }

      const created = await tx.sale.create({
        data: {
          tenantId,
          total,
          paymentMethod: input.paymentMethod,
          items: {
            create: lineData.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const line of lineData) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: line.productId,
            quantity: -line.quantity,
            reason: StockMovementReason.SALE,
            note: `Venta ${created.id}`,
            userId: userId ?? null,
          },
        });
      }

      return created;
    });

    return mapSaleToDTO(sale);
  },
};
