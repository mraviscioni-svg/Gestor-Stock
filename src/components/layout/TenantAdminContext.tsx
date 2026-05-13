"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Role } from "@prisma/client";

export type TenantAdminContextValue = {
  canManageTenant: boolean;
  userLabel: string;
  userRole: Role;
};

const TenantAdminContext = createContext<TenantAdminContextValue | null>(null);

export function TenantAdminProvider({
  value,
  children,
}: {
  value: TenantAdminContextValue;
  children: ReactNode;
}) {
  return <TenantAdminContext.Provider value={value}>{children}</TenantAdminContext.Provider>;
}

export function useTenantAdmin(): TenantAdminContextValue {
  const ctx = useContext(TenantAdminContext);
  if (!ctx) {
    throw new Error("useTenantAdmin debe usarse dentro del panel autenticado");
  }
  return ctx;
}
