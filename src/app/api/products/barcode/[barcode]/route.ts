import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/server";
import { getTenantIdForRequest } from "@/lib/tenant";
import { productService } from "@/services/product.service";
import { handleRouteError } from "@/lib/http";

type Params = { params: Promise<{ barcode: string }> };

export async function GET(_req: Request, ctx: Params) {
  try {
    const session = await requireSession();
    const tenantId = getTenantIdForRequest(session);
    const { barcode } = await ctx.params;
    const decoded = decodeURIComponent(barcode);
    const product = await productService.getByBarcode(tenantId, decoded);
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ data: product });
  } catch (e) {
    return handleRouteError(e);
  }
}
