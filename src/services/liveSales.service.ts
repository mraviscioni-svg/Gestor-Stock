import { PaymentStatus, SaleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activityRepository } from "@/repositories/activity.repository";

const ONLINE_MS = 2 * 60 * 1000;

function startOfUtcDay(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export const liveSalesService = {
  async getSnapshot(tenantId: string) {
    const now = Date.now();
    const dayStart = startOfUtcDay();

    const [users, activities, salesToday, openSales, recentSalesWithLines] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, active: true },
        select: { id: true, email: true, name: true, role: true },
        orderBy: { name: "asc" },
      }),
      activityRepository.listByTenant(tenantId),
      prisma.sale.findMany({
        where: { tenantId, createdAt: { gte: dayStart } },
        select: {
          id: true,
          userId: true,
          total: true,
          paymentStatus: true,
          saleStatus: true,
          createdAt: true,
        },
      }),
      prisma.sale.findMany({
        where: {
          tenantId,
          saleStatus: SaleStatus.OPEN,
          paymentStatus: PaymentStatus.PENDING,
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            take: 8,
            include: { product: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.sale.findMany({
        where: { tenantId, createdAt: { gte: dayStart } },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          items: {
            include: { product: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    const activityByUser = new Map(activities.map((a) => [a.userId, a]));

    const salesTodayByUser = new Map<
      string,
      { count: number; totalPaid: number; openCount: number; pendingTotal: number }
    >();
    for (const u of users) {
      salesTodayByUser.set(u.id, { count: 0, totalPaid: 0, openCount: 0, pendingTotal: 0 });
    }
    for (const s of salesToday) {
      const uid = s.userId ?? "";
      if (!salesTodayByUser.has(uid)) continue;
      const agg = salesTodayByUser.get(uid)!;
      agg.count += 1;
      if (s.paymentStatus === PaymentStatus.PAID && s.saleStatus === SaleStatus.CLOSED) {
        agg.totalPaid += Number(s.total);
      }
      if (s.paymentStatus === PaymentStatus.PENDING && s.saleStatus === SaleStatus.OPEN) {
        agg.openCount += 1;
        agg.pendingTotal += Number(s.total);
      }
    }

    const recentByUser = new Map<string, { productName: string; quantity: number; at: string }[]>();
    for (const sale of recentSalesWithLines) {
      const uid = sale.userId;
      if (!uid) continue;
      const list = recentByUser.get(uid) ?? [];
      for (const line of sale.items) {
        if (list.length >= 5) break;
        list.push({
          productName: line.product.name,
          quantity: line.quantity,
          at: sale.createdAt.toISOString(),
        });
      }
      if (list.length) recentByUser.set(uid, list);
    }

    const userPayload = users.map((u) => {
      const act = activityByUser.get(u.id);
      const lastSeen = act?.lastSeenAt?.getTime() ?? 0;
      const online = lastSeen > 0 && now - lastSeen < ONLINE_MS;
      const agg = salesTodayByUser.get(u.id) ?? {
        count: 0,
        totalPaid: 0,
        openCount: 0,
        pendingTotal: 0,
      };
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        online,
        lastSeenAt: act?.lastSeenAt?.toISOString() ?? null,
        currentPage: act?.currentPage ?? null,
        salesTodayCount: agg.count,
        salesTodayPaidTotal: agg.totalPaid,
        openSalesCount: agg.openCount,
        pendingTotal: agg.pendingTotal,
        recentLines: recentByUser.get(u.id) ?? [],
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      users: userPayload,
      openSales: openSales.map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: s.user?.name ?? s.user?.email ?? null,
        total: Number(s.total),
        createdAt: s.createdAt.toISOString(),
        items: s.items.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          lineTotal: Number(i.lineTotal),
        })),
      })),
    };
  },
};
