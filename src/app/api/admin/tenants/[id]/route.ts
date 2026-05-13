import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/auth/server";
import { adminTenantPatchSchema } from "@/lib/validations";
import { getClientIp, handleRouteError } from "@/lib/http";
import { platformAdminService } from "@/services/platformAdmin.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireSuperAdminSession();
    const { id } = await ctx.params;
    const data = await platformAdminService.getTenant(id);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requireSuperAdminSession();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = adminTenantPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const patch = { ...parsed.data };
    if (patch.logoUrl === "") patch.logoUrl = null;
    const ip = getClientIp(req);
    const data = await platformAdminService.patchTenant(session, id, patch, ip);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
