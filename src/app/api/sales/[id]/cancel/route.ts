import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/auth/server";
import { saleService } from "@/services/sale.service";
import { handleRouteError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, ctx: Ctx) {
  try {
    const session = await requireTenantSession();
    const tenantId = session.tenantId;
    const { id } = await ctx.params;
    const data = await saleService.cancelSale(tenantId, session, id);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
