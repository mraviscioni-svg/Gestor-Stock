import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireSuperAdminSession } from "@/lib/auth/server";
import { adminUserCreateSchema } from "@/lib/validations";
import { getClientIp, handleRouteError } from "@/lib/http";
import { platformAdminService } from "@/services/platformAdmin.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireSuperAdminSession();
    const { id } = await ctx.params;
    const rows = await platformAdminService.listUsers(id);
    return NextResponse.json({
      data: rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const session = await requireSuperAdminSession();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = adminUserCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const ip = getClientIp(req);
    const role = Role[parsed.data.role];
    const created = await platformAdminService.createUser(
      session,
      id,
      {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
        role,
      },
      ip
    );
    return NextResponse.json(
      {
        data: {
          ...created,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return handleRouteError(e);
  }
}
