import { prisma } from "@/lib/prisma";
import type { DashboardSummary } from "@/types";

export const dashboardService = {
  async getSummary(tenantId: string): Promise<DashboardSummary> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    let dbStatus: "ok" | "error" = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    const [salesTodayAgg, productsCount, lowStockRows, lastSale] = await Promise.all([
      prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: start } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.product.count({ where: { tenantId, active: true } }),
      prisma.$queryRaw<{ c: bigint }[]>`
        SELECT COUNT(*)::bigint as c FROM "Product"
        WHERE "tenantId" = ${tenantId} AND "active" = true AND "stock" <= "minStock"
      `,
      prisma.sale.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const low = Number(lowStockRows[0]?.c ?? 0);

    return {
      salesTodayCount: salesTodayAgg._count._all,
      salesTodayTotal: Number(salesTodayAgg._sum.total ?? 0),
      productsCount,
      lowStockCount: low,
      lastSale: lastSale
        ? {
            id: lastSale.id,
            total: Number(lastSale.total),
            paymentMethod: lastSale.paymentMethod,
            createdAt: lastSale.createdAt.toISOString(),
          }
        : null,
      system: {
        env: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
        db: dbStatus,
        version: process.env.npm_package_version ?? "0.1.0",
      },
    };
  },
};
