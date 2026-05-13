import { StockMovementReason } from "@prisma/client";
import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { mapStockMovementToDTO, stockRepository } from "@/repositories/stock.repository";

export const stockService = {
  async listMovements(tenantId: string) {
    const rows = await stockRepository.listMovements(tenantId);
    return rows.map(mapStockMovementToDTO);
  },

  async adjustStock(
    tenantId: string,
    userId: string | undefined,
    input: { productId: string; delta: number; note?: string }
  ) {
    if (input.delta === 0) {
      throw new DomainError("El ajuste no puede ser cero", "INVALID_DELTA");
    }

    const movement = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: input.productId, tenantId, active: true },
      });
      if (!product) {
        throw new DomainError("Producto no encontrado", "NOT_FOUND", 404);
      }
      const next = product.stock + input.delta;
      if (next < 0) {
        throw new DomainError("El stock resultante no puede ser negativo", "NEGATIVE_STOCK");
      }
      await tx.product.update({
        where: { id: product.id },
        data: { stock: next },
      });
      return tx.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          quantity: input.delta,
          reason: StockMovementReason.MANUAL_ADJUST,
          note: input.note ?? null,
          userId: userId ?? null,
        },
        include: { product: true },
      });
    });

    return mapStockMovementToDTO(movement);
  },
};
