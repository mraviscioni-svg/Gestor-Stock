import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

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
