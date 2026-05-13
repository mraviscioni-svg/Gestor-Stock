import { prisma } from "@/lib/prisma";

export const categoryRepository = {
  async listByTenant(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  },
};
