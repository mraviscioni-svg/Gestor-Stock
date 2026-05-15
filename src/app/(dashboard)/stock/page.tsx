"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductDTO } from "@/types";
import type { StockMovementDTO } from "@/types";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export default function StockPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [movements, setMovements] = useState<StockMovementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [delta, setDelta] = useState("0");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, mRes] = await Promise.all([
      fetch("/api/products?includeInactive=1", { credentials: "include" }),
      fetch("/api/stock/movements", { credentials: "include" }),
    ]);
    const pJson = await pRes.json().catch(() => ({}));
    const mJson = await mRes.json().catch(() => ({}));
    if (pRes.ok) {
      const data = (pJson.data as ProductDTO[]) ?? [];
      setProducts(data);
      setProductId((id) => id || data[0]?.id || "");
    }
    if (mRes.ok) setMovements((mJson.data as StockMovementDTO[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const lowStock = useMemo(
    () => products.filter((p) => p.active && p.stock <= p.minStock),
    [products]
  );

  async function adjust() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/stock/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        productId,
        delta: Number(delta),
        note: note || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "No se pudo ajustar");
      return;
    }
    setNote("");
    setDelta("0");
    setMsg("Movimiento registrado.");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Inventario</p>
        <h1 className="text-2xl font-semibold text-slate-900">Stock</h1>
        <p className="text-sm text-slate-600">
          Visualizá posiciones, alertas y registrá ajustes manuales con trazabilidad básica.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/80">
          <h2 className="text-sm font-semibold text-slate-900">Ajuste manual</h2>
          <p className="mt-1 text-xs text-slate-500">
            Delta positivo suma, negativo resta. No permite stock negativo.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Producto
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — stock {p.stock}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Delta
                </label>
                <input
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nota (opcional)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
                />
              </div>
            </div>
            {msg ? (
              <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900 ring-1 ring-sky-100">
                {msg}
              </p>
            ) : null}
            <Button type="button" disabled={saving || !productId} onClick={() => void adjust()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar ajuste
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Bajo stock</h2>
            {loading ? <span className="text-xs text-slate-500">Cargando…</span> : null}
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">Mínimo {p.minStock}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                  {p.stock} u.
                </span>
              </li>
            ))}
            {!loading && lowStock.length === 0 ? (
              <li className="py-3 text-sm text-slate-600">No hay alertas de stock mínimo.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200/80">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Stock actual</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Mínimo</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{p.minStock}</td>
                  <td className="px-4 py-3">
                    {p.active && p.stock <= p.minStock ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                        Bajo mínimo
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200/80">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Historial de movimientos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {new Date(m.createdAt).toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.productName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{m.reason}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{m.quantity}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{m.note ?? "—"}</td>
                </tr>
              ))}
              {!loading && movements.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-sm text-slate-600" colSpan={5}>
                    Sin movimientos todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
