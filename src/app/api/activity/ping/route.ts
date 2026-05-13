import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { getTenantIdForRequest } from "@/lib/tenant";
import { activityPingSchema } from "@/lib/validations";
import { activityService } from "@/services/activity.service";
import { handleRouteError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const body = await req.json().catch(() => ({}));
    const parsed = activityPingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", issues: parsed.error.flatten() }, { status: 400 });
    }
    const row = await activityService.ping(tenantId, session.userId, parsed.data.page ?? null);
    return NextResponse.json({
      data: { ok: true, lastSeenAt: row.lastSeenAt.toISOString() },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
