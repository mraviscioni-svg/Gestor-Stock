import { Role } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/types";

export const SESSION_COOKIE = "kiosco_session";

function getJwtSecretBytes(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  const secret = typeof raw === "string" ? raw.trim() : "";
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  const payload: Record<string, unknown> = {
    role: String(user.role),
  };
  if (user.tenantId && user.tenantSlug) {
    payload.tid = user.tenantId;
    payload.tslug = user.tenantSlug;
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretBytes());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const raw = process.env.JWT_SECRET;
    const secret = typeof raw === "string" ? raw.trim() : "";
    if (!secret || secret.length < 16) return null;
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const roleRaw = payload.role;
    if (!userId || typeof roleRaw !== "string") return null;
    if (!Object.values(Role).includes(roleRaw as Role)) return null;
    const role = roleRaw as Role;

    const tenantId = typeof payload.tid === "string" ? payload.tid : null;
    const tenantSlug = typeof payload.tslug === "string" ? payload.tslug : null;

    if (role === Role.SUPER_ADMIN) {
      return { userId, tenantId: null, tenantSlug: null, role };
    }
    if (!tenantId || !tenantSlug) return null;
    return { userId, tenantId, tenantSlug, role };
  } catch {
    return null;
  }
}
