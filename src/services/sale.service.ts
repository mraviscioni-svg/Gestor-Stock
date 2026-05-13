import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Role,
  SaleStatus,
  StockMovementReason,
} from "@prisma/client";
import { AuthzError, DomainError } from "@/lib/errors";
import { canManageOthersSales } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { mapSaleToDTO } from "@/repositories/sale.repository";
import type { SessionUser } from "@/types";
import { AUDIT_ACTIONS, auditService } from "@/services/audit.service";

export type SaleCreateMode = "immediate" | "deferred";

export const saleService = {
  async createSale(
    tenantId: string,
    session: SessionUser,
    input: {
      mode: SaleCreateMode;
      paymentMethod?: PaymentMethod;
      items: { productId: string; quantity: number }[];
    }
  ) {
    const userId = session.userId;
    if (session.role === Role.VIEWER) {
      throw new AuthzError("Solo lectura: no podés registrar ventas", 403);
    }
    const isImmediate = input.mode === "immediate";
    if (isImmediate && !input.paymentMethod) {
      throw new DomainError("Medio de pago requerido para venta inmediata", "PAYMENT_REQUIRED");
    }

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

      const paymentStatus = isImmediate ? PaymentStatus.PAID : PaymentStatus.PENDING;
      const saleStatus = isImmediate ? SaleStatus.CLOSED : SaleStatus.OPEN;
      const closedAt = isImmediate ? new Date() : null;

      const created = await tx.sale.create({
        data: {
          tenantId,
          userId,
          total,
          paymentMethod: isImmediate ? input.paymentMethod! : null,
          paymentStatus,
          saleStatus,
          closedAt,
          items: {
            create: lineData.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, name: true, email: true } },
        },
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
            note: isImmediate ? `Venta ${created.id}` : `Venta diferida ${created.id}`,
            userId,
          },
        });
      }

      return created;
    });

    await auditService.log({
      actorUserId: userId,
      actorTenantId: tenantId,
      action: AUDIT_ACTIONS.SALE_CREATED,
      entityType: "Sale",
      entityId: sale.id,
      metadata: { total: sale.total.toString(), mode: input.mode },
    });

    return mapSaleToDTO(sale);
  },

  async closeDeferredSale(tenantId: string, session: SessionUser, saleId: string, paymentMethod: PaymentMethod) {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, tenantId },
    });
    if (!sale) {
      throw new DomainError("Venta no encontrada", "NOT_FOUND", 404);
    }
    if (sale.saleStatus !== SaleStatus.OPEN || sale.paymentStatus !== PaymentStatus.PENDING) {
      throw new DomainError("La venta no está pendiente de cobro", "INVALID_STATE");
    }
    if (session.role === Role.VIEWER) {
      throw new AuthzError("Solo lectura: no podés cobrar ventas", 403);
    }
    if (!canManageOthersSales(session.role) && sale.userId !== session.userId) {
      throw new AuthzError("No podés cobrar ventas de otro vendedor", 403);
    }

    const updated = await prisma.sale.update({
      where: { id: saleId },
      data: {
        paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        saleStatus: SaleStatus.CLOSED,
        closedAt: new Date(),
      },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return mapSaleToDTO(updated);
  },

  async cancelSale(tenantId: string, session: SessionUser, saleId: string) {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: { items: true },
    });
    if (!sale) {
      throw new DomainError("Venta no encontrada", "NOT_FOUND", 404);
    }
    if (sale.saleStatus !== SaleStatus.OPEN || sale.paymentStatus !== PaymentStatus.PENDING) {
      throw new DomainError("Solo se pueden cancelar ventas abiertas pendientes", "INVALID_STATE");
    }
    if (session.role === Role.VIEWER) {
      throw new AuthzError("Solo lectura: no podés cancelar ventas", 403);
    }
    if (!canManageOthersSales(session.role) && sale.userId !== session.userId) {
      throw new AuthzError("No podés cancelar ventas de otro vendedor", 403);
    }

    await prisma.$transaction(async (tx) => {
      for (const line of sale.items) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { increment: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: line.productId,
            quantity: line.quantity,
            reason: StockMovementReason.MANUAL_ADJUST,
            note: `Devolución cancelación venta ${sale.id}`,
            userId: session.userId,
          },
        });
      }
      await tx.sale.update({
        where: { id: saleId },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          saleStatus: SaleStatus.CANCELLED,
          closedAt: new Date(),
        },
      });
    });

    const out = await prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!out) throw new DomainError("Venta no encontrada", "NOT_FOUND", 404);
    return mapSaleToDTO(out);
  },
};
