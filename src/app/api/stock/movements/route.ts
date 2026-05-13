import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getTenantIdForRequest } from "@/lib/tenant";
import { stockService } from "@/services/stock.service";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const data = await stockService.listMovements(tenantId);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
