import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/auth/server";
import { saleRepository, mapSaleToDTO } from "@/repositories/sale.repository";
import { handleRouteError } from "@/lib/http";

function startOfUtcDay() {
  const x = new Date();
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  try {
    const session = await requireTenantSession();
    const tenantId = session.tenantId;
    const rows = await saleRepository.listMyToday(tenantId, session.userId, startOfUtcDay());
    return NextResponse.json({ data: rows.map(mapSaleToDTO) });
  } catch (e) {
    return handleRouteError(e);
  }
}
