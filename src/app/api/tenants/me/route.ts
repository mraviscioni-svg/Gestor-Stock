import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/auth/server";
import { requireTenantManager } from "@/lib/authz";
import { tenantUpdateSchema } from "@/lib/validations";
import { handleRouteError } from "@/lib/http";
import { tenantSettingsService } from "@/services/tenantSettings.service";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const tenantId = session.tenantId;
    const data = await tenantSettingsService.getById(tenantId);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireTenantSession();
    requireTenantManager(session);
    const tenantId = session.tenantId;
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
