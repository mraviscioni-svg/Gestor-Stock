"use client";

import type { PaymentMethod } from "@prisma/client";
import type { ProductDTO } from "@/types";
import { BarcodeInput } from "@/components/BarcodeInput";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { POSProductSearch } from "@/components/pos/POSProductSearch";
import { PaymentSelector } from "@/components/pos/PaymentSelector";

export type PosLine = { product: ProductDTO; quantity: number };

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function PosSession() {
  const [lines, setLines] = useState<PosLine[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"immediate" | "deferred" | null>(null);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.product.salePrice * l.quantity, 0),
    [lines]
  );

  const upsertLine = useCallback((product: ProductDTO, qty = 1) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === product.id);
      if (idx === -1) return [...prev, { product, quantity: qty }];
      const copy = [...prev];
      const nextQty = copy[idx].quantity + qty;
      const max = product.stock;
      copy[idx] = { ...copy[idx], quantity: Math.min(nextQty, max) };
      return copy;
    });
  }, []);

  async function handleScan(code: string) {
    setMsg(null);
    const res = await fetch(`/api/products/barcode/${encodeURIComponent(code)}`, { credentials: "include" });
    if (res.status === 404) {
      setMsg("Producto no encontrado.");
      return;
    }
    if (!res.ok) {
      setMsg("Error al buscar.");
      return;
    }
    const data = await res.json();
    const product = data.data as ProductDTO;
    if (!product.active) {
      setMsg("Producto inactivo.");
      return;
    }
    const current = lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
    if (current + 1 > product.stock) {
      setMsg("Sin stock suficiente.");
      return;
    }
    upsertLine(product, 1);
  }

  function setQty(productId: string, q: number) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.product.id !== productId) return l;
        return { ...l, quantity: Math.min(Math.max(1, q), l.product.stock) };
      })
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  async function submit(mode: "immediate" | "deferred") {
    if (lines.length === 0) {
      setMsg("Agregá al menos un producto.");
      return;
    }
    setSubmitting(mode);
    setMsg(null);
    const body: Record<string, unknown> = {
      mode,
      items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    };
    if (mode === "immediate") body.paymentMethod = payment;
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(null);
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "No se pudo guardar la venta");
      return;
    }
    setLines([]);
    setMsg(
      mode === "immediate"
        ? `Venta cobrada ${money.format(total)}`
        : `Venta pendiente guardada (${money.format(total)})`
    );
  }

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Punto de venta</p>
        <h1 className="text-2xl font-bold text-slate-900">POS</h1>
        <p className="text-sm text-slate-600">Tocá rápido: escáner, buscar, carrito y total siempre visible.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Código / scanner</p>
            <BarcodeInput className="mt-2" onScan={handleScan} />
          </div>
          <POSProductSearch onPick={(p) => upsertLine(p, 1)} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-4 text-white shadow-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <ShoppingCart className="h-5 w-5" />
              Carrito
            </div>
            <ul className="mt-3 max-h-[40vh] space-y-2 overflow-y-auto lg:max-h-[min(50vh,420px)]">
              {lines.length === 0 ? (
                <li className="rounded-xl bg-white/5 px-3 py-6 text-center text-sm text-slate-400">
                  Vacío — escaneá o buscá productos
                </li>
              ) : (
                lines.map((l) => (
                  <li
                    key={l.product.id}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-2 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.product.name}</p>
                      <p className="text-xs text-slate-400">{money.format(l.product.salePrice)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-black/20 p-0.5">
                      <button
                        type="button"
                        className="touch-manipulation rounded-md p-2 hover:bg-white/10"
                        aria-label="Menos"
                        onClick={() => setQty(l.product.id, l.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2rem] text-center font-semibold">{l.quantity}</span>
                      <button
                        type="button"
                        className="touch-manipulation rounded-md p-2 hover:bg-white/10"
                        aria-label="Más"
                        onClick={() => setQty(l.product.id, l.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="touch-manipulation rounded-lg p-2 text-rose-300 hover:bg-white/10"
                      aria-label="Quitar"
                      onClick={() => removeLine(l.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
              <p className="text-3xl font-bold tracking-tight">{money.format(total)}</p>
            </div>
            <div className="mt-4 space-y-3">
              <PaymentSelector value={payment} onChange={setPayment} disabled={lines.length === 0} />
              <button
                type="button"
                disabled={submitting !== null || lines.length === 0}
                onClick={() => void submit("immediate")}
                className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3 text-base font-bold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:opacity-40"
              >
                {submitting === "immediate" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Finalizar venta
              </button>
              <button
                type="button"
                disabled={submitting !== null || lines.length === 0}
                onClick={() => void submit("deferred")}
                className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-transparent py-3 text-base font-bold text-white transition hover:bg-white/10 disabled:opacity-40"
              >
                {submitting === "deferred" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Guardar pendiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {msg ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            msg.startsWith("Venta") ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100" : "bg-rose-50 text-rose-800 ring-1 ring-rose-100"
          }`}
        >
          {msg}
        </p>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-900">{money.format(total)}</p>
          </div>
          <button
            type="button"
            disabled={submitting !== null || lines.length === 0}
            onClick={() => void submit("immediate")}
            className="min-h-[48px] flex-1 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            Cobrar
          </button>
          <button
            type="button"
            disabled={submitting !== null || lines.length === 0}
            onClick={() => void submit("deferred")}
            className="min-h-[48px] rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-800 disabled:opacity-40"
          >
            Pendiente
          </button>
        </div>
      </div>
    </div>
  );
}
