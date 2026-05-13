/**
 * En CI/Vercel: si no hay usuario demo en la DB, ejecuta `prisma db seed`.
 * Así el primer deploy puede entrar al login sin POST /bootstrap manual.
 *
 * Desactivar: VERCEL_SKIP_DEMO_SEED=1
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const DEMO_EMAILS = ["owner@demo.gestor.stock", "owner@demo.kiosco.local"];

async function main() {
  if (process.env.VERCEL_SKIP_DEMO_SEED === "1") {
    // eslint-disable-next-line no-console
    console.log("[vercel-auto-seed] VERCEL_SKIP_DEMO_SEED=1, omitiendo");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const n = await prisma.user.count({
      where: { email: { in: DEMO_EMAILS } },
    });
    if (n > 0) {
      // eslint-disable-next-line no-console
      console.log("[vercel-auto-seed] usuario demo ya existe, omitiendo seed");
      return;
    }
    // eslint-disable-next-line no-console
    console.log("[vercel-auto-seed] sin usuario demo, ejecutando prisma db seed...");
    execSync("npx prisma db seed", { stdio: "inherit", env: process.env });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[vercel-auto-seed]", e);
  process.exit(1);
});
