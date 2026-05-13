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

export const saleCreateSchema = z.object({
  paymentMethod: paymentMethodSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1),
});

export const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  delta: z.coerce.number().int(),
  note: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
