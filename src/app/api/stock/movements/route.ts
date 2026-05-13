import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/auth/server";
import { stockService } from "@/services/stock.service";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const tenantId = session.tenantId;
    const data = await stockService.listMovements(tenantId);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
