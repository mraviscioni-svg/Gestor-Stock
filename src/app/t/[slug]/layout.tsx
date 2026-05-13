import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TenantAdminProvider } from "@/components/layout/TenantAdminContext";
import { getSessionFromCookies } from "@/lib/auth/server";
import { SESSION_COOKIE } from "@/lib/auth/token";
import { canManageTenant } from "@/lib/authz";
import { assertSlugMatchesSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type { TenantSessionUser } from "@/types";

export default async function TenantSpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSessionFromCookies();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/t/${slug}/dashboard`)}`);
  }
  if (session.role === Role.SUPER_ADMIN) {
    redirect("/admin");
  }
  if (!session.tenantId || !session.tenantSlug) {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login");
  }
  assertSlugMatchesSession(session as TenantSessionUser, slug);

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

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.tenantId, slug },
    select: { name: true, logoUrl: true },
  });
  if (!tenant) {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login");
  }

  const userLabel = dbUser.name?.trim() || dbUser.email;
  const manage = canManageTenant(dbUser.role);
  const tenantBasePath = `/t/${slug}`;

  return (
    <TenantAdminProvider
      value={{
        canManageTenant: manage,
        userLabel,
        userRole: dbUser.role,
        tenantBasePath,
        tenantName: tenant.name,
        logoUrl: tenant.logoUrl,
      }}
    >
      <DashboardShell>{children}</DashboardShell>
    </TenantAdminProvider>
  );
}
