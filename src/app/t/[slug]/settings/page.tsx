"use client";

import Link from "next/link";
import { Building2, ChevronRight, Users } from "lucide-react";
import { useTenantAdmin } from "@/components/layout/TenantAdminContext";

export default function SettingsHubPage() {
  const { canManageTenant, tenantBasePath } = useTenantAdmin();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Configuración</p>
        <h1 className="text-2xl font-semibold text-slate-900">Comercio</h1>
        <p className="text-sm text-slate-600">
          Nombre público del comercio y usuarios con acceso al panel. Los cambios aplican a todo el equipo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`${tenantBasePath}/settings/tenant`}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-slate-200/60 transition hover:border-sky-200 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Datos del comercio</p>
              <p className="mt-1 text-sm text-slate-600">
                Nombre visible y slug técnico (solo lectura en esta versión).
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-slate-600" />
        </Link>

        {canManageTenant ? (
          <Link
            href={`${tenantBasePath}/settings/users`}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-slate-200/60 transition hover:border-sky-200 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Equipo</p>
                <p className="mt-1 text-sm text-slate-600">Alta de usuarios, roles y activación.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-slate-600" />
          </Link>
        ) : (
          <div className="flex cursor-not-allowed items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 opacity-70">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-700">Equipo</p>
                <p className="mt-1 text-sm text-slate-600">
                  Solo dueños y administradores pueden gestionar el equipo.
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
          </div>
        )}
      </div>
    </div>
  );
}
