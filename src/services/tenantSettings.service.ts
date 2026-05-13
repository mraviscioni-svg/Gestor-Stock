import { tenantRepository } from "@/repositories/tenant.repository";
import { DomainError } from "@/lib/errors";

export const tenantSettingsService = {
  async getById(tenantId: string) {
    const t = await tenantRepository.findById(tenantId);
    if (!t) {
      throw new DomainError("Comercio no encontrado", "NOT_FOUND", 404);
    }
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      email: t.email,
      phone: t.phone,
      logoUrl: t.logoUrl,
      status: t.status,
      currentPlan: t.currentPlan,
      subscriptionStatus: t.subscriptionStatus,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  },

  async updateName(tenantId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new DomainError("El nombre no puede quedar vacío", "INVALID_NAME");
    }
    const t = await tenantRepository.updateName(tenantId, trimmed);
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      email: t.email,
      phone: t.phone,
      logoUrl: t.logoUrl,
      status: t.status,
      currentPlan: t.currentPlan,
      subscriptionStatus: t.subscriptionStatus,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  },
};
