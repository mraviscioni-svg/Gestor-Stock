import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getTenantIdForRequest } from "@/lib/tenant";
import { categoryRepository } from "@/repositories/category.repository";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const categories = await categoryRepository.listByTenant(tenantId);
    return NextResponse.json({ data: categories });
  } catch (e) {
    return handleRouteError(e);
  }
}
