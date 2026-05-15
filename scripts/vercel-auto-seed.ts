/**
 * En CI/Vercel: si faltan datos mínimos de seed, ejecuta `prisma db seed`.
 */
import { execSync } from "node:child_process";
import { PrismaClient, Role } from "@prisma/client";
import {
  DEMO_TENANT_SLUG,
  DEMO_OWNER_USERNAME,
  PLATFORM_SUPER_ADMIN_USERNAME,
} from "../src/config/demo-auth-defaults";

async function main() {
  const prisma = new PrismaClient();
  try {
    const superN = await prisma.user.count({
      where: { username: PLATFORM_SUPER_ADMIN_USERNAME, role: Role.SUPER_ADMIN, tenantId: null },
    });
    const demoN = await prisma.user.count({
      where: {
        tenant: { slug: DEMO_TENANT_SLUG },
        username: DEMO_OWNER_USERNAME,
      },
    });
    if (superN > 0 && demoN > 0) {
      // eslint-disable-next-line no-console
      console.log("[vercel-auto-seed] super admin y owner demo ya presentes, omitiendo");
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
