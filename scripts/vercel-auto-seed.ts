/**
 * En CI/Vercel: si no hay datos mínimos de seed, ejecuta `prisma db seed`.
 *
 * Desactivar: VERCEL_SKIP_DEMO_SEED=1
 */
import { execSync } from "node:child_process";
import { PrismaClient, Role } from "@prisma/client";
import { DEMO_TENANT_SLUG } from "../src/config/demo-auth-defaults";

const SEED_SUPER_ADMIN_EMAIL =
  (typeof process.env.SEED_SUPER_ADMIN_EMAIL === "string" && process.env.SEED_SUPER_ADMIN_EMAIL.trim()) ||
  "admin@gestor.platform";

const DEMO_EMAILS = ["owner@demo.gestor.stock", "owner@demo.kiosco.local"];

async function main() {
  if (process.env.VERCEL_SKIP_DEMO_SEED === "1") {
    // eslint-disable-next-line no-console
    console.log("[vercel-auto-seed] VERCEL_SKIP_DEMO_SEED=1, omitiendo");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const superN = await prisma.user.count({
      where: { email: SEED_SUPER_ADMIN_EMAIL, role: Role.SUPER_ADMIN, tenantId: null },
    });
    const demoN = await prisma.user.count({
      where: {
        tenant: { slug: DEMO_TENANT_SLUG },
        email: { in: DEMO_EMAILS },
      },
    });
    if (superN > 0 || demoN > 0) {
      // eslint-disable-next-line no-console
      console.log("[vercel-auto-seed] datos de seed ya presentes, omitiendo");
      return;
    }
    // eslint-disable-next-line no-console
    console.log("[vercel-auto-seed] sin datos de seed, ejecutando prisma db seed...");
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
