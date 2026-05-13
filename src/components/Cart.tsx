"use client";

import type { ProductDTO } from "@/types";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CartLine = {
  product: ProductDTO;
  quantity: number;
};

type Props = {
  lines: CartLine[];
  onChangeQty: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  className?: string;
};

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function Cart({ lines, onChangeQty, onRemove, className }: Props) {
  const total = lines.reduce((sum, l) => sum + l.product.salePrice * l.quantity, 0);

  return (
    <div className={cn("rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/80", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Carrito</h2>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {lines.length} ítems
        </p>
      </div>

      {lines.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Todavía no hay productos en el carrito.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {lines.map((l) => (
            <li key={l.product.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{l.product.name}</p>
                <p className="text-xs text-slate-500">{l.product.barcode}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Unitario {money.format(l.product.salePrice)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => onChangeQty(l.product.id, Math.max(1, l.quantity - 1))}
                  aria-label="Menos"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => onChangeQty(l.product.id, l.quantity + 1)}
                  aria-label="Más"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  onClick={() => onRemove(l.product.id)}
                  aria-label="Quitar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-slate-700">Total</p>
        <p className="text-lg font-semibold text-slate-900">{money.format(total)}</p>
      </div>
    </div>
  );
}
