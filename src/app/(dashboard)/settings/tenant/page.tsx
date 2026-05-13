"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTenantAdmin } from "@/components/layout/TenantAdminContext";

type TenantDto = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export default function TenantSettingsPage() {
  const { canManageTenant } = useTenantAdmin();
  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/tenants/me");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!cancelled) setError(typeof body.error === "string" ? body.error : "No se pudo cargar");
        if (!cancelled) setLoading(false);
        return;
      }
      const t = body.data as TenantDto;
      if (!cancelled) {
        setTenant(t);
        setName(t.name);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManageTenant) return;
    setSaving(true);
    setError(null);
    setOk(null);
    const res = await fetch("/api/tenants/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(typeof body.error === "string" ? body.error : "No se pudo guardar");
      return;
    }
    const t = body.data as TenantDto;
    setTenant(t);
    setName(t.name);
    setOk("Cambios guardados.");
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a comercio
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Comercio</p>
        <h1 className="text-2xl font-semibold text-slate-900">Datos del comercio</h1>
        <p className="text-sm text-slate-600">Identificador interno (slug) no se puede cambiar desde el panel.</p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : tenant ? (
        <div className="max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</p>
            <p className="mt-1 font-mono text-sm text-slate-800">{tenant.slug}</p>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tenant-name">
                Nombre
              </label>
              <input
                id="tenant-name"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4 disabled:opacity-60"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManageTenant}
                required
                maxLength={120}
              />
            </div>
            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">{error}</p>
            ) : null}
            {ok ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-100">{ok}</p>
            ) : null}
            {canManageTenant ? (
              <button
                type="submit"
                disabled={saving || name.trim() === tenant.name}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar
              </button>
            ) : (
              <p className="text-sm text-slate-600">Solo dueños y administradores pueden editar el nombre.</p>
            )}
          </form>
        </div>
      ) : (
        <p className="text-sm text-rose-600">{error ?? "Sin datos"}</p>
      )}
    </div>
  );
}
