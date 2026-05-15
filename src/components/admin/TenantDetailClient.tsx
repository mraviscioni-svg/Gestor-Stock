"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TenantStatus } from "@prisma/client";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  subdomain: string | null;
  status: TenantStatus;
  currentPlan: string;
  subscriptionStatus: string;
  maxUsers: number | null;
  maxProducts: number | null;
  createdAt: string;
  updatedAt: string;
  counts: { users: number; sales: number; products: number };
};

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export function TenantDetailClient({ tenantId }: { tenantId: string }) {
  const [tenant, setTenant] = useState<TenantRow | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [tRes, uRes] = await Promise.all([
      fetch(`/api/admin/tenants/${tenantId}`, { credentials: "include" }),
      fetch(`/api/admin/tenants/${tenantId}/users`, { credentials: "include" }),
    ]);
    const tJson = await tRes.json().catch(() => ({}));
    const uJson = await uRes.json().catch(() => ({}));
    if (tRes.ok) setTenant(tJson.data as TenantRow);
    if (uRes.ok) setUsers((uJson.data as UserRow[]) ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        status: tenant.status,
        currentPlan: tenant.currentPlan,
        maxUsers: tenant.maxUsers,
        maxProducts: tenant.maxProducts,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Error al guardar");
      return;
    }
    setTenant(data.data as TenantRow);
  }

  async function createUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") ?? "").trim().toLowerCase();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "");
    const role = String(fd.get("role") ?? "CASHIER");
    const res = await fetch(`/api/admin/tenants/${tenantId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username,
        email: email || null,
        password,
        name: name || null,
        role,
      }),
    });
    if (res.ok) {
      e.currentTarget.reset();
      void load();
    }
  }

  if (loading || !tenant) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/tenants" className="text-xs font-semibold text-sky-700 hover:underline">
          ← Tenants
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{tenant.name}</h1>
        <p className="font-mono text-sm text-slate-500">{tenant.slug}</p>
      </div>

      <form onSubmit={onSave} className="space-y-4 rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200/80">
        <h2 className="text-sm font-semibold text-slate-900">Comercio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Nombre</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={tenant.name}
              onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Estado</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={tenant.status}
              onChange={(e) =>
                setTenant({ ...tenant, status: e.target.value as TenantStatus })
              }
            >
              {Object.values(TenantStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Plan</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={tenant.currentPlan}
              onChange={(e) => setTenant({ ...tenant, currentPlan: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={tenant.email ?? ""}
              onChange={(e) => setTenant({ ...tenant, email: e.target.value || null })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Max usuarios</label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={tenant.maxUsers ?? ""}
              onChange={(e) =>
                setTenant({
                  ...tenant,
                  maxUsers: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Max productos</label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={tenant.maxProducts ?? ""}
              onChange={(e) =>
                setTenant({
                  ...tenant,
                  maxProducts: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200/80">
        <h2 className="text-sm font-semibold text-slate-900">Usuarios ({users.length})</h2>
        <form onSubmit={createUser} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input name="username" type="text" required placeholder="usuario" className="rounded-xl border px-3 py-2 text-sm font-mono" />
          <input name="email" type="email" placeholder="email (opcional)" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="password" type="password" required placeholder="contraseña" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="name" placeholder="nombre" className="rounded-xl border px-3 py-2 text-sm" />
          <select name="role" className="rounded-xl border px-3 py-2 text-sm">
            <option value="CASHIER">CASHIER</option>
            <option value="VIEWER">VIEWER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="OWNER">OWNER</option>
          </select>
          <button type="submit" className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white sm:col-span-2 lg:col-span-4">
            Crear usuario
          </button>
        </form>
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium font-mono">{u.username}</span>
                {u.email ? <span className="ml-2 text-slate-500">{u.email}</span> : null}
                <span className="ml-2 text-xs text-slate-500">{u.role}</span>
              </span>
              <span className={u.active ? "text-emerald-700" : "text-slate-400"}>
                {u.active ? "activo" : "inactivo"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
