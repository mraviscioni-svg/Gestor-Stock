import Link from "next/link";
import { requireSuperAdminSession } from "@/lib/auth/server";
import { platformAdminService } from "@/services/platformAdmin.service";

export default async function AdminTenantsPage() {
  await requireSuperAdminSession();
  const { items, total } = await platformAdminService.listTenants(1, 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tenants</h1>
          <p className="text-sm text-slate-600">Total: {total}</p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          Nuevo tenant
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow ring-1 ring-slate-200/80">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Usuarios</th>
              <th className="px-4 py-3">Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/tenants/${t.id}`} className="font-semibold text-sky-800 hover:underline">
                    {t.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{t.slug}</td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3">{t.counts.users}</td>
                <td className="px-4 py-3">{t.counts.sales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
