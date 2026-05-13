import { auditRepository, type AuditLogInput } from "@/repositories/audit.repository";

export const AUDIT_ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  TENANT_CREATED: "TENANT_CREATED",
  TENANT_UPDATED: "TENANT_UPDATED",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  ROLE_CHANGED: "ROLE_CHANGED",
  SALE_CREATED: "SALE_CREATED",
} as const;

export const auditService = {
  async log(input: AuditLogInput): Promise<void> {
    try {
      await auditRepository.create(input);
    } catch {
      // nunca romper el flujo principal por auditoría
    }
  },
};
