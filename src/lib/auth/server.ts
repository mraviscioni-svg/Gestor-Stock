import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";
import { AuthError } from "@/lib/errors";
import type { SessionUser } from "@/types";

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionFromCookies();
  if (!session) {
    throw new AuthError("UNAUTHORIZED", 401);
  }
  return session;
}
