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
  DEMO_CASHIER_USERNAME,
  DEMO_OWNER_EMAIL,
  DEMO_OWNER_PASSWORD,
  DEMO_OWNER_USERNAME,
  DEMO_TENANT_SLUG,
  LEGACY_DEMO_OWNER_EMAIL,
  PLATFORM_SUPER_ADMIN_EMAIL,
  PLATFORM_SUPER_ADMIN_PASSWORD,
  PLATFORM_SUPER_ADMIN_USERNAME,
} from "../config/demo-auth-defaults";
import { normalizeUsername } from "./auth/username";

/** Asigna username a filas antiguas que solo tenían email. */
async function backfillUsernamesFromEmail() {
  const rows = await prisma.user.findMany({
    where: { username: null },
    select: { id: true, email: true, tenantId: true },
  });
  for (const row of rows) {
    if (!row.email) continue;
    const base =
      normalizeUsername(row.email.split("@")[0] || "user").replace(/[^a-z0-9._-]/g, "") || "user";
    let candidate = base;
    let n = 0;
    for (;;) {
      const clash = await prisma.user.findFirst({
        where: {
          tenantId: row.tenantId,
          username: candidate,
          NOT: { id: row.id },
        },
      });
      if (!clash) break;
      n += 1;
      candidate = `${base}${n}`;
    }
    await prisma.user.update({ where: { id: row.id }, data: { username: candidate } });
  }
}

/**
 * Seed profesional: SUPER_ADMIN de plataforma, tenant demo, owner, cajero, catálogo, venta demo.
 * Usado por `prisma db seed` y bootstrap HTTP.
 */
export async function runDemoSeed(options?: { disconnect?: boolean }) {
  const shouldDisconnect = options?.disconnect ?? false;

  await backfillUsernamesFromEmail();

  const superHash = await bcrypt.hash(PLATFORM_SUPER_ADMIN_PASSWORD, 12);
  const existingSuper = await prisma.user.findFirst({
    where: { username: PLATFORM_SUPER_ADMIN_USERNAME, role: Role.SUPER_ADMIN, tenantId: null },
  });
  if (existingSuper) {
    await prisma.user.update({
      where: { id: existingSuper.id },
      data: {
        passwordHash: superHash,
        active: true,
        name: "Platform Admin",
        username: PLATFORM_SUPER_ADMIN_USERNAME,
        email: PLATFORM_SUPER_ADMIN_EMAIL,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        username: PLATFORM_SUPER_ADMIN_USERNAME,
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

  const ownerWithCanonical = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: DEMO_OWNER_EMAIL },
  });
  const ownerWithLegacy = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: LEGACY_DEMO_OWNER_EMAIL },
  });
  if (ownerWithLegacy && !ownerWithCanonical) {
    await prisma.user.update({
      where: { id: ownerWithLegacy.id },
      data: { email: DEMO_OWNER_EMAIL, username: DEMO_OWNER_USERNAME },
    });
  }

  const owner = await prisma.user.upsert({
    where: { tenantId_username: { tenantId: tenant.id, username: DEMO_OWNER_USERNAME } },
    update: {
      passwordHash,
      role: Role.OWNER,
      tenantId: tenant.id,
      name: "Dueño Demo",
      active: true,
      email: DEMO_OWNER_EMAIL,
    },
    create: {
      username: DEMO_OWNER_USERNAME,
      email: DEMO_OWNER_EMAIL,
      passwordHash,
      role: Role.OWNER,
      tenantId: tenant.id,
      name: "Dueño Demo",
      active: true,
    },
  });

  const cashierHash = await bcrypt.hash(DEMO_OWNER_PASSWORD, 12);
  await prisma.user.upsert({
    where: { tenantId_username: { tenantId: tenant.id, username: DEMO_CASHIER_USERNAME } },
    update: {
      passwordHash: cashierHash,
      role: Role.CASHIER,
      active: true,
      name: "Cajero Demo",
      email: "cajero@demo.gestor.stock",
    },
    create: {
      username: DEMO_CASHIER_USERNAME,
      email: "cajero@demo.gestor.stock",
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
    ownerUsername: DEMO_OWNER_USERNAME,
    tenantSlug: DEMO_TENANT_SLUG,
    superAdminUsername: PLATFORM_SUPER_ADMIN_USERNAME,
  };
}
