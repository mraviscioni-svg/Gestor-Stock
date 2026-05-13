import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE, signSessionToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { userRepository } from "@/repositories/user.repository";
import { jsonError } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Credenciales inválidas", 400);
  }
  const { email, password } = parsed.data;
  const user = await userRepository.findByEmail(email);
  if (!user || !user.tenantId) {
    return jsonError("Usuario o contraseña incorrectos", 401);
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return jsonError("Usuario o contraseña incorrectos", 401);
  }

  const token = await signSessionToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    tenantId: user.tenantId,
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
