import { requireSuperAdminSession } from "@/lib/auth/server";
import { platformAdminService } from "@/services/platformAdmin.service";
import { TenantDetailClient } from "@/components/admin/TenantDetailClient";
import { DomainError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export default async function AdminTenantDetailPage(ctx: Ctx) {
  await requireSuperAdminSession();
  const { id } = await ctx.params;
  try {
    await platformAdminService.getTenant(id);
  } catch (e) {
    if (e instanceof DomainError && e.status === 404) {
      return <p className="text-sm text-rose-600">Tenant no encontrado.</p>;
    }
    throw e;
  }
  return <TenantDetailClient tenantId={id} />;
}
