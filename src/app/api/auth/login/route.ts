import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE, signSessionToken } from "@/lib/auth/token";
import { loginSchema } from "@/lib/validations";
import { userRepository } from "@/repositories/user.repository";
import { jsonError } from "@/lib/http";
import {
  DEMO_OWNER_EMAIL,
  LEGACY_DEMO_OWNER_EMAIL,
} from "@/config/demo-auth-defaults";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Credenciales inválidas", 400);
  }
  const { email: rawEmail, password } = parsed.data;
  const email = rawEmail.trim().toLowerCase();

  let user = await userRepository.findByEmail(email);
  if (!user && email === DEMO_OWNER_EMAIL.toLowerCase()) {
    user = await userRepository.findByEmail(LEGACY_DEMO_OWNER_EMAIL);
  }

  const isDemoEmail =
    email === DEMO_OWNER_EMAIL.toLowerCase() || email === LEGACY_DEMO_OWNER_EMAIL.toLowerCase();

  if (!user || !user.tenantId) {
    return NextResponse.json(
      {
        error: "Usuario o contraseña incorrectos",
        ...(isDemoEmail
          ? {
              hint: "Si es la primera vez en esta base, el próximo deploy en Vercel crea el usuario demo solo (build + seed). También podés: POST /api/internal/bootstrap (BOOTSTRAP_SECRET) o npm run db:seed con esta DATABASE_URL.",
            }
          : {}),
      },
      { status: 401 }
    );
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      {
        error: "Usuario o contraseña incorrectos",
        ...(isDemoEmail
          ? {
              hint: "Contraseña demo actual: la de src/config/demo-auth-defaults.ts. Si la base se sembró con otra clave, volvé a ejecutar bootstrap o db:seed para actualizar el hash.",
            }
          : {}),
      },
      { status: 401 }
    );
  }

  let token: string;
  try {
    token = await signSessionToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[login] signSessionToken", e);
    const reason = e instanceof Error ? e.message : String(e);
    const secretLen = process.env.JWT_SECRET?.trim().length ?? 0;
    const missingJwt = secretLen < 16 || reason.includes("JWT_SECRET");
    return NextResponse.json(
      {
        error: "No se pudo crear la sesión (JWT).",
        hint: missingJwt
          ? `JWT_SECRET no llega al servidor o tiene menos de 16 caracteres (longitud detectada: ${secretLen}). En Vercel: Settings → Environment Variables → JWT_SECRET debe tener tildado el entorno de ESTE deploy (Preview si la URL es de preview, Production si es producción). Guardá y hacé Redeploy sin caché.`
          : `Fallo al firmar el token (${reason.slice(0, 120)}). Probá Redeploy sin caché.`,
      },
      { status: 503 }
    );
  }

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
