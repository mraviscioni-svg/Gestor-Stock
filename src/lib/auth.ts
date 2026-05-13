import { Role } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "@/types";

export const SESSION_COOKIE = "kiosco_session";

function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    tid: user.tenantId,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretBytes());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 16) return null;
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const tenantId = typeof payload.tid === "string" ? payload.tid : null;
    const role = payload.role;
    if (!userId || !tenantId || typeof role !== "string") return null;
    if (!Object.values(Role).includes(role as Role)) return null;
    return { userId, tenantId, role: role as Role };
  } catch {
    return null;
  }
}

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

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}
