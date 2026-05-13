import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runDemoSeed } from "@/lib/seed-demo";

/**
 * Seed inicial sin variables de entorno: solo se permite si aún no hay ningún
 * SUPER_ADMIN de plataforma (`tenantId = null`). Después responde 403.
 * En una DB pública, llamá este POST apenas desplegás (ventana corta).
 */
export async function POST() {
  const existing = await prisma.user.count({
    where: { role: Role.SUPER_ADMIN, tenantId: null },
  });
  if (existing > 0) {
    return NextResponse.json(
      { error: "Bootstrap no disponible: ya existe un administrador de plataforma." },
      { status: 403 }
    );
  }

  try {
    const out = await runDemoSeed({ disconnect: false });
    return NextResponse.json({
      ok: true,
      message: "Seed aplicado. Super admin y tenant demo listos (credenciales en demo-auth-defaults.ts).",
      ownerEmail: out.ownerEmail,
      superAdminEmail: out.superAdminEmail,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al ejecutar seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
