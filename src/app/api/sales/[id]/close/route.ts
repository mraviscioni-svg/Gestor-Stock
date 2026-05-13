import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { getTenantIdForRequest } from "@/lib/tenant";
import { saleCloseSchema } from "@/lib/validations";
import { saleService } from "@/services/sale.service";
import { handleRouteError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = saleCloseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const data = await saleService.closeDeferredSale(tenantId, session, id, parsed.data.paymentMethod);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
