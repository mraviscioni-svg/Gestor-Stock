import bcrypt from "bcryptjs";
import { PaymentMethod, Role, StockMovementReason } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Crea/actualiza tenant demo, usuario owner, categorías, productos y venta demo.
 * Usado por `prisma db seed` y por el bootstrap HTTP (Vercel).
 */
export async function runDemoSeed(options?: { disconnect?: boolean }) {
  const shouldDisconnect = options?.disconnect ?? false;

  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 8) {
    throw new Error(
      "SEED_DEMO_PASSWORD must be set and be at least 8 characters before running seed."
    );
  }

  const tenantSlug = "demo-kiosco";
  const ownerEmail = process.env.SEED_DEMO_OWNER_EMAIL ?? "owner@demo.kiosco.local";

  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: "Tienda demo — Gestor de Stock" },
    create: {
      name: "Tienda demo — Gestor de Stock",
      slug: tenantSlug,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      passwordHash,
      role: Role.OWNER,
      tenantId: tenant.id,
      name: "Dueño Demo",
    },
    create: {
      email: ownerEmail,
      passwordHash,
      role: Role.OWNER,
      tenantId: tenant.id,
      name: "Dueño Demo",
    },
  });

  const categoriesData = [
    { name: "Bebidas" },
    { name: "Snacks" },
    { name: "Lácteos" },
  ];

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
        const sale = await tx.sale.create({
          data: {
            tenantId: tenant.id,
            total: lineTotal,
            paymentMethod: PaymentMethod.DEBIT,
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
    tenantId: tenant.id,
    ownerEmail: owner.email,
  };
}
