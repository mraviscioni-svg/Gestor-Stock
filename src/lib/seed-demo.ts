import bcrypt from "bcryptjs";
import {
  PaymentMethod,
  PaymentStatus,
  Role,
  SaleStatus,
  StockMovementReason,
  TenantStatus,
} from "@prisma/client";
import { prisma } from "./prisma";
import {
  DEMO_OWNER_EMAIL,
  DEMO_OWNER_PASSWORD,
  DEMO_TENANT_SLUG,
  LEGACY_DEMO_OWNER_EMAIL,
  PLATFORM_SUPER_ADMIN_EMAIL,
  PLATFORM_SUPER_ADMIN_PASSWORD,
} from "../config/demo-auth-defaults";

/**
 * Seed profesional: SUPER_ADMIN de plataforma, tenant demo, owner, cajero, catálogo, venta demo.
 * Usado por `prisma db seed` y bootstrap HTTP.
 */
export async function runDemoSeed(options?: { disconnect?: boolean }) {
  const shouldDisconnect = options?.disconnect ?? false;

  const superHash = await bcrypt.hash(PLATFORM_SUPER_ADMIN_PASSWORD, 12);
  const existingSuper = await prisma.user.findFirst({
    where: { email: PLATFORM_SUPER_ADMIN_EMAIL, role: Role.SUPER_ADMIN, tenantId: null },
  });
  if (existingSuper) {
    await prisma.user.update({
      where: { id: existingSuper.id },
      data: { passwordHash: superHash, active: true, name: "Platform Admin" },
    });
  } else {
    await prisma.user.create({
      data: {
        email: PLATFORM_SUPER_ADMIN_EMAIL,
        passwordHash: superHash,
        role: Role.SUPER_ADMIN,
        tenantId: null,
        name: "Platform Admin",
        active: true,
      },
    });
  }

  const passwordHash = await bcrypt.hash(DEMO_OWNER_PASSWORD, 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: DEMO_TENANT_SLUG },
    update: {
      name: "Tienda demo — Gestor de Stock",
      status: TenantStatus.ACTIVE,
      currentPlan: "demo",
    },
    create: {
      name: "Tienda demo — Gestor de Stock",
      slug: DEMO_TENANT_SLUG,
      status: TenantStatus.ACTIVE,
      email: "contacto@demo.gestor.stock",
      currentPlan: "demo",
    },
  });

  const ownerWithCanonical = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: DEMO_OWNER_EMAIL } },
  });
  const ownerWithLegacy = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: LEGACY_DEMO_OWNER_EMAIL } },
  });
  if (ownerWithLegacy && !ownerWithCanonical) {
    await prisma.user.update({
      where: { id: ownerWithLegacy.id },
      data: { email: DEMO_OWNER_EMAIL },
    });
  }

  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: DEMO_OWNER_EMAIL } },
    update: {
      passwordHash,
      role: Role.OWNER,
      tenantId: tenant.id,
      name: "Dueño Demo",
      active: true,
    },
    create: {
      email: DEMO_OWNER_EMAIL,
      passwordHash,
      role: Role.OWNER,
      tenantId: tenant.id,
      name: "Dueño Demo",
      active: true,
    },
  });

  const cashierEmail = "cajero@demo.gestor.stock";
  const cashierHash = await bcrypt.hash(DEMO_OWNER_PASSWORD, 12);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: cashierEmail } },
    update: { passwordHash: cashierHash, role: Role.CASHIER, active: true, name: "Cajero Demo" },
    create: {
      email: cashierEmail,
      passwordHash: cashierHash,
      role: Role.CASHIER,
      tenantId: tenant.id,
      name: "Cajero Demo",
      active: true,
    },
  });

  const categoriesData = [{ name: "Bebidas" }, { name: "Snacks" }, { name: "Lácteos" }];

  const categories: { id: string; name: string }[] = [];
  for (const c of categoriesData) {
    const row = await prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: c.name } },
      update: {},
      create: { tenantId: tenant.id, name: c.name },
    });
    categories.push(row);
  }

  const bebidas = categories.find((c) => c.name === "Bebidas")!;
  const snacks = categories.find((c) => c.name === "Snacks")!;
  const lacteos = categories.find((c) => c.name === "Lácteos")!;

  const productsSeed = [
    {
      name: "Agua 500ml",
      barcode: "7790310981234",
      categoryId: bebidas.id,
      purchasePrice: 80,
      salePrice: 150,
      stock: 40,
      minStock: 10,
    },
    {
      name: "Gaseosa Cola 500ml",
      barcode: "7790310981235",
      categoryId: bebidas.id,
      purchasePrice: 200,
      salePrice: 350,
      stock: 24,
      minStock: 8,
    },
    {
      name: "Alfajor triple",
      barcode: "7790310981236",
      categoryId: snacks.id,
      purchasePrice: 180,
      salePrice: 320,
      stock: 5,
      minStock: 10,
    },
    {
      name: "Leche entera 1L",
      barcode: "7790310981237",
      categoryId: lacteos.id,
      purchasePrice: 450,
      salePrice: 720,
      stock: 12,
      minStock: 6,
    },
  ];

  for (const p of productsSeed) {
    await prisma.product.upsert({
      where: { tenantId_barcode: { tenantId: tenant.id, barcode: p.barcode } },
      update: {
        name: p.name,
        categoryId: p.categoryId,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        stock: p.stock,
        minStock: p.minStock,
        active: true,
      },
      create: {
        tenantId: tenant.id,
        name: p.name,
        barcode: p.barcode,
        categoryId: p.categoryId,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        stock: p.stock,
        minStock: p.minStock,
        active: true,
      },
    });
  }

  const demoSaleExists = await prisma.sale.findFirst({
    where: { tenantId: tenant.id },
  });
  if (!demoSaleExists) {
    const agua = await prisma.product.findFirst({
      where: { tenantId: tenant.id, barcode: "7790310981234" },
    });
    if (agua) {
      const qty = 2;
      const unit = Number(agua.salePrice);
      const lineTotal = unit * qty;
      await prisma.$transaction(async (tx) => {
        const closed = new Date();
        const sale = await tx.sale.create({
          data: {
            tenantId: tenant.id,
            userId: owner.id,
            total: lineTotal,
            paymentMethod: PaymentMethod.DEBIT,
            paymentStatus: PaymentStatus.PAID,
            saleStatus: SaleStatus.CLOSED,
            closedAt: closed,
            items: {
              create: [
                {
                  productId: agua.id,
                  quantity: qty,
                  unitPrice: unit,
                  lineTotal,
                },
              ],
            },
          },
        });
        await tx.product.update({
          where: { id: agua.id },
          data: { stock: { decrement: qty } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: agua.id,
            quantity: -qty,
            reason: StockMovementReason.SALE,
            note: `Venta demo ${sale.id}`,
            userId: owner.id,
          },
        });
      });
    }
  }

  if (shouldDisconnect) {
    await prisma.$disconnect();
  }

  return {
    ownerEmail: DEMO_OWNER_EMAIL,
    tenantSlug: DEMO_TENANT_SLUG,
    superAdminEmail: PLATFORM_SUPER_ADMIN_EMAIL,
  };
}
