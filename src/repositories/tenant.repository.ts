import { prisma } from "@/lib/prisma";

export const tenantRepository = {
  async findById(id: string) {
    return prisma.tenant.findUnique({ where: { id } });
  },

  async updateName(id: string, name: string) {
    return prisma.tenant.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
    });
  },
};
