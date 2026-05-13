import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Boxes, CreditCard, Shield } from "lucide-react";
import { getSessionFromCookies } from "@/lib/auth";
import { dashboardService } from "@/services/dashboard.service";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }
  const summary = await dashboardService.getSummary(session.tenantId);

  const cards = [
    {
      title: "Ventas del día",
      value: money.format(summary.salesTodayTotal),
      hint: `${summary.salesTodayCount} tickets`,
      icon: CreditCard,
    },
    {
      title: "Productos activos",
      value: String(summary.productsCount),
      hint: "Catálogo publicado",
      icon: Boxes,
    },
    {
      title: "Bajo stock",
      value: String(summary.lowStockCount),
      hint: "Stock ≤ mínimo",
      icon: Activity,
    },
    {
      title: "Estado del sistema",
      value: summary.system.db === "ok" ? "Operativo" : "DB con problemas",
      hint: `Entorno ${summary.system.env}`,
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Resumen</p>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Vista rápida del tenant autenticado — datos filtrados por servidor.
          </p>
        </div>
        <Link
          href="/sales"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
        >
          Nueva venta
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {c.title}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{c.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.hint}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Última venta</h2>
            <Link href="/sales" className="text-xs font-semibold text-sky-700 hover:text-sky-800">
              Ir a ventas
            </Link>
          </div>
          {summary.lastSale ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Total:</span> {money.format(summary.lastSale.total)}
              </p>
              <p>
                <span className="font-semibold">Medio:</span> {summary.lastSale.paymentMethod}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(summary.lastSale.createdAt).toLocaleString("es-AR")}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Aún no hay ventas registradas.</p>
          )}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-900 p-6 text-white shadow-card ring-1 ring-white/10">
          <h2 className="text-sm font-semibold text-sky-100">Listo para cliente</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-100/90">
            Esta vista combina métricas diarias, inventario y salud del sistema. La lógica vive en
            servicios y repositorios para migrar el backend sin reescribir la UI.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-sky-50/90">
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
              Rol: {session.role}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
              Versión {summary.system.version}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
