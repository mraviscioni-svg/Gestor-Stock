"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Error al crear");
      return;
    }
    const id = data.data?.id as string | undefined;
    if (id) router.push(`/admin/tenants/${id}`);
    else router.push("/admin/tenants");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nuevo tenant</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200/80">
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Nombre</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Slug (opcional)</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="se genera desde el nombre si lo dejás vacío"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Email contacto (opcional)</label>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear
        </button>
      </form>
    </div>
  );
}
