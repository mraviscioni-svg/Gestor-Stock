import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { requireTenantManager } from "@/lib/authz";
import { getTenantIdForRequest } from "@/lib/tenant";
import { tenantUpdateSchema } from "@/lib/validations";
import { handleRouteError } from "@/lib/http";
import { tenantSettingsService } from "@/services/tenantSettings.service";

export async function GET() {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const data = await tenantSettingsService.getById(tenantId);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    requireTenantManager(session);
    const tenantId = getTenantIdForRequest(session);
    const body = await req.json().catch(() => null);
    const parsed = tenantUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const data = await tenantSettingsService.updateName(tenantId, parsed.data.name);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
