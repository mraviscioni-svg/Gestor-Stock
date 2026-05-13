import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/auth/server";
import { handleRouteError } from "@/lib/http";
import { platformAdminService } from "@/services/platformAdmin.service";

export async function GET() {
  try {
    await requireSuperAdminSession();
    const data = await platformAdminService.getStats();
    return NextResponse.json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
