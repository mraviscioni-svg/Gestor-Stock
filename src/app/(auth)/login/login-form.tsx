"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2, LockKeyhole } from "lucide-react";

type TenantChoice = { userId: string; tenantName: string; role: string };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const isAdminLogin = typeof next === "string" && next.includes("/admin");
  const reason = searchParams.get("reason");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantChoices, setTenantChoices] = useState<TenantChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitLogin(overrideUserId?: string) {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(overrideUserId ? { userId: overrideUserId } : {}),
        ...(isAdminLogin ? { platformOnly: true } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      if (res.status === 400 && data.code === "TENANT_CHOICE_REQUIRED" && Array.isArray(data.choices)) {
        setTenantChoices(data.choices as TenantChoice[]);
        setError(
          typeof data.error === "string"
            ? data.error
            : "Elegí el comercio con el que querés ingresar."
        );
        return;
      }
      if (res.status === 404 && data.code === "PLATFORM_USER_NOT_FOUND") {
        const hint = typeof data.hint === "string" ? data.hint : "";
        setError(
          `${typeof data.error === "string" ? data.error : "Usuario de plataforma no encontrado."}${hint ? `\n\n${hint}` : ""}`
        );
        return;
      }
      const base = typeof data.error === "string" ? data.error : "No se pudo iniciar sesión";
      const hint = typeof data.hint === "string" ? data.hint : null;
      setError(hint ? `${base}\n\n${hint}` : base);
      return;
    }
    setTenantChoices(null);
    const dest = typeof data.redirectTo === "string" ? data.redirectTo : next;
    router.push(dest);
    router.refresh();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submitLogin();
  }

  const demoHint = process.env.NEXT_PUBLIC_DEMO_LOGIN_HINT;
  const Wrapper = "div";

  return (
    <Wrapper className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Wrapper className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-200/80">
        <Wrapper className="flex items-center gap-3">
          <Wrapper className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/30">
            <LockKeyhole className="h-5 w-5" />
          </Wrapper>
          <Wrapper>
            <h1 className="text-lg font-semibold text-slate-900">Bienvenido</h1>
            <p className="text-sm text-slate-500">
              Ingresá con tu email y contraseña. Tu comercio se asigna automáticamente al iniciar sesión.
            </p>
          </Wrapper>
        </Wrapper>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {reason === "inactive" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100">
              Tu cuenta fue desactivada. Pedile a un dueño o administrador del comercio que la reactive.
            </p>
          ) : null}
          <Wrapper>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Wrapper>
          {isAdminLogin ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
              Acceso a la plataforma: usuario <span className="font-semibold">SUPER_ADMIN</span> (por defecto{" "}
              <span className="font-mono">admin@gestor.platform</span>).
            </p>
          ) : null}
          {tenantChoices && tenantChoices.length > 0 ? (
            <Wrapper className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Elegí comercio</p>
              <Wrapper className="flex flex-col gap-2">
                {tenantChoices.map((t) => (
                  <button
                    key={t.userId}
                    type="button"
                    disabled={loading}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 shadow-sm hover:border-sky-300 hover:bg-sky-50 disabled:opacity-60"
                    onClick={() => void submitLogin(t.userId)}
                  >
                    <span className="font-semibold text-slate-900">{t.tenantName}</span>
                    <span className="block text-xs text-slate-500">Rol: {t.role}</span>
                  </button>
                ))}
              </Wrapper>
            </Wrapper>
          ) : null}
          <Wrapper>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contraseña</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Wrapper>
          {error ? (
            <p className="whitespace-pre-line rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
              {error}
            </p>
          ) : null}
          {demoHint ? (
            <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900 ring-1 ring-sky-100">{demoHint}</p>
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
      </Wrapper>
    </Wrapper>
  );
}
