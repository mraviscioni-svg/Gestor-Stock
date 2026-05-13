import Link from "next/link";
import { ArrowRight, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_55%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-16 lg:px-10">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/40">
              <Sparkles className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-sky-100/90">Gestor de Stock</p>
              <p className="text-xs text-slate-300">Operaciones claras. Crecimiento sin fricción.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-500/20 transition hover:bg-slate-100"
          >
            Ingresar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <main className="mt-20 grid flex-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-sky-100 ring-1 ring-white/10">
              <ShieldCheck className="h-3.5 w-3.5" />
              Multi-tenant desde el día uno
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Tu negocio, con la solidez de un producto SaaS real.
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-slate-200/90">
              Venta rápida con lector tipo teclado, stock confiable y paneles listos para mostrar al
              cliente. Deploy en Vercel con PostgreSQL administrado (Neon/Supabase) y Prisma.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
            >
              Ir al panel
              <LayoutDashboard className="h-4 w-4" />
            </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/10"
              >
                Acceso seguro
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              Si no iniciaste sesión, el panel te pedirá login. Ideal para demo controlada con datos
              seed.
            </p>
          </section>

          <section className="relative">
            <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
              <p className="text-sm font-semibold text-sky-100">Resumen operativo</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { t: "Ventas del día", d: "Total y cantidad" },
                  { t: "Stock crítico", d: "Alertas por mínimo" },
                  { t: "Catálogo", d: "Alta y edición ágil" },
                  { t: "Medios de pago", d: "Efectivo, tarjetas, MP" },
                ].map((c) => (
                  <div key={c.t} className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
                    <p className="text-sm font-medium text-white">{c.t}</p>
                    <p className="mt-1 text-xs text-slate-300">{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
