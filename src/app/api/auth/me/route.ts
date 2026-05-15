import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireSession } from "@/lib/auth/server";
import { canManageTenant } from "@/lib/authz";
import { handleRouteError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    const [user] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, username: true, email: true, name: true, role: true, active: true },
      }),
    ]);
    if (!user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    if (session.role === Role.SUPER_ADMIN) {
      return NextResponse.json({
        data: {
          user,
          tenant: null,
          tenantSlug: null,
          canManageTenant: false,
          isPlatformAdmin: true,
        },
      });
    }

    if (!session.tenantId) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        email: true,
        status: true,
        currentPlan: true,
      },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        user,
        tenant,
        tenantSlug: session.tenantSlug,
        canManageTenant: canManageTenant(user.role),
        isPlatformAdmin: false,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
