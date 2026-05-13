import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { getTenantIdForRequest } from "@/lib/tenant";
import { productCreateSchema } from "@/lib/validations";
import { productService } from "@/services/product.service";
import { handleRouteError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const includeInactive = searchParams.get("includeInactive") === "1";
    const data = await productService.list(tenantId, q, includeInactive);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const body = await req.json().catch(() => null);
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const created = await productService.create(tenantId, parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
