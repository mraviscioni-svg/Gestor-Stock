import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/auth/server";
import { canViewLiveManager } from "@/lib/authz";
import { AuthzError } from "@/lib/errors";
import { liveSalesService } from "@/services/liveSales.service";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireTenantSession();
    if (!canViewLiveManager(session.role)) {
      throw new AuthzError("No tenés acceso al monitor en vivo", 403);
    }
    const tenantId = session.tenantId;
    const data = await liveSalesService.getSnapshot(tenantId);
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
