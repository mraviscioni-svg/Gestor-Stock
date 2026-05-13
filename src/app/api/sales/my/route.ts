import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { getTenantIdForRequest } from "@/lib/tenant";
import { saleRepository, mapSaleToDTO } from "@/repositories/sale.repository";
import { handleRouteError } from "@/lib/http";

function startOfUtcDay() {
  const x = new Date();
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const rows = await saleRepository.listMyToday(tenantId, session.userId, startOfUtcDay());
    return NextResponse.json({ data: rows.map(mapSaleToDTO) });
  } catch (e) {
    return handleRouteError(e);
  }
}
