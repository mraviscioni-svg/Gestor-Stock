import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/auth/server";
import { categoryRepository } from "@/repositories/category.repository";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const tenantId = session.tenantId;
    const categories = await categoryRepository.listByTenant(tenantId);
    return NextResponse.json({ data: categories });
  } catch (e) {
    return handleRouteError(e);
  }
}
