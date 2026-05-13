"use client";

import { useMemo, useState } from "react";
import type { ProductDTO } from "@/types";
import type { PaymentMethod } from "@prisma/client";
import { BarcodeInput } from "@/components/BarcodeInput";
import { Cart, type CartLine } from "@/components/Cart";
import { Button } from "@/components/ui/Button";
import { Loader2, ScanLine } from "lucide-react";

const methods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Efectivo" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT", label: "Crédito" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "MERCADO_PAGO", label: "Mercado Pago" },
];

export default function SalesPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<ProductDTO[]>([]);
  const [loadingManual, setLoadingManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.product.salePrice * l.quantity, 0),
    [lines]
  );

  function upsertLine(product: ProductDTO, qty = 1) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === product.id);
      if (idx === -1) return [...prev, { product, quantity: qty }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
      return copy;
    });
  }

  async function handleScan(code: string) {
    setScanMsg(null);
    const res = await fetch(`/api/products/barcode/${encodeURIComponent(code)}`, {
      credentials: "include",
    });
    if (res.status === 404) {
      setScanMsg("Producto no encontrado. Cargalo en la sección Productos.");
      return;
    }
    if (!res.ok) {
      setScanMsg("No se pudo buscar el producto.");
      return;
    }
    const data = await res.json();
    const product = data.data as ProductDTO;
    if (!product.active) {
      setScanMsg("El producto está inactivo.");
      return;
    }
    if (product.stock <= 0) {
      setScanMsg("Sin stock disponible.");
      return;
    }
    const current = lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
    if (current + 1 > product.stock) {
      setScanMsg("No hay stock suficiente para sumar otra unidad.");
      return;
    }
    upsertLine(product, 1);
  }

  async function searchManual() {
    setLoadingManual(true);
    const params = new URLSearchParams();
    if (manualQuery.trim()) params.set("q", manualQuery.trim());
    const res = await fetch(`/api/products?${params.toString()}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    setManualResults(res.ok ? (data.data as ProductDTO[]) ?? [] : []);
    setLoadingManual(false);
  }

  function changeQty(productId: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.product.id !== productId) return l;
        const max = l.product.stock;
        return { ...l, quantity: Math.min(quantity, max) };
      })
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  async function checkout() {
    setSubmitting(true);
    setScanMsg(null);
    const saleTotal = total;
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        paymentMethod: payment,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setScanMsg(typeof data.error === "string" ? data.error : "No se pudo registrar la venta");
      return;
    }
    setLines([]);
    setScanMsg(
      `Venta registrada por ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(saleTotal)}`
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Punto de venta</p>
        <h1 className="text-2xl font-semibold text-slate-900">Venta rápida</h1>
        <p className="text-sm text-slate-600">
          El lector USB/Bluetooth actúa como teclado: enfocá el campo y escaneá; Enter confirma el
          código.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/80">
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-sky-700" />
              <h2 className="text-sm font-semibold text-slate-900">Escáner (HID)</h2>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              No requiere permisos del navegador: el scanner “escribe” en el input y Enter dispara
              la búsqueda.
            </p>
            <div className="mt-4">
              <BarcodeInput onScan={handleScan} disabled={submitting} />
            </div>
            {scanMsg ? (
              <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900 ring-1 ring-sky-100">
                {scanMsg}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/80">
            <h2 className="text-sm font-semibold text-slate-900">Agregar manualmente</h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Buscar producto activo"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
              />
              <Button type="button" variant="outline" onClick={() => void searchManual()}>
                {loadingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {manualResults.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      Stock {p.stock} · {p.barcode}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      const current = lines.find((l) => l.product.id === p.id)?.quantity ?? 0;
                      if (current + 1 > p.stock) {
                        setScanMsg("Stock insuficiente.");
                        return;
                      }
                      upsertLine(p, 1);
                    }}
                  >
                    Agregar
                  </Button>
                </li>
              ))}
              {!loadingManual && manualResults.length === 0 && manualQuery ? (
                <li className="px-3 py-3 text-sm text-slate-600">Sin resultados.</li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/80">
            <h2 className="text-sm font-semibold text-slate-900">Medio de pago</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {methods.map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                    payment === m.value
                      ? "border-sky-500 bg-sky-50 text-sky-900"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    value={m.value}
                    checked={payment === m.value}
                    onChange={() => setPayment(m.value)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  {m.label}
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Total estimado:{" "}
                <span className="font-semibold text-slate-900">
                  {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
                    total
                  )}
                </span>
              </p>
              <Button type="button" disabled={lines.length === 0 || submitting} onClick={() => void checkout()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Registrar venta
              </Button>
            </div>
          </div>
        </div>

        <Cart lines={lines} onChangeQty={changeQty} onRemove={removeLine} />
      </div>
    </div>
  );
}
