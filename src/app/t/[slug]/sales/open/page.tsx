"use client";

import type { PaymentMethod } from "@prisma/client";
import type { SaleDTO } from "@/types";
import { useTenantAdmin } from "@/components/layout/TenantAdminContext";
import { PaymentSelector } from "@/components/pos/PaymentSelector";
import { Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function OpenSalesPage() {
  const { userRole } = useTenantAdmin();
  const [rows, setRows] = useState<SaleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [busy, setBusy] = useState<string | null>(null);

  const readOnly = userRole === "VIEWER";

  const load = useCallback(async () => {
    const res = await fetch("/api/sales/open", { credentials: "include" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof body.error === "string" ? body.error : "Error");
      setRows([]);
    } else {
      setErr(null);
      setRows(body.data as SaleDTO[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  async function closeSale(id: string) {
    setBusy(id);
    const res = await fetch(`/api/sales/${id}/close`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ paymentMethod: payment }),
    });
    setBusy(null);
    setClosingId(null);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(typeof b.error === "string" ? b.error : "No se pudo cobrar");
      return;
    }
    void load();
  }

  async function cancelSale(id: string) {
    setBusy(id);
    const res = await fetch(`/api/sales/${id}/cancel`, {
      method: "PATCH",
      credentials: "include",
    });
    setBusy(null);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(typeof b.error === "string" ? b.error : "No se pudo cancelar");
      return;
    }
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Ventas</p>
        <h1 className="text-2xl font-semibold text-slate-900">Ventas abiertas</h1>
        <p className="text-sm text-slate-600">
          Pendientes de cobro. Stock ya descontado. Actualización cada 15 s.
        </p>
      </div>
      {readOnly ? (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">Modo solo lectura.</p>
      ) : null}
      {err ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</p> : null}
      {loading ? (
        <p className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-600">No hay ventas pendientes.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((s) => (
            <li key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-500">{s.id.slice(0, 12)}…</p>
                  <p className="text-lg font-bold text-slate-900">{money.format(s.total)}</p>
                  <p className="text-xs text-slate-500">
                    {s.userName ?? "Usuario"} · {new Date(s.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                {!readOnly ? (
                  <div className="flex flex-wrap gap-2">
                    {closingId === s.id ? (
                      <div className="flex w-full flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:w-auto sm:min-w-[260px]">
                        <PaymentSelector variant="light" value={payment} onChange={setPayment} />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            disabled={busy === s.id}
                            onClick={() => void closeSale(s.id)}
                          >
                            Confirmar cobro
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            onClick={() => setClosingId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => setClosingId(s.id)}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          Cobrar
                        </button>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void cancelSale(s.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Anular
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {s.items.map((i) => (
                  <li key={i.id}>
                    {i.productName} × {i.quantity} — {money.format(i.lineTotal)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
