import type { PaymentMethod, Role } from "@prisma/client";

export type { PaymentMethod, Role };

export type SessionUser = {
  userId: string;
  tenantId: string;
  role: Role;
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
  total: number;
  paymentMethod: PaymentMethod;
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
    paymentMethod: PaymentMethod;
    createdAt: string;
  } | null;
  system: {
    env: string;
    db: "ok" | "error";
    version: string;
  };
};
