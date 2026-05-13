import { requireSuperAdminSession } from "@/lib/auth/server";
import { platformAdminService } from "@/services/platformAdmin.service";

export default async function AdminHomePage() {
  await requireSuperAdminSession();
  const s = await platformAdminService.getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard SaaS</h1>
        <p className="text-sm text-slate-600">Métricas globales de la plataforma.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase text-slate-500">Tenants activos</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{s.tenantsActive}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase text-slate-500">Tenants totales</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{s.tenantsTotal}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase text-slate-500">Usuarios</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{s.usersTotal}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase text-slate-500">Ventas totales</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{s.salesTotal}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200/80">
        <h2 className="text-sm font-semibold text-slate-900">Actividad reciente (tenants)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Con sesión en los últimos 5 minutos: {s.tenantsOnlineCount} comercios con usuarios en línea.
        </p>
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {s.recentTenants.map((t) => (
            <li key={t.id} className="flex justify-between py-2">
              <span className="font-medium text-slate-800">{t.name}</span>
              <span className="text-slate-500">
                {t._count.users} usr · {t._count.sales} ventas
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
