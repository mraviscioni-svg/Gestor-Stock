import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getTenantIdForRequest } from "@/lib/tenant";
import { productPutSchema } from "@/lib/validations";
import { productService } from "@/services/product.service";
import { handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Params) {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = productPutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const updated = await productService.update(tenantId, id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (e) {
    return handleRouteError(e);
  }
}
