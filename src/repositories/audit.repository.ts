import { prisma } from "@/lib/prisma";

export type AuditLogInput = {
  actorUserId?: string | null;
  actorTenantId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: unknown;
  ip?: string | null;
};

export const auditRepository = {
  async create(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? undefined,
        actorTenantId: input.actorTenantId ?? undefined,
        action: input.action,
        entityType: input.entityType ?? undefined,
        entityId: input.entityId ?? undefined,
        metadata: input.metadata === undefined ? undefined : (input.metadata as object),
        ip: input.ip ?? undefined,
      },
    });
  },
};
