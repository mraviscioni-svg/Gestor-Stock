import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/auth/server";
import { stockAdjustSchema } from "@/lib/validations";
import { stockService } from "@/services/stock.service";
import { handleRouteError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const session = await requireTenantSession();
    const tenantId = session.tenantId;
    const body = await req.json().catch(() => null);
    const parsed = stockAdjustSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const movement = await stockService.adjustStock(tenantId, session.userId, {
      productId: parsed.data.productId,
      delta: parsed.data.delta,
      note: parsed.data.note,
    });
    return NextResponse.json({ data: movement }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
