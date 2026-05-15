import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TenantAdminProvider } from "@/components/layout/TenantAdminContext";
import { getSessionFromCookies } from "@/lib/auth/server";
import { SESSION_COOKIE } from "@/lib/auth/token";
import { canManageTenant } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login?next=/dashboard");
  }
  if (session.role === Role.SUPER_ADMIN) {
    redirect("/admin");
  }
  if (!session.tenantId || !session.tenantSlug) {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { active: true, username: true, email: true, name: true, role: true, tenantId: true },
  });

  if (!dbUser || dbUser.tenantId !== session.tenantId) {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login");
  }

  if (!dbUser.active) {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login?reason=inactive");
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.tenantId },
    select: { name: true, logoUrl: true },
  });
  if (!tenant) {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login");
  }

  const userLabel = dbUser.name?.trim() || dbUser.username || dbUser.email || "Usuario";
  const manage = canManageTenant(dbUser.role);

  return (
    <TenantAdminProvider
      value={{
        canManageTenant: manage,
        userLabel,
        userRole: dbUser.role,
        tenantBasePath: "",
        tenantName: tenant.name,
        logoUrl: tenant.logoUrl,
      }}
    >
      <DashboardShell>{children}</DashboardShell>
    </TenantAdminProvider>
  );
}
