"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Radio } from "lucide-react";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

type LiveUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  online: boolean;
  lastSeenAt: string | null;
  currentPage: string | null;
  salesTodayCount: number;
  salesTodayPaidTotal: number;
  openSalesCount: number;
  pendingTotal: number;
  recentLines: { productName: string; quantity: number; at: string }[];
};

type OpenSale = {
  id: string;
  userId: string | null;
  userName: string | null;
  total: number;
  createdAt: string;
  items: { productName: string; quantity: number; lineTotal: number }[];
};

type Payload = {
  generatedAt: string;
  users: LiveUser[];
  openSales: OpenSale[];
};

export function LiveSalesClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/manager/live-sales", { credentials: "include" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof body.error === "string" ? body.error : "Error");
      setData(null);
      return;
    }
    setErr(null);
    setData(body.data as Payload);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 12000);
    return () => clearInterval(t);
  }, [load]);

  if (err) {
    return <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</p>;
  }
  if (!data) {
    return (
      <p className="flex items-center gap-2 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando monitor…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Gestión</p>
          <h1 className="text-2xl font-semibold text-slate-900">Monitor en vivo</h1>
          <p className="text-sm text-slate-600">
            Polling cada 12 s · Última actualización {new Date(data.generatedAt).toLocaleTimeString("es-AR")}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
          <Radio className="h-3.5 w-3.5" />
          Activo
        </span>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Equipo hoy</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.users.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{u.name ?? u.email}</p>
                  <p className="text-xs text-slate-500">{u.role}</p>
                </div>
                <span
                  className={
                    u.online
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800"
                      : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                  }
                >
                  {u.online ? "En línea" : "Fuera"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Última actividad: {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString("es-AR") : "—"}
                {u.currentPage ? ` · ${u.currentPage}` : ""}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                  <dt className="text-slate-500">Ventas hoy</dt>
                  <dd className="font-semibold text-slate-900">{u.salesTodayCount}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                  <dt className="text-slate-500">Cobrado hoy</dt>
                  <dd className="font-semibold text-slate-900">{money.format(u.salesTodayPaidTotal)}</dd>
                </div>
                <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                  <dt className="text-amber-800">Abiertas</dt>
                  <dd className="font-semibold text-amber-950">{u.openSalesCount}</dd>
                </div>
                <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                  <dt className="text-amber-800">Pendiente</dt>
                  <dd className="font-semibold text-amber-950">{money.format(u.pendingTotal)}</dd>
                </div>
              </dl>
              {u.recentLines.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                  {u.recentLines.map((r, i) => (
                    <li key={i}>
                      {r.productName} ×{r.quantity}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Ventas abiertas (tenant)</h2>
        {data.openSales.length === 0 ? (
          <p className="text-sm text-slate-600">Sin ventas pendientes de cobro.</p>
        ) : (
          <ul className="space-y-2">
            {data.openSales.map((s) => (
              <li key={s.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="font-medium">{s.userName ?? "—"}</span> · {money.format(s.total)} ·{" "}
                {new Date(s.createdAt).toLocaleString("es-AR")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
