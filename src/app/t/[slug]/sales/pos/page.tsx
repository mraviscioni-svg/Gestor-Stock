import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/server";
import { canUsePos } from "@/lib/authz";
import { PosSession } from "./pos-session";

export default async function PosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSessionFromCookies();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/t/${slug}/sales/pos`)}`);
  if (!canUsePos(session.role)) redirect(`/t/${slug}/dashboard`);
  return <PosSession />;
}
