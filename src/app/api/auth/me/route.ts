import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { canManageTenant } from "@/lib/authz";
import { getTenantIdForRequest } from "@/lib/tenant";
import { handleRouteError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const [user, tenant] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, name: true, role: true, active: true },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, slug: true },
      }),
    ]);
    if (!user || !tenant) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }
    return NextResponse.json({
      data: {
        user,
        tenant,
        canManageTenant: canManageTenant(user.role),
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
