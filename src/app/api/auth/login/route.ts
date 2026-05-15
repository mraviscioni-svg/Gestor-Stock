import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role, TenantStatus } from "@prisma/client";
import { SESSION_COOKIE, signSessionToken } from "@/lib/auth/token";
import { loginSchema } from "@/lib/validations";
import { userRepository } from "@/repositories/user.repository";
import { jsonError, getClientIp } from "@/lib/http";
import { auditService, AUDIT_ACTIONS } from "@/services/audit.service";

type LoginUser = Awaited<ReturnType<typeof userRepository.findLoginCandidatesByEmail>>[number];

function dedupeById(users: LoginUser[]) {
  const map = new Map<string, LoginUser>();
  for (const u of users) map.set(u.id, u);
  return [...map.values()];
}

async function resolveLoginCandidates(email: string) {
  const primary = await userRepository.findLoginCandidatesByEmail(email);
  return dedupeById(primary).filter((u) => u.tenantId && u.tenant);
}

function tenantChoices(users: LoginUser[]) {
  return users.map((u) => ({
    userId: u.id,
    tenantName: u.tenant!.name,
    role: u.role,
  }));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Credenciales inválidas", 400);
  }
  const { email: rawEmail, password, userId: rawUserId, tenantSlug: rawSlug, platformOnly } =
    parsed.data;
  const email = rawEmail.trim().toLowerCase();
  const tenantSlug =
    typeof rawSlug === "string" && rawSlug.trim() ? rawSlug.trim().toLowerCase() : undefined;

  const ip = getClientIp(req);

  const platformAdmin = await userRepository.findPlatformAdminByEmail(email);
  if (platformAdmin) {
    const ok = await bcrypt.compare(password, platformAdmin.passwordHash);
    if (!ok) {
      return NextResponse.json(
        {
          error: "Contraseña incorrecta para el administrador de plataforma.",
          code: "PLATFORM_AUTH_FAILED",
        },
        { status: 401 }
      );
    }
    if (!platformAdmin.active) {
      return jsonError("Cuenta desactivada.", 403);
    }
    let token: string;
    try {
      token = await signSessionToken({
        userId: platformAdmin.id,
        tenantId: null,
        tenantSlug: null,
        role: Role.SUPER_ADMIN,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[login] signSessionToken", e);
      return jsonError("No se pudo crear la sesión (JWT).", 503);
    }
    await auditService.log({
      actorUserId: platformAdmin.id,
      actorTenantId: null,
      action: AUDIT_ACTIONS.LOGIN,
      metadata: { scope: "platform" },
      ip,
    });
    const res = NextResponse.json({
      ok: true,
      redirectTo: "/admin",
      user: {
        id: platformAdmin.id,
        email: platformAdmin.email,
        name: platformAdmin.name,
        role: platformAdmin.role,
      },
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

  if (platformOnly) {
    return NextResponse.json(
      {
        error: "No existe un administrador de plataforma con ese email.",
        code: "PLATFORM_USER_NOT_FOUND",
        hint: "El seed crea `admin@gestor.platform` (ver `src/config/demo-auth-defaults.ts`). Si la base está vacía: redeploy (el build corre seed) o `POST /api/internal/bootstrap` una vez mientras no exista SUPER_ADMIN.",
      },
      { status: 404 }
    );
  }

  const candidates = await resolveLoginCandidates(email);

  let user: LoginUser | null = null;
  if (rawUserId) {
    user = candidates.find((u) => u.id === rawUserId) ?? null;
    if (!user) {
      return NextResponse.json(
        { error: "No hay una cuenta con ese email en el comercio elegido." },
        { status: 401 }
      );
    }
  } else if (tenantSlug) {
    user = candidates.find((u) => u.tenant!.slug === tenantSlug) ?? null;
    if (!user) {
      return NextResponse.json(
        { error: "No hay usuario con ese email en el comercio indicado." },
        { status: 401 }
      );
    }
  } else if (candidates.length === 1) {
    user = candidates[0]!;
  } else if (candidates.length > 1) {
    return NextResponse.json(
      {
        error: "Ese email está en más de un comercio. Elegí con cuál querés entrar.",
        code: "TENANT_CHOICE_REQUIRED",
        choices: tenantChoices(candidates),
      },
      { status: 400 }
    );
  }

  if (!user || !user.tenantId || !user.tenant) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  if (user.tenant.status !== TenantStatus.ACTIVE) {
    return jsonError("Este comercio no está activo. Contactá al soporte.", 403);
  }

  if (!user.active) {
    return jsonError("Cuenta desactivada. Contactá al administrador del comercio.", 403);
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  let token: string;
  try {
    token = await signSessionToken({
      userId: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
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
          ? `JWT_SECRET no llega al servidor o tiene menos de 16 caracteres (longitud detectada: ${secretLen}).`
          : `Fallo al firmar el token (${reason.slice(0, 120)}).`,
      },
      { status: 503 }
    );
  }

  await auditService.log({
    actorUserId: user.id,
    actorTenantId: user.tenantId,
    action: AUDIT_ACTIONS.LOGIN,
    metadata: { slug: user.tenant.slug },
    ip,
  });

  const redirectTo = "/dashboard";

  const res = NextResponse.json({
    ok: true,
    redirectTo,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    tenantId: user.tenantId,
    tenantSlug: user.tenant.slug,
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
