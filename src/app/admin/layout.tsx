import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { LogoutToLogin } from "@/components/admin/LogoutToLogin";
import { getSessionFromCookies } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login?next=/admin");
  }
  if (session.role !== Role.SUPER_ADMIN) {
    const dest = session.tenantSlug ? `/t/${session.tenantSlug}/dashboard` : "/login";
    redirect(dest);
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SaaS admin</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">Gestor Stock</p>
        <nav className="mt-6 flex flex-col gap-1 text-sm font-medium">
          <Link
            href="/admin"
            className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/tenants"
            className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
          >
            Tenants
          </Link>
        </nav>
        <LogoutToLogin />
      </aside>
      <main className="min-h-screen px-4 py-8 lg:px-10">{children}</main>
    </div>
  );
}
