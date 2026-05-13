import { z } from "zod";
import { PaymentMethod, TenantStatus } from "@prisma/client";

export const paymentMethodSchema = z.nativeEnum(PaymentMethod);

export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  barcode: z.string().min(1).max(64),
  categoryId: z.string().min(1),
  purchasePrice: z.coerce.number().nonnegative(),
  salePrice: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative(),
  active: z.boolean().optional().default(true),
});

export const productPutSchema = productCreateSchema.partial();

export const saleCreateSchema = z
  .object({
    mode: z.enum(["immediate", "deferred"]).default("immediate"),
    paymentMethod: paymentMethodSchema.optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.coerce.number().int().positive(),
        })
      )
      .min(1),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "immediate" && data.paymentMethod === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Medio de pago requerido para venta inmediata",
        path: ["paymentMethod"],
      });
    }
  });

export const saleCloseSchema = z.object({
  paymentMethod: paymentMethodSchema,
});

export const activityPingSchema = z.object({
  page: z.string().max(200).optional(),
});

export const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  delta: z.coerce.number().int(),
  note: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  /** Slug del comercio si el mismo email existe en más de un tenant. */
  tenantSlug: z.string().max(80).optional(),
  /** Si es true (p. ej. login con next=/admin), no intentar login de comercio si no hay SUPER_ADMIN con ese email. */
  platformOnly: z.boolean().optional(),
});

const tenantRoleEnum = z.enum(["OWNER", "ADMIN", "CASHIER", "VIEWER"]);

export const tenantUpdateSchema = z.object({
  name: z.string().min(1).max(120).trim(),
});

export const userCreateSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  name: z.string().max(120).optional().nullable(),
  role: tenantRoleEnum.default("CASHIER"),
});

export const userUpdateSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  role: tenantRoleEnum.optional(),
  active: z.boolean().optional(),
});

export const adminTenantCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(64).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  status: z.nativeEnum(TenantStatus).optional(),
});

export const adminTenantPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  logoUrl: z.union([z.string().url().max(500), z.literal("")]).optional().nullable(),
  subdomain: z.string().max(64).optional().nullable(),
  status: z.nativeEnum(TenantStatus).optional(),
  currentPlan: z.string().max(64).optional(),
  maxUsers: z.coerce.number().int().positive().optional().nullable(),
  maxProducts: z.coerce.number().int().positive().optional().nullable(),
});

const platformTenantRoleEnum = z.enum(["OWNER", "ADMIN", "CASHIER", "VIEWER"]);

export const adminUserCreateSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  name: z.string().max(120).optional().nullable(),
  role: platformTenantRoleEnum.default("CASHIER"),
});

export const adminUserPatchSchema = z.object({
  name: z.string().max(120).optional().nullable(),
  role: platformTenantRoleEnum.optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
});
