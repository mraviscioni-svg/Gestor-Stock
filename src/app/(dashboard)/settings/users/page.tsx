"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import type { Role } from "@prisma/client";
import { useTenantAdmin } from "@/components/layout/TenantAdminContext";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const roleLabels: Record<string, string> = {
  OWNER: "Dueño",
  ADMIN: "Administrador",
  CASHIER: "Cajero",
  VIEWER: "Solo lectura",
  SUPER_ADMIN: "Super admin",
};

export default function UsersSettingsPage() {
  const router = useRouter();
  const { canManageTenant, userLabel, tenantBasePath } = useTenantAdmin();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState<"ADMIN" | "CASHIER" | "VIEWER" | "OWNER">("CASHIER");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/users");
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(typeof body.error === "string" ? body.error : "No se pudo cargar el equipo");
      return;
    }
    setRows(body.data as UserRow[]);
  }

  useEffect(() => {
    if (!canManageTenant) {
      router.replace(`${tenantBasePath}/settings`);
      return;
    }
    void load();
  }, [canManageTenant, router]);

  async function patchUser(id: string, patch: { role?: UserRow["role"]; active?: boolean; name?: string | null }) {
    setError(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof body.error === "string" ? body.error : "No se pudo actualizar");
      return;
    }
    const updated = body.data as UserRow;
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: createUsername.trim().toLowerCase(),
        email: createEmail.trim() || null,
        password: createPassword,
        name: createName.trim() || null,
        role: createRole,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(typeof body.error === "string" ? body.error : "No se pudo crear el usuario");
      return;
    }
    const u = body.data as UserRow;
    setRows((prev) => [...prev, u]);
    setShowCreate(false);
    setCreateUsername("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateName("");
    setCreateRole("CASHIER");
  }

  if (!canManageTenant) {
    return (
      <p className="text-sm text-slate-600">
        Redirigiendo… <Loader2 className="inline h-4 w-4 animate-spin" />
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`${tenantBasePath}/settings`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a comercio
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Equipo</p>
          <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-600">
            El nombre de usuario es único en este comercio. Sesión actual:{" "}
            <span className="font-medium">{userLabel}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {showCreate ? (
        <form
          onSubmit={onCreate}
          className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-900">Alta de usuario</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</label>
              <input
                type="text"
                required
                minLength={3}
                pattern="[a-zA-Z0-9._-]+"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email (opcional)</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contraseña inicial</label>
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre (opcional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value as typeof createRole)}
              >
                <option value="CASHIER">Cajero</option>
                <option value="VIEWER">Solo lectura</option>
                <option value="ADMIN">Administrador</option>
                <option value="OWNER">Dueño</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">{error}</p>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="hidden px-4 py-3 sm:table-cell">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => (
                <tr key={u.id} className={cn(!u.active && "bg-slate-50/80 text-slate-500")}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{u.name || u.username || "—"}</p>
                    <p className="font-mono text-xs text-sky-800">{u.username}</p>
                    {u.email ? <p className="text-xs text-slate-500">{u.email}</p> : null}
                    <p className="mt-1 text-xs text-slate-500 sm:hidden">{roleLabels[u.role] ?? u.role}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <select
                      className="w-full max-w-[180px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium"
                      value={u.role}
                      onChange={(e) => void patchUser(u.id, { role: e.target.value as Role })}
                    >
                      <option value="OWNER">Dueño</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="CASHIER">Cajero</option>
                      <option value="VIEWER">Solo lectura</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                        u.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-200 text-slate-700"
                      )}
                    >
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                      onClick={() => void patchUser(u.id, { active: !u.active })}
                    >
                      {u.active ? "Desactivar" : "Reactivar"}
                    </button>
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
