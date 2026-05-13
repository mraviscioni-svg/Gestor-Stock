"use client";

import type { SaleDTO } from "@/types";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function SalesHistoryPage() {
  const [rows, setRows] = useState<SaleDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/sales", { credentials: "include" });
    const body = await res.json().catch(() => ({}));
    setRows(res.ok ? (body.data as SaleDTO[]) ?? [] : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Ventas</p>
        <h1 className="text-2xl font-semibold text-slate-900">Historial</h1>
        <p className="text-sm text-slate-600">
          Últimas ventas según tu rol (cajeros ven las propias; administración ve el comercio).
        </p>
      </div>
      {loading ? (
        <p className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Vendedor</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Pago</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                    {new Date(s.createdAt).toLocaleString("es-AR")}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{s.userName ?? "—"}</td>
                  <td className="px-3 py-2 font-medium">{money.format(s.total)}</td>
                  <td className="px-3 py-2">{s.paymentMethod ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {s.saleStatus}/{s.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
