import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionFromCookies } from "@/lib/auth/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSessionFromCookies();
  if (session?.role === Role.SUPER_ADMIN) {
    redirect("/admin");
  }
  if (session?.tenantSlug) {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Cargando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
