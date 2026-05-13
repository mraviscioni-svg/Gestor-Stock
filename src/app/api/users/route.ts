import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { requireTenantManager } from "@/lib/authz";
import { getTenantIdForRequest } from "@/lib/tenant";
import { userCreateSchema } from "@/lib/validations";
import { handleRouteError } from "@/lib/http";
import { userAdminService } from "@/services/userAdmin.service";

export async function GET() {
  try {
    const session = await requireSession();
    requireTenantManager(session);
    const tenantId = getTenantIdForRequest(session);
    const data = await userAdminService.list(tenantId);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => null);
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const data = await userAdminService.create(session, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
