import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { canManageOthersSales } from "@/lib/authz";
import { getTenantIdForRequest } from "@/lib/tenant";
import { Role } from "@prisma/client";
import { saleRepository, mapSaleToDTO } from "@/repositories/sale.repository";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const seeAllOpen = canManageOthersSales(session.role) || session.role === Role.VIEWER;
    const filterUserId = seeAllOpen ? null : session.userId;
    const rows = await saleRepository.listOpen(tenantId, filterUserId);
    return NextResponse.json({ data: rows.map(mapSaleToDTO) });
  } catch (e) {
    return handleRouteError(e);
  }
}
