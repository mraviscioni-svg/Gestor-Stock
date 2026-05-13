import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function num(d: Prisma.Decimal): number {
  return Number(d);
}

type ProductWithCategory = NonNullable<
  Awaited<ReturnType<typeof prisma.product.findFirst<{ include: { category: true } }>>>
>;

export function mapProductToDTO(p: ProductWithCategory) {
  return {
    id: p.id,
    tenantId: p.tenantId,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    name: p.name,
    barcode: p.barcode,
    purchasePrice: num(p.purchasePrice),
    salePrice: num(p.salePrice),
    stock: p.stock,
    minStock: p.minStock,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const productRepository = {
  async listByTenant(
    tenantId: string,
    opts: { search?: string; includeInactive?: boolean } = {}
  ) {
    const { search, includeInactive } = opts;
    return prisma.product.findMany({
      where: {
        tenantId,
        active: includeInactive ? undefined : true,
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { barcode: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  },

  async findById(tenantId: string, id: string) {
    return prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
  },

  async findByBarcode(tenantId: string, barcode: string) {
    return prisma.product.findFirst({
      where: { tenantId, barcode },
      include: { category: true },
    });
  },

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data, include: { category: true } });
  },

  async update(tenantId: string, id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id, tenantId },
      data,
      include: { category: true },
    });
  },
};
