import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/errors";
import { mapProductToDTO, productRepository } from "@/repositories/product.repository";
import { categoryRepository } from "@/repositories/category.repository";

export const productService = {
  async list(tenantId: string, search?: string, includeInactive?: boolean) {
    const rows = await productRepository.listByTenant(tenantId, { search, includeInactive });
    return rows.map(mapProductToDTO);
  },

  async getById(tenantId: string, id: string) {
    const p = await productRepository.findById(tenantId, id);
    return p ? mapProductToDTO(p) : null;
  },

  async getByBarcode(tenantId: string, barcode: string) {
    const p = await productRepository.findByBarcode(tenantId, barcode);
    return p ? mapProductToDTO(p) : null;
  },

  async create(
    tenantId: string,
    input: {
      name: string;
      barcode: string;
      categoryId: string;
      purchasePrice: number;
      salePrice: number;
      stock: number;
      minStock: number;
      active?: boolean;
    }
  ) {
    const category = await categoryRepository.listByTenant(tenantId);
    if (!category.some((c) => c.id === input.categoryId)) {
      throw new DomainError("Categoría inválida", "INVALID_CATEGORY");
    }
    try {
      const created = await productRepository.create({
        tenant: { connect: { id: tenantId } },
        category: { connect: { id: input.categoryId } },
        name: input.name,
        barcode: input.barcode,
        purchasePrice: new Prisma.Decimal(input.purchasePrice),
        salePrice: new Prisma.Decimal(input.salePrice),
        stock: input.stock,
        minStock: input.minStock,
        active: input.active ?? true,
      });
      return mapProductToDTO(created);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new DomainError("El código de barras ya existe en este comercio", "BARCODE_DUPLICATE");
      }
      throw e;
    }
  },

  async update(
    tenantId: string,
    id: string,
    input: Partial<{
      name: string;
      barcode: string;
      categoryId: string;
      purchasePrice: number;
      salePrice: number;
      stock: number;
      minStock: number;
      active: boolean;
    }>
  ) {
    const existing = await productRepository.findById(tenantId, id);
    if (!existing) {
      throw new DomainError("Producto no encontrado", "NOT_FOUND", 404);
    }
    if (input.categoryId) {
      const categories = await categoryRepository.listByTenant(tenantId);
      if (!categories.some((c) => c.id === input.categoryId)) {
        throw new DomainError("Categoría inválida", "INVALID_CATEGORY");
      }
    }
    const data: Prisma.ProductUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.barcode !== undefined) data.barcode = input.barcode;
    if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
    if (input.purchasePrice !== undefined) data.purchasePrice = new Prisma.Decimal(input.purchasePrice);
    if (input.salePrice !== undefined) data.salePrice = new Prisma.Decimal(input.salePrice);
    if (input.stock !== undefined) data.stock = input.stock;
    if (input.minStock !== undefined) data.minStock = input.minStock;
    if (input.active !== undefined) data.active = input.active;

    try {
      const updated = await productRepository.update(tenantId, id, data);
      return mapProductToDTO(updated);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new DomainError("El código de barras ya existe en este comercio", "BARCODE_DUPLICATE");
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw new DomainError("Producto no encontrado", "NOT_FOUND", 404);
      }
      throw e;
    }
  },

  async deactivate(tenantId: string, id: string) {
    return this.update(tenantId, id, { active: false });
  },
};
