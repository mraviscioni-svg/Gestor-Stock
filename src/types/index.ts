import type { PaymentMethod, PaymentStatus, Role, SaleStatus } from "@prisma/client";

export type { PaymentMethod, Role, PaymentStatus, SaleStatus };

/** Claims mínimos del JWT (cookie httpOnly). */
export type SessionUser = {
  userId: string;
  tenantId: string | null;
  tenantSlug: string | null;
  role: Role;
};

/** Sesión de usuario de un comercio (no SUPER_ADMIN de plataforma). */
export type TenantSessionUser = Omit<SessionUser, "tenantId" | "tenantSlug"> & {
  tenantId: string;
  tenantSlug: string;
};

export type ProductDTO = {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SaleLineInput = {
  productId: string;
  quantity: number;
};

export type SaleDTO = {
  id: string;
  tenantId: string;
  userId: string | null;
  userName: string | null;
  total: number;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  saleStatus: SaleStatus;
  closedAt: string | null;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

export type StockMovementDTO = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  note: string | null;
  createdAt: string;
};

export type DashboardSummary = {
  salesTodayCount: number;
  salesTodayTotal: number;
  productsCount: number;
  lowStockCount: number;
  lastSale: {
    id: string;
    total: number;
    paymentMethod: PaymentMethod | null;
    createdAt: string;
  } | null;
  system: {
    env: string;
    db: "ok" | "error";
    version: string;
  };
};
