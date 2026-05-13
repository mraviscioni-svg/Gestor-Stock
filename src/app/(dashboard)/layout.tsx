import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TenantAdminProvider } from "@/components/layout/TenantAdminContext";
import { getSessionFromCookies } from "@/lib/auth/server";
import { SESSION_COOKIE } from "@/lib/auth/token";
import { canManageTenant } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { active: true, email: true, name: true, role: true },
  });

  if (!dbUser) {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login");
  }

  if (!dbUser.active) {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login?reason=inactive");
  }

  const userLabel = dbUser.name?.trim() || dbUser.email;
  const manage = canManageTenant(dbUser.role);

  return (
    <TenantAdminProvider
      value={{ canManageTenant: manage, userLabel, userRole: dbUser.role }}
    >
      <DashboardShell>{children}</DashboardShell>
    </TenantAdminProvider>
  );
}
