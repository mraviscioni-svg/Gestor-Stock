import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/server";
import { canUsePos } from "@/lib/authz";
import { PosSession } from "./pos-session";

export default async function PosPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");
  if (!canUsePos(session.role)) redirect("/dashboard");
  return <PosSession />;
}
