"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductDTO } from "@/types";
import { ProductForm } from "@/components/ProductForm";
import { Button } from "@/components/ui/Button";
import { Pencil, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";

type Category = { id: string; name: string };

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDTO | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ includeInactive: "1" });
    if (q.trim()) params.set("q", q.trim());
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/products?${params.toString()}`, { credentials: "include" }),
      fetch("/api/categories", { credentials: "include" }),
    ]);
    const pJson = await pRes.json().catch(() => ({}));
    const cJson = await cRes.json().catch(() => ({}));
    if (pRes.ok) setProducts(pJson.data ?? []);
    if (cRes.ok) setCategories(cJson.data ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(t);
  }, [load]);

  const sorted = useMemo(() => products, [products]);

  async function deactivate(p: ProductDTO) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: false }),
    });
    if (res.ok) void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Catálogo</p>
          <h1 className="text-2xl font-semibold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-600">
            Búsqueda, alta y edición. El código de barras es único por tenant.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="self-start"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o código de barras"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-inner outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Listado</p>
          {loading ? <span className="text-xs text-slate-500">Actualizando…</span> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Compra</th>
                <th className="px-4 py-3 text-right">Venta</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((p) => (
                <tr key={p.id} className={!p.active ? "bg-slate-50/70 text-slate-500" : ""}>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.barcode}</td>
                  <td className="px-4 py-3 text-slate-600">{p.categoryName}</td>
                  <td className="px-4 py-3 text-right">{money.format(p.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {money.format(p.salePrice)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={p.stock <= p.minStock ? "font-semibold text-amber-700" : ""}>
                      {p.stock}
                    </span>
                    <span className="text-xs text-slate-500"> / min {p.minStock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {p.active ? (
                        <>
                          <ToggleRight className="h-3.5 w-3.5 text-emerald-600" />
                          Activo
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3.5 w-3.5 text-slate-400" />
                          Inactivo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setEditing(p);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      {p.active ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          onClick={() => deactivate(p)}
                        >
                          Desactivar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && sorted.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-slate-600" colSpan={8}>
                    No hay productos para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <ProductForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        initial={editing}
        onSaved={() => void load()}
      />
    </div>
  );
}
