import { prisma } from "@/lib/prisma";

export const activityRepository = {
  async upsertPing(tenantId: string, userId: string, currentPage: string | null) {
    const now = new Date();
    return prisma.userActivity.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      create: { tenantId, userId, lastSeenAt: now, currentPage },
      update: { lastSeenAt: now, currentPage },
    });
  },

  async listByTenant(tenantId: string) {
    return prisma.userActivity.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, email: true, name: true, role: true, active: true } } },
    });
  },
};
