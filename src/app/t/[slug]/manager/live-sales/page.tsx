import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/server";
import { canViewLiveManager } from "@/lib/authz";
import { LiveSalesClient } from "@/components/manager/LiveSalesClient";

export default async function LiveSalesManagerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSessionFromCookies();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/t/${slug}/manager/live-sales`)}`);
  if (!canViewLiveManager(session.role)) redirect(`/t/${slug}/dashboard`);
  return <LiveSalesClient />;
}
