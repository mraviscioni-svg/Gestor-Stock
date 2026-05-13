import { prisma } from "@/lib/prisma";

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });
  },
};
