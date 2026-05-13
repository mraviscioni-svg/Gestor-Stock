"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2, LockKeyhole } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const isAdminLogin = typeof next === "string" && next.includes("/admin");
  const reason = searchParams.get("reason");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [slugChoices, setSlugChoices] = useState<{ slug: string; name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const slugTrim = tenantSlug.trim();
    const platformOnly = isAdminLogin;
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(slugTrim ? { tenantSlug: slugTrim } : {}),
        ...(platformOnly ? { platformOnly: true } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      if (res.status === 400 && data.code === "TENANT_SLUG_REQUIRED" && Array.isArray(data.tenants)) {
        setSlugChoices(data.tenants);
        const base =
          typeof data.error === "string" ? data.error : "Indicá en qué comercio querés entrar";
        setError(`${base}\n\nElegí el slug abajo o escribilo en el campo "Comercio (slug)".`);
        return;
      }
      if (res.status === 404 && data.code === "PLATFORM_USER_NOT_FOUND") {
        const hint = typeof data.hint === "string" ? data.hint : "";
        setError(
          `${typeof data.error === "string" ? data.error : "Usuario de plataforma no encontrado."}${hint ? `\n\n${hint}` : ""}`
        );
        return;
      }
      const base =
        typeof data.error === "string" ? data.error : "No se pudo iniciar sesión";
      const hint = typeof data.hint === "string" ? data.hint : null;
      setError(hint ? `${base}\n\n${hint}` : base);
      return;
    }
    setSlugChoices(null);
    const dest = typeof data.redirectTo === "string" ? data.redirectTo : next;
    router.push(dest);
    router.refresh();
  }

  const demoHint = process.env.NEXT_PUBLIC_DEMO_LOGIN_HINT;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/30">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Bienvenido</h1>
            <p className="text-sm text-slate-500">
              Ingresá con tu email. Si tenés varios comercios, indicá el slug del comercio.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {reason === "inactive" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100">
              Tu cuenta fue desactivada. Pedile a un dueño o administrador del comercio que la reactive.
            </p>
          ) : null}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {!isAdminLogin ? (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Comercio (slug)
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
                  type="text"
                  autoComplete="organization"
                  placeholder="solo si tenés más de un comercio"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Si el mismo email existe en varios comercios, el servidor te pedirá el slug.
                </p>
              </div>
              {slugChoices && slugChoices.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {slugChoices.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-800 shadow-sm hover:border-sky-300 hover:bg-sky-50"
                      onClick={() => {
                        setTenantSlug(t.slug);
                        setSlugChoices(null);
                      }}
                    >
                      <span className="font-mono text-sky-800">{t.slug}</span>
                      <span className="block text-slate-500">{t.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
              Acceso a la plataforma: usá el email y la contraseña del usuario{" "}
              <span className="font-semibold">SUPER_ADMIN</span> creado por el seed (por defecto{" "}
              <span className="font-mono">admin@gestor.platform</span>).
            </p>
          )}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contraseña
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="whitespace-pre-line rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
              {error}
            </p>
          ) : null}
          {demoHint ? (
            <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900 ring-1 ring-sky-100">
              {demoHint}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿Primera vez?{" "}
          <Link className="font-semibold text-sky-700 hover:text-sky-800" href="/">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
