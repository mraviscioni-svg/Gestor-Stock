"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Boxes,
  Building2,
  Clock,
  History,
  LayoutDashboard,
  LogOut,
  Radio,
  ScanLine,
  ShoppingBasket,
  Sparkles,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantAdmin } from "@/components/layout/TenantAdminContext";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userLabel, canManageTenant, userRole, tenantBasePath, tenantName, logoUrl } =
    useTenantAdmin();
  const posOk = ["CASHIER", "ADMIN", "OWNER"].includes(userRole);
  const monitorOk = ["ADMIN", "OWNER", "VIEWER"].includes(userRole);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const settingsActive =
    pathname === `${tenantBasePath}/settings` || pathname.startsWith(`${tenantBasePath}/settings/`);

  const navItems: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
    { href: `${tenantBasePath}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${tenantBasePath}/products`, label: "Productos", icon: Boxes },
  ];
  if (posOk) {
    navItems.push({ href: `${tenantBasePath}/sales/pos`, label: "Punto de venta", icon: Store });
  }
  navItems.push(
    { href: `${tenantBasePath}/sales`, label: "Venta simple", icon: ScanLine },
    { href: `${tenantBasePath}/sales/open`, label: "Ventas abiertas", icon: Clock },
    { href: `${tenantBasePath}/sales/history`, label: "Historial", icon: History },
    { href: `${tenantBasePath}/stock`, label: "Stock", icon: ShoppingBasket }
  );
  if (monitorOk) {
    navItems.push({
      href: `${tenantBasePath}/manager/live-sales`,
      label: "Monitor en vivo",
      icon: Radio,
    });
  }

  useEffect(() => {
    function ping() {
      void fetch("/api/activity/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ page: pathname }),
      });
    }
    ping();
    const t = setInterval(ping, 45_000);
    return () => clearInterval(t);
  }, [pathname]);

  const dashHref = `${tenantBasePath}/dashboard`;

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:flex lg:min-h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <Link href={dashHref} className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                <img src={logoUrl} alt="" className="h-10 w-10 object-cover" />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
                <Sparkles className="h-5 w-5" />
              </span>
            )}
            <span>
              <span className="block text-sm font-semibold text-slate-900">{tenantName}</span>
              <span className="block text-xs text-slate-500 truncate max-w-[160px]" title={userLabel}>
                {userLabel}
              </span>
            </span>
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-6">
          {navItems.map((item) => {
            const base = tenantBasePath;
            const active =
              pathname === item.href ||
              (item.href !== dashHref &&
                item.href !== `${base}/sales` &&
                pathname.startsWith(`${item.href}/`)) ||
              (item.href === `${base}/sales` && pathname === `${base}/sales`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href={`${tenantBasePath}/settings`}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
              settingsActive
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Building2 className="h-4 w-4 shrink-0 opacity-90" />
            Comercio
          </Link>
        </nav>
        {canManageTenant ? (
          <p className="hidden px-4 text-xs text-slate-500 lg:block">
            Podés editar datos del comercio y el equipo desde Comercio.
          </p>
        ) : null}
        <div className="mt-auto hidden px-4 pb-6 lg:block">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </aside>

      <div className="min-h-screen">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <p className="text-sm font-semibold text-slate-900 truncate pr-2">{userLabel}</p>
          <button
            type="button"
            onClick={logout}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
