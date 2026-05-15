import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/server";
import { canViewLiveManager } from "@/lib/authz";
import { LiveSalesClient } from "@/components/manager/LiveSalesClient";

export default async function LiveSalesManagerPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/manager/live-sales");
  if (!canViewLiveManager(session.role)) redirect("/dashboard");
  return <LiveSalesClient />;
}
