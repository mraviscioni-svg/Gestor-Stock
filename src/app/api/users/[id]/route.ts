import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { userUpdateSchema } from "@/lib/validations";
import { handleRouteError } from "@/lib/http";
import { userAdminService } from "@/services/userAdmin.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const patch = parsed.data;
    if (patch.name === undefined && patch.role === undefined && patch.active === undefined) {
      return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
    }
    const data = await userAdminService.update(session, id, patch);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
