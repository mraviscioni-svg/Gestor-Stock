import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireSuperAdminSession } from "@/lib/auth/server";
import { adminUserPatchSchema } from "@/lib/validations";
import { getClientIp, handleRouteError } from "@/lib/http";
import { platformAdminService } from "@/services/platformAdmin.service";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requireSuperAdminSession();
    const { id, userId } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = adminUserPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const p = parsed.data;
    const patch: {
      name?: string | null;
      role?: Role;
      active?: boolean;
      password?: string;
    } = {
      ...(p.name !== undefined && { name: p.name }),
      ...(p.active !== undefined && { active: p.active }),
      ...(p.password !== undefined && { password: p.password }),
      ...(p.role !== undefined ? { role: Role[p.role] } : {}),
    };
    if (patch.name === undefined && patch.role === undefined && patch.active === undefined && !patch.password) {
      return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
    }
    const ip = getClientIp(req);
    const data = await platformAdminService.patchUser(session, id, userId, patch, ip);
    if (!data) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      data: {
        ...data,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
