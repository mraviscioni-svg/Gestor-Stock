import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/auth/server";
import {
  adminTenantCreateSchema,
} from "@/lib/validations";
import { getClientIp, handleRouteError } from "@/lib/http";
import { platformAdminService } from "@/services/platformAdmin.service";

export async function GET(req: Request) {
  try {
    await requireSuperAdminSession();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20));
    const data = await platformAdminService.listTenants(page, pageSize);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSuperAdminSession();
    const body = await req.json().catch(() => null);
    const parsed = adminTenantCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const ip = getClientIp(req);
    const data = await platformAdminService.createTenant(session, parsed.data, ip);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
