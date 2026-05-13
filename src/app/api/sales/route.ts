import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getTenantIdForRequest } from "@/lib/tenant";
import { saleCreateSchema } from "@/lib/validations";
import { saleRepository, mapSaleToDTO } from "@/repositories/sale.repository";
import { saleService } from "@/services/sale.service";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const rows = await saleRepository.listRecent(tenantId);
    return NextResponse.json({ data: rows.map(mapSaleToDTO) });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const body = await req.json().catch(() => null);
    const parsed = saleCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const sale = await saleService.createSale(tenantId, session.userId, parsed.data);
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
